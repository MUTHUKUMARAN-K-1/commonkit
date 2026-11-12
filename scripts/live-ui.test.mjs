import test from 'node:test';
import assert from 'node:assert/strict';
import {attachedDeposit,toMicro,money} from '../app/amounts.js';
import {equipmentAvailability} from '../app/live-state.js';
import {assertWalletAccount,pendingReceipt,executionSucceeded,connectAccounts,connectionMessage,connectedWallet,uniqueWalletAccounts} from '../app/wallet-session.js';
import {membershipStatus,membershipDraft} from '../app/membership.js';

test('duplicate wallet accounts do not create a misleading account switcher',()=>{
  assert.deepEqual(uniqueWalletAccounts([{accountId:'borrower.testnet'},{accountId:'borrower.testnet'},{accountId:'council.testnet'},null,{accountId:''}]).map(a=>a.accountId),['borrower.testnet','council.testnet']);
  assert.deepEqual(uniqueWalletAccounts(null),[]);
});

test('transient wallet reads can recover without clearing the selected wallet',async()=>{
  let unavailable=true,selected='meteor-wallet';const wallet={getAccounts:async()=>[{accountId:'member.testnet'}]};
  const connector={getConnectedWallet:async()=>{if(unavailable)throw Error('Temporarily unavailable');return {wallet};},wallet:async()=>{selected=null;throw Error('Destructive fallback must not run');}};
  await assert.rejects(connectedWallet(connector),/Temporarily unavailable/);
  assert.equal(selected,'meteor-wallet');unavailable=false;
  assert.equal(await connectedWallet(connector),wallet);
});

test('connection reads accounts from the exact wallet that completed sign-in',async()=>{
  let requested;const accounts=[{accountId:'member.testnet'}];
  const connector={connect:async input=>{requested=input;return {getAccounts:async input=>{assert.equal(input.network,'testnet');return accounts;}};},wallet:()=>{throw Error('must not resolve another wallet');}};
  assert.deepEqual(await connectAccounts(connector,'meteor-wallet'),accounts);assert.deepEqual(requested,{walletId:'meteor-wallet'});
  await assert.rejects(connectAccounts({connect:async()=>({getAccounts:async()=>[]})}),/No testnet account/);
  await assert.rejects(connectAccounts({connect:async()=>{throw Error('Wallet closed');}}),/Wallet closed/);
  assert.match(connectionMessage(Error('Wallet closed')),/Connection cancelled/);
});

const membershipContext={account:'visitor.testnet',contractId:'library.testnet',model:{members:[],dao:'council.testnet'},fresh:true,policyVerified:true,council:['one.testnet','two.testnet'],policy:{proposal_period:'10000000000'},now:1000};
const admission={id:7,status:'InProgress',submission_time:'0',votes:{'one.testnet':'Approve'},kind:{FunctionCall:{receiver_id:'library.testnet',actions:[{method_name:'set_member',deposit:'0',args:btoa(JSON.stringify({member:'visitor.testnet',admitted:true}))}]}}};
test('membership requires fresh executed library state, not council status or votes',()=>{
  assert.equal(membershipStatus({...membershipContext,account:''}).kind,'disconnected');
  assert.equal(membershipStatus({...membershipContext,fresh:false,model:{members:['visitor.testnet']}}).kind,'checking');
  assert.equal(membershipStatus({...membershipContext,proposals:[{...admission,status:'Approved'}]}).kind,'visitor');
  assert.equal(membershipStatus({...membershipContext,model:{members:['visitor.testnet']}}).kind,'member');
  assert.match(membershipStatus({...membershipContext,proposals:[admission]}).title,/1 of 2/);
});
test('admission guidance ignores expired, unrelated, revoked or unverified proposals',()=>{
  const change=args=>({...admission,kind:{FunctionCall:{...admission.kind.FunctionCall,actions:[{...admission.kind.FunctionCall.actions[0],args:btoa(JSON.stringify(args))}]}}});
  for(const proposal of [change({member:'other.testnet',admitted:true}),change({member:'visitor.testnet',admitted:false}),{...admission,kind:{FunctionCall:{...admission.kind.FunctionCall,receiver_id:'other.testnet'}}}])assert.equal(membershipStatus({...membershipContext,proposals:[proposal]}).kind,'visitor');
  assert.equal(membershipStatus({...membershipContext,now:20000,proposals:[admission]}).kind,'visitor');
  assert.equal(membershipStatus({...membershipContext,policyVerified:false,proposals:[admission]}).kind,'visitor');
  const draft=membershipDraft('visitor.testnet','library.testnet','council.testnet');assert.match(draft,/Draft only — not sent/);assert.match(draft,/visitor.testnet/);assert.throws(()=>membershipDraft('','library.testnet','council.testnet'));
});
import {inspectFinalOutcome} from '../app/wallet-result.js';
test('booking deposit keeps microNEAR arithmetic exact',()=>{assert.equal(attachedDeposit(1000,10000,100000),'111000000000000000000000');assert.equal(toMicro('0.000001'),1);assert.equal(money(1000001),'1.000001 NEAR');assert.throws(()=>attachedDeposit(.1,1,1));});
test('expired reservations are not advertised as future reservations',()=>{const asset={id:'camera',enabled:true};assert.equal(equipmentAvailability(asset,{1:{asset_id:'camera',status:'Reserved',start:1,end:10}},20),'Available to reserve');assert.equal(equipmentAvailability(asset,{1:{asset_id:'camera',status:'Reserved',start:30,end:40}},20),'Future reservations');assert.equal(equipmentAvailability(asset,{1:{asset_id:'camera',status:'Disputed',start:1,end:10}},20),'Currently borrowed');});
test('unknown transaction blocks another send only for the affected signer/library',()=>{const receipts=[{signerId:'a',contractId:'lib',status:'unconfirmed'}];assert.ok(pendingReceipt(receipts,'a','lib'));assert.equal(pendingReceipt(receipts,'b','lib'),undefined);assert.equal(pendingReceipt([{...receipts[0],status:'executed'}],'a','lib'),undefined);});
test('wallet account must still be available before signing',async()=>{await assert.rejects(assertWalletAccount({getAccounts:async()=>[{accountId:'other'}]},'expected'),/changed/);assert.equal(await assertWalletAccount({getAccounts:async()=>[{accountId:'expected'}]},'expected'),'expected');});
test('UI success follows the real final outcome verifier and rejects child failure',()=>{const expected={hash:'A'.repeat(44),signerId:'borrower.testnet',receiverId:'library.testnet',method:'reserve'};const result={final_execution_status:'FINAL',transaction:{hash:expected.hash,signer_id:expected.signerId,receiver_id:expected.receiverId,actions:[{FunctionCall:{method_name:'reserve'}}]},status:{SuccessValue:''},receipts_outcome:[{outcome:{status:{SuccessValue:''}}}]};assert.equal(executionSucceeded(inspectFinalOutcome(result,expected)),true);result.receipts_outcome.push({outcome:{status:{Failure:'callback failed'}}});assert.equal(executionSucceeded(inspectFinalOutcome(result,expected)),false);for(const status of ['confirmed','unconfirmed',undefined])assert.equal(executionSucceeded({status}),false);});
