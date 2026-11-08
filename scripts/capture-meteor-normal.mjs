// Public RPC reads only. All rehearsal writes must be signed through Meteor.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRpc} from '../app/public/verification/rpc.js';
import {checkTransaction, decode} from '../app/public/verification/engine.js';

const stage=process.argv[2];
assert.ok(['settled','single-vote','final'].includes(stage),'Use settled, single-vote or final');
const baseline=JSON.parse(await fs.readFile('docs/testnet/meteor-normal-baseline.json'));
const input=JSON.parse(await fs.readFile('docs/testnet/meteor-normal-inputs.json'));
const d=baseline.deployment, id=baseline.state.next_booking, proposalId=baseline.nextProposalId;
assert.equal(d.network,'testnet'); assert.equal(id,5);
const {rpc}=createRpc();
assert.equal((await rpc('status',[])).chain_id,'testnet');
const block=await rpc('block',{finality:'final'});
const view=async(account_id,method_name,args={})=>{
  const r=await rpc('query',{request_type:'call_function',account_id,method_name,args_base64:Buffer.from(JSON.stringify(args)).toString('base64'),block_id:block.header.hash});
  assert.equal(r.block_hash,block.header.hash);assert.equal(r.block_height,block.header.height);
  return JSON.parse(Buffer.from(r.result).toString());
};
const [state,ledger]=await Promise.all([view(d.contractId,'get_state'),view(d.contractId,'get_ledger')]);
const b=state.bookings[id];
const fileHash=async name=>createHash('sha256').update(await fs.readFile(`docs/testnet/normal-${name}.txt`)).digest('hex');
const pickupHash=await fileHash('pickup'),returnHash=await fileHash('return');
assert.deepEqual(b,{id,asset_id:'campus-camera',borrower:d.accounts.borrower,start:input.start,end:input.end,fee:1000,bond:10000,status:'Closed',pickup_hash:pickupHash,return_hash:returnHash,dispute_hash:null,damage:0});
assert.equal(state.dao,d.daoId); assert.equal(ledger.balanced,true);
assert.equal(ledger.deposited,baseline.ledger.deposited+11000);assert.equal(ledger.escrow,0);assert.equal(ledger.pending,0);
assert.equal(state.reputation[d.accounts.borrower],baseline.state.reputation[d.accounts.borrower]+1);
const kind={FunctionCall:{receiver_id:d.contractId,actions:[{method_name:'withdraw',args:'e30=',deposit:'0',gas:'100000000000000'}]}};
let proposal=null;
if(stage==='settled'){
  assert.equal(state.credits[d.accounts.borrower],10000);assert.equal(state.credits[d.daoId],1000);
  assert.equal(ledger.withdrawn,baseline.ledger.withdrawn);assert.equal(ledger.credits,11000);
}else{
  proposal=await view(d.daoId,'get_proposal',{id:proposalId});
  assert.deepEqual(proposal.kind,kind);
  assert.equal(state.credits[d.accounts.borrower],0);
  if(stage==='single-vote'){
    assert.equal(proposal.status,'InProgress');assert.equal(Object.keys(proposal.votes).length,1);
    assert.equal(state.credits[d.daoId],1000);assert.equal(ledger.withdrawn,baseline.ledger.withdrawn+10000);assert.equal(ledger.credits,1000);
  }else{
    assert.equal(proposal.status,'Approved');assert.deepEqual(proposal.votes,Object.fromEntries(d.council.map(a=>[a,'Approve'])));
    assert.deepEqual(proposal.vote_counts.council,[2,0,0]);assert.equal(ledger.credits,0);assert.equal(ledger.withdrawn,ledger.deposited);
  }
}
const verifiedReceipts=[];
if(stage==='final'){
  const rows=JSON.parse(await fs.readFile('docs/testnet/meteor-normal-receipts.json'));
  assert.deepEqual(rows.map(r=>r.id),['reserve','pickup','return','accept-return','borrower-withdraw','treasury-proposal','treasury-vote-1','treasury-vote-2']);
  assert.equal(new Set(rows.map(r=>r.hash)).size,8);
  const claims=[
    ['reserve',d.accounts.borrower,d.contractId,'reserve',{asset_id:'campus-camera',start:input.start,end:input.end},'111000000000000000000000',Buffer.from(String(id)).toString('base64')],
    ['pickup',d.accounts.custodian,d.contractId,'pickup',{id,evidence_hash:pickupHash}],
    ['return',d.accounts.borrower,d.contractId,'request_return',{id,evidence_hash:returnHash}],
    ['accept-return',d.accounts.custodian,d.contractId,'accept_return',{id,expected_hash:returnHash}],
    ['borrower-withdraw',d.accounts.borrower,d.contractId,'withdraw',{},'0','dHJ1ZQ=='],
    ['treasury-proposal',input.proposer,d.daoId,'add_proposal',{proposal:{description:'CommonKit withdraw: {}',kind}},'10000000000000000000000',Buffer.from(String(proposalId)).toString('base64')],
    ['treasury-vote-1',input.firstVoter,d.daoId,'act_proposal',{id:proposalId,action:'VoteApprove',proposal:kind,memo:null}],
    ['treasury-vote-2',input.secondVoter,d.daoId,'act_proposal',{id:proposalId,action:'VoteApprove',proposal:kind,memo:null}],
  ];
  assert.deepEqual([input.firstVoter,input.secondVoter].sort(),[...d.council].sort());
  const results={};
  for(const [index,[stepId,signerId,receiverId,method,args,deposit='0',returnValue='']] of claims.entries()){
    const expected={id:stepId,hash:rows[index].hash,signerId,receiverId,method,args,deposit,returnValue};
    const r=await rpc('EXPERIMENTAL_tx_status',{tx_hash:expected.hash,sender_account_id:signerId,wait_until:'FINAL'});
    const detail=checkTransaction(r,expected);results[stepId]=r;
    // Exclude signatures/keys and node metadata, retain the complete execution graph.
    const {signature,public_key,...transaction}=r.transaction;
    verifiedReceipts.push({...expected,detail,final_execution_status:r.final_execution_status,status:r.status,transaction,
      transaction_outcome:r.transaction_outcome,receipts:r.receipts.map(receipt=>{
        const copy=structuredClone(receipt);if(copy.receipt.Action)delete copy.receipt.Action.signer_public_key;return copy;
      }),receipts_outcome:r.receipts_outcome});
  }
  const actions=r=>r.receipt?.Action?.actions||[];
  const calls=(r,from,to,method)=>r.receipts.filter(receipt=>receipt.predecessor_id===from&&receipt.receiver_id===to&&actions(receipt).some(a=>a.FunctionCall?.method_name===method));
  assert.equal(calls(results['treasury-vote-1'],d.daoId,d.contractId,'withdraw').length,0);
  assert.equal(calls(results['treasury-vote-2'],d.daoId,d.contractId,'withdraw').length,1);
  for(const [step,recipient,micro,nonce] of [['borrower-withdraw',d.accounts.borrower,10000,baseline.state.next_nonce],['treasury-vote-2',d.daoId,1000,baseline.state.next_nonce+1]]){
    const r=results[step],outs=new Map(r.receipts_outcome.map(o=>[o.id,o.outcome]));
    const transfer=r.receipts.filter(receipt=>receipt.predecessor_id===d.contractId&&receipt.receiver_id===recipient&&actions(receipt).some(a=>a.Transfer?.deposit===String(BigInt(micro)*10n**18n)));
    assert.equal(transfer.length,1);assert.deepEqual(outs.get(transfer[0].receipt_id).status,{SuccessValue:''});
    const cb=calls(r,d.contractId,d.contractId,'on_withdrawal');assert.equal(cb.length,1);
    assert.deepEqual(JSON.parse(decode(actions(cb[0])[0].FunctionCall.args)),{nonce});
    assert.deepEqual(outs.get(cb[0].receipt_id).status,{SuccessValue:'dHJ1ZQ=='});
    assert.ok(transfer[0].receipt.Action.output_data_receivers.some(out=>out.receiver_id===d.contractId&&cb[0].receipt.Action.input_data_ids.includes(out.data_id)));
  }
}
const report={at:new Date().toISOString(),stage,url:'https://commonkit-testnet.muthukumarank.chatgpt.site',wallet:'Meteor Web in Chrome',block:{hash:block.header.hash,height:block.header.height},deployment:d,booking:b,state,ledger,proposal,verifiedReceipts,passed:true};
await fs.writeFile(`docs/testnet/meteor-normal-${stage}.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({stage,booking:id,proposal:proposal?.id,ledger,verifiedReceipts:verifiedReceipts.length}));
