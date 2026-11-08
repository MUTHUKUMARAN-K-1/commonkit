// Dedicated testnet accounts only. Keys never leave this ignored directory.
import { Near, generateKey, parseKey } from 'near-kit';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
const file = p => new URL(p, root);
try {
  const active = JSON.parse(await readFile(file('app/public/deployment.json'),'utf8'));
  if(active.governanceMode==='dao') throw Error('DAO deployment is active. Use deploy:dao/setup:dao and the browser wallet; this legacy controller script cannot overwrite DAO configuration.');
} catch(e) { if(e.code!=='ENOENT') throw e; }
await mkdir(file('.testnet/'), {recursive:true});
await mkdir(file('app/public/'), {recursive:true});
await mkdir(file('docs/testnet/'), {recursive:true});
let config;
try { config=JSON.parse(await readFile(file('.testnet/accounts.json'),'utf8')); }
catch(e) {
  if(e.code!=='ENOENT') throw e;
  const id=`commonkit-${Date.now().toString(36)}.testnet`;
  config={network:'testnet',accounts:{}};
  for(const role of ['governance','contract','borrower','custodian']) {
    const key=generateKey();
    config.accounts[role]={accountId:role==='governance'?id:`${role}.${id}`,publicKey:String(key.publicKey),privateKey:key.secretKey};
  }
  await writeFile(file('.testnet/accounts.json'),JSON.stringify(config,null,2),{mode:0o600});
}
assert.equal(config.network,'testnet');
for(const a of Object.values(config.accounts)) a.publicKey=String(parseKey(a.privateKey).publicKey);
await writeFile(file('.testnet/accounts.json'),JSON.stringify(config,null,2),{mode:0o600});
for(const a of Object.values(config.accounts)) assert.ok(a.accountId.endsWith('.testnet'));
const client = role => new Near({network:'testnet',rpcUrl:'https://rpc.testnet.near.org',privateKey:config.accounts[role].privateKey,defaultSignerId:config.accounts[role].accountId});
const gov=client('governance'), reader=new Near({network:'testnet',rpcUrl:'https://rpc.testnet.near.org'});
const ids=Object.fromEntries(Object.entries(config.accounts).map(([r,a])=>[r,a.accountId]));
async function exists(accountId) {
  for(let attempt=0;attempt<4;attempt++) {
    const response=await fetch('https://rpc.testnet.near.org',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'query',params:{request_type:'view_account',account_id:accountId,finality:'final'}}),signal:AbortSignal.timeout(15000)});
    const data=await response.json();
    if(data.result)return true;
    if(data.error?.cause?.name==='UNKNOWN_ACCOUNT')return false;
    if(attempt===3)throw Error(`Account lookup failed: ${JSON.stringify(data.error)}`);
    await new Promise(r=>setTimeout(r,1000*(attempt+1)));
  }
}
const runId=new Date().toISOString().replace(/[:.]/g,'-');
const report={network:'testnet',startedAt:new Date().toISOString(),accounts:ids,governanceMode:'single-account test authority; Sputnik voting not yet integrated',steps:[]};
const save=async()=>{const data=JSON.stringify(report,null,2);await writeFile(file(`docs/testnet/${runId}.json`),data);await writeFile(file('docs/testnet/latest-run.json'),data);};
function check(outcome) {
  for(const o of [outcome.transaction_outcome,...(outcome.receipts_outcome||[])]) {
    if(o?.outcome?.status?.Failure) throw Error(JSON.stringify(o.outcome.status.Failure));
  }
  if(outcome.status?.Failure) throw Error(JSON.stringify(outcome.status.Failure));
  return outcome;
}
async function record(label,operation) {
  const outcome=check(await operation());
  report.steps.push({label,hash:outcome.transaction.hash,status:outcome.status,receipts:outcome.receipts_outcome});
  await save(); console.log(`${label}: ${outcome.transaction.hash}`); return outcome;
}
const call=(role,method,args={},deposit='0 NEAR')=>record(`${role}:${method}`,()=>client(role).transaction(ids[role]).functionCall(ids.contract,method,args,{gas:'150 Tgas',attachedDeposit:deposit}).send({waitUntil:'FINAL'}));
const state=()=>reader.view(ids.contract,'get_state',{});
async function reject(label,role,method,args,deposit='0 NEAR') {
  const before=await state();
  let error;
  try {await call(role,method,args,deposit);} catch(e) {error=e.message;}
  assert.ok(error,`${label} unexpectedly succeeded`);
  assert.match(error,/ExecutionError|panic|FunctionCallError|authorization|custodian|reserved|credit/i, 'Expected a contract rejection, not a transport error');
  assert.deepEqual(await state(),before,'Rejected call changed state');
  report.steps.push({label,expectedRejection:error}); await save();
}
try {
  if(!await exists(ids.governance)) {
    const response=await fetch('https://helper.nearprotocol.com/account',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({newAccountId:ids.governance,newAccountPublicKey:config.accounts.governance.publicKey}),signal:AbortSignal.timeout(45000)});
    const body=await response.text(); if(!response.ok) throw Error(`Faucet ${response.status}: ${body.slice(0,500)}`);
    console.log('Faucet requested:',ids.governance);
    for(let i=0;i<20 && !await exists(ids.governance);i++) await new Promise(r=>setTimeout(r,1500));
    assert.ok(await exists(ids.governance),'Faucet account creation not confirmed');
  }
  for(const role of ['contract','borrower','custodian']) {
    if(!await exists(ids[role])) await record(`create:${role}`,()=>gov.transaction(ids.governance).createAccount(ids[role]).transfer(ids[role],role==='contract'?'6 NEAR':role==='borrower'?'1 NEAR':'0.5 NEAR').addKey(config.accounts[role].publicKey,{type:'fullAccess'}).send({waitUntil:'FINAL'}));
  }
  const wasm=await readFile(file('target/wasm32-unknown-unknown/release/commonkit_contract.wasm'));
  report.wasmSha256=createHash('sha256').update(wasm).digest('hex');
  let initialized=false;
  try{await state(); initialized=true;}catch(e){if(!/not initialized|does not exist|CodeDoesNotExist|MethodNotFound|Contract is not initialized/i.test(e.message)) throw e;}
  if(!initialized) await record('deploy-and-initialize',()=>client('contract').transaction(ids.contract).deployContract(ids.contract,wasm).functionCall(ids.contract,'new',{dao:ids.governance},{gas:'100 Tgas'}).send({waitUntil:'FINAL'}));
  await writeFile(file('app/public/deployment.json'),JSON.stringify({network:'testnet',contractId:ids.contract,accounts:ids,governanceMode:report.governanceMode},null,2));
  if(process.argv.includes('--deploy-only')) {await save();process.exit(0);}
  await call('governance','set_member',{member:ids.borrower,admitted:true});
  const asset=`camera-${Date.now().toString(36)}`;
  await call('governance','register_asset',{id:asset,name:'Campus camera kit',custodian:ids.custodian,fee_micro_near:1000,bond_micro_near:10000});
  const evidence=createHash('sha256').update(`CommonKit testnet lifecycle ${asset}`).digest('hex');
  const start=Math.floor(Date.now()/1000)+25,end=start+1800;
  const id=(await state()).next_booking;
  await call('borrower','reserve',{asset_id:asset,start,end},'0.111 NEAR');
  await reject('overlap rejected','borrower','reserve',{asset_id:asset,start,end},'0.111 NEAR');
  while(Date.now()/1000<start+2) await new Promise(r=>setTimeout(r,1000));
  await call('custodian','pickup',{id,evidence_hash:evidence});
  await call('borrower','request_return',{id,evidence_hash:evidence});
  await reject('self-approval rejected','borrower','accept_return',{id,expected_hash:evidence});
  await call('custodian','accept_return',{id,expected_hash:evidence});
  assert.equal((await state()).bookings[id].status,'Closed');
  await reject('duplicate settlement rejected','custodian','accept_return',{id,expected_hash:evidence});
  const before=(await state()).total_withdrawn;
  await call('borrower','withdraw');
  assert.equal((await state()).credits[ids.borrower],0);
  assert.equal((await state()).total_withdrawn,before+10000);
  await call('governance','withdraw');
  const cancelId=(await state()).next_booking;
  await call('borrower','reserve',{asset_id:asset,start:end+10,end:end+100},'0.111 NEAR');
  await call('borrower','cancel',{id:cancelId});
  assert.equal((await state()).credits[ids.borrower],11000);
  await call('borrower','withdraw');
  report.ledger=await reader.view(ids.contract,'get_ledger',{});
  assert.equal(report.ledger.balanced,true); assert.equal(report.ledger.escrow,0); assert.equal(report.ledger.pending,0);
  report.completedAt=new Date().toISOString(); report.passed=true;await save(); console.log('TESTNET LIFECYCLE PASSED',ids.contract);
} catch(e) {report.passed=false;report.error=e.message;await save();console.error(e.message);process.exitCode=1;}
