// Read-only evidence capture for Meteor UI rehearsals. Never signs transactions.
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRpc} from '../app/public/verification/rpc.js';
import {runVerification,checkTransaction,decode} from '../app/public/verification/engine.js';

const [run,stage]=process.argv.slice(2);
assert.match(run||'',/^(desktop|mobile)-(normal|dispute)$/);
assert.ok(['baseline','reserved','single-vote','settled','treasury-single-vote','final'].includes(stage));
const flow=run.endsWith('-normal')?'normal':'dispute';
const dir=path.resolve('docs/testnet/cobalt',run);
await fs.mkdir(dir,{recursive:true});
const read=async name=>JSON.parse(await fs.readFile(path.join(dir,name),'utf8'));
const write=async(name,data)=>fs.writeFile(path.join(dir,name),JSON.stringify(data,null,2)+'\n');
const deployment=JSON.parse(await fs.readFile('app/public/deployment.json','utf8'));
const template=JSON.parse(await fs.readFile(`app/public/verification/${flow==='normal'?'normal-manifest':'manifest'}.json`,'utf8'));
assert.equal(deployment.network,'testnet');
const transport=createRpc(),rpc=transport.rpc;
assert.equal((await rpc('status',[])).chain_id,'testnet');
const block=await rpc('block',{finality:'final'});
const view=async(account_id,method_name,args={})=>{
  const r=await rpc('query',{request_type:'call_function',account_id,method_name,args_base64:Buffer.from(JSON.stringify(args)).toString('base64'),block_id:block.header.hash});
  assert.equal(r.block_hash,block.header.hash);
  return JSON.parse(Buffer.from(r.result).toString());
};
const [state,ledger,nextProposal]=await Promise.all([view(deployment.contractId,'get_state'),view(deployment.contractId,'get_ledger'),view(deployment.daoId,'get_last_proposal_id')]);
assert.equal(ledger.balanced,true);
const report={capturedAt:new Date().toISOString(),run,stage,flow,network:'testnet',wallet:'Meteor Web / Chrome',viewport:run.startsWith('mobile')?'390x844 responsive desktop browser':'desktop',physicalMobile:false,block:{hash:block.header.hash,height:block.header.height},deployment,state,ledger,nextProposal};
if(stage==='baseline'){
  for(const key of ['escrow','credits','pending'])assert.equal(ledger[key],0,`Start with clean ${key} to isolate transfers`);
  await write('baseline.json',report);
}else{
  const baseline=await read('baseline.json'),id=baseline.state.next_booking,b=state.bookings[id];
  assert.ok(b,'Expected new booking');assert.equal(state.next_booking,id+1,'Concurrent booking detected');
  assert.equal(b.borrower,deployment.accounts.borrower);assert.equal(b.asset_id,'campus-camera');
  assert.equal(b.fee,baseline.state.assets[b.asset_id].fee);assert.equal(b.bond,baseline.state.assets[b.asset_id].bond);
  assert.equal(ledger.deposited,baseline.ledger.deposited+b.fee+b.bond);
  const hashes={};
  for(const name of ['pickup','return','damage','decision'])hashes[name]=createHash('sha256').update(await fs.readFile(`app/public/evidence/${name}.txt`)).digest('hex');
  report.booking=b;
  const sid=Number(baseline.nextProposal),tid=sid+(flow==='dispute'?1:0);
  const proposal=async proposalId=>view(deployment.daoId,'get_proposal',{id:proposalId});
  if(stage==='reserved')assert.equal(b.status,'Reserved');
  else{
    assert.equal(b.pickup_hash,hashes.pickup);assert.equal(b.return_hash,hashes.return);
    if(stage==='single-vote'){
      assert.equal(flow,'dispute');assert.equal(b.status,'Disputed');assert.equal(b.dispute_hash,hashes.damage);
      report.settlement=await proposal(sid);assert.equal(report.settlement.status,'InProgress');assert.equal(Object.keys(report.settlement.votes).length,1);
      assert.equal(ledger.escrow,b.fee+b.bond);assert.equal(ledger.credits,0);assert.equal(ledger.withdrawn,baseline.ledger.withdrawn);
    }else{
      assert.equal(b.status,'Closed');assert.equal(b.damage,flow==='dispute'?3000:0);assert.equal(b.dispute_hash,flow==='dispute'?hashes.decision:null);
      if(flow==='dispute'){report.settlement=await proposal(sid);assert.equal(report.settlement.status,'Approved');assert.deepEqual(report.settlement.votes,Object.fromEntries(deployment.council.map(a=>[a,'Approve'])));}
      if(stage==='settled'){
        assert.equal(state.credits[b.borrower],b.bond-b.damage);assert.equal(state.credits[state.dao],b.fee+b.damage);assert.equal(ledger.withdrawn,baseline.ledger.withdrawn);
      }else{
        report.treasury=await proposal(tid);
        if(stage==='treasury-single-vote'){assert.equal(report.treasury.status,'InProgress');assert.equal(Object.keys(report.treasury.votes).length,1);assert.equal(state.credits[state.dao],b.fee+b.damage);}
        else{
          assert.equal(report.treasury.status,'Approved');assert.deepEqual(report.treasury.votes,Object.fromEntries(deployment.council.map(a=>[a,'Approve'])));
          for(const key of ['escrow','credits','pending'])assert.equal(ledger[key],0);assert.equal(ledger.withdrawn,ledger.deposited);
          const rows=await read('receipts.json');
          const expectedIds=template.steps.map(s=>s.id);assert.deepEqual(rows.map(r=>r.id),expectedIds);
          const results={};
          for(const row of rows){
            assert.match(row.hash,/^[1-9A-HJ-NP-Za-km-z]{32,64}$/);assert.ok([deployment.accounts.borrower,...deployment.council].includes(row.signerId));
            results[row.id]=await rpc('EXPERIMENTAL_tx_status',{tx_hash:row.hash,sender_account_id:row.signerId,wait_until:'FINAL'});
          }
          const manifest={...template,flow,recordedAt:report.capturedAt,booking:b,treasury:report.treasury};
          if(flow==='dispute'){manifest.settlement=report.settlement;manifest.resolution={id,damage_micro_near:3000,evidence_hash:hashes.decision};}
          const treasury=report.treasury,settlement=report.settlement;
          const proposals={treasury,settlement};
          manifest.steps=template.steps.map(old=>{
            const row=rows.find(r=>r.id===old.id),s={...old,hash:row.hash,signerId:row.signerId};
            if(s.id==='reserve'){s.args={asset_id:b.asset_id,start:b.start,end:b.end};s.returnValue=Buffer.from(String(id)).toString('base64');assert.equal(s.signerId,b.borrower);}
            else if(s.id==='pickup'){s.args={id,evidence_hash:hashes.pickup};assert.equal(s.signerId,deployment.accounts.custodian);}
            else if(s.id==='return'){s.args={id,evidence_hash:hashes.return};assert.equal(s.signerId,b.borrower);}
            else if(s.id==='accept-return'){s.args={id,expected_hash:hashes.return};assert.equal(s.signerId,deployment.accounts.custodian);}
            else if(s.id==='dispute'){s.args={id,evidence_hash:hashes.damage};assert.equal(s.signerId,deployment.accounts.custodian);}
            else if(s.id==='borrower-withdraw')assert.equal(s.signerId,b.borrower);
            else{
              const p=proposals[s.id.startsWith('treasury')?'treasury':'settlement'];
              if(s.id.endsWith('-proposal')){s.args={proposal:{description:p.description,kind:p.kind}};s.returnValue=Buffer.from(String(p.id)).toString('base64');assert.equal(s.signerId,p.proposer);}
              else{s.args={id:p.id,action:'VoteApprove',proposal:p.kind,memo:null};assert.ok(deployment.council.includes(s.signerId));}
            }
            checkTransaction(results[s.id],s);return s;
          });
          const nonce=step=>{
            const callbacks=results[step].receipts.filter(r=>r.predecessor_id===deployment.contractId&&r.receiver_id===deployment.contractId).flatMap(r=>(r.receipt?.Action?.actions||[])).filter(a=>a.FunctionCall?.method_name==='on_withdrawal');
            assert.equal(callbacks.length,1);return JSON.parse(decode(callbacks[0].FunctionCall.args)).nonce;
          };
          manifest.withdrawals={borrowerNonce:nonce('borrower-withdraw'),daoNonce:nonce('treasury-vote-2')};
          for(const kind of flow==='normal'?['treasury']:['settlement','treasury'])assert.notEqual(manifest.steps.find(s=>s.id===`${kind}-vote-1`).signerId,manifest.steps.find(s=>s.id===`${kind}-vote-2`).signerId);
          report.verification=await runVerification(manifest,{rpc});assert.equal(report.verification.passed,true,JSON.stringify(report.verification.summary));
          await write('manifest.json',manifest);
          // Save public execution graph, omitting signatures and key fields.
          const sanitized=JSON.parse(JSON.stringify(results,(key,value)=>['signature','public_key','signer_public_key','metadata'].includes(key)?undefined:value));
          await write('transactions.json',sanitized);
        }
      }
    }
  }
  await write(`${stage}.json`,report);
}
console.log(JSON.stringify({run,stage,booking:report.booking?.id,nextBooking:state.next_booking,nextProposal,ledger,verification:report.verification?.summary}));
