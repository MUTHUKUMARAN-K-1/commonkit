import {Near,generateKey} from 'near-kit';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const old=JSON.parse(await fs.readFile('.testnet/accounts.json','utf8'));
let setup;try{setup=JSON.parse(await fs.readFile('.testnet/dao-setup.json','utf8'))}catch(e){if(e.code!=='ENOENT')throw e;const k=generateKey();setup={id:`ckdao-${Date.now().toString(36)}.testnet`,key:k.secretKey,publicKey:String(k.publicKey)};await fs.writeFile('.testnet/dao-setup.json',JSON.stringify(setup),{mode:0o600})}
const n=new Near({network:'testnet',privateKey:setup.key,defaultSignerId:setup.id});
const view=(id,m,a={})=>n.view(id,m,a);
const daoName=setup.id.split('.')[0],daoId=`${daoName}.sputnikv2.testnet`,contractId=`library.${setup.id}`;
const council=[old.accounts.governance.accountId,old.accounts.custodian.accountId];
const report={daoId,contractId,council,steps:[]};
async function record(label,tx){const r=await tx.send({waitUntil:'FINAL'});for(const o of r.receipts_outcome||[])assert.ok(!o.outcome.status.Failure,JSON.stringify(o.outcome.status));report.steps.push({label,hash:r.transaction.hash,status:r.status,receipts:r.receipts_outcome});await fs.writeFile('docs/testnet/dao-deployment.json',JSON.stringify(report,null,2));console.log(label,r.transaction.hash)}
async function exists(id){const r=await fetch('https://rpc.testnet.near.org',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'query',params:{request_type:'view_account',finality:'final',account_id:id}})});const d=await r.json();if(d.result)return true;if(d.error?.cause?.name==='UNKNOWN_ACCOUNT')return false;throw Error(JSON.stringify(d))}
if(!await exists(setup.id)){const r=await fetch('https://helper.nearprotocol.com/account',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({newAccountId:setup.id,newAccountPublicKey:setup.publicKey})});assert.ok(r.ok,await r.text());console.log('Faucet',setup.id)}
const policy={roles:[{name:'council',kind:{Group:council},permissions:['*:AddProposal','*:VoteApprove','*:VoteReject'],vote_policy:{}}],default_vote_policy:{weight_kind:'RoleWeight',quorum:'2',threshold:'2'},proposal_bond:'10000000000000000000000',proposal_period:'604800000000000',bounty_bond:'10000000000000000000000',bounty_forgiveness_period:'86400000000000'};
if(!await exists(daoId))await record('create-sputnik-dao',n.transaction(setup.id).functionCall('sputnikv2.testnet','create',{name:daoName,args:Buffer.from(JSON.stringify({config:{name:'CommonKit Council',purpose:'Two council votes govern the campus equipment library',metadata:''},policy})).toString('base64')},{gas:'300 Tgas',attachedDeposit:'6 NEAR'}));
report.policy=await view(daoId,'get_policy');assert.deepEqual(report.policy.default_vote_policy,policy.default_vote_policy);
if(!await exists(contractId)){const wasm=await fs.readFile('target/wasm32-unknown-unknown/release/commonkit_contract.wasm');await record('deploy-dao-controlled-library',n.transaction(setup.id).createAccount(contractId).transfer(contractId,'3.5 NEAR').deployContract(contractId,wasm).functionCall(contractId,'new',{dao:daoId},{gas:'100 Tgas'}));}
assert.equal((await view(contractId,'get_state')).dao,daoId);
const deployment={network:'testnet',contractId,daoId,council,governanceMode:'dao',accounts:Object.fromEntries(Object.entries(old.accounts).map(([k,v])=>[k,v.accountId]))};deployment.accounts.contract=contractId;await fs.writeFile('app/public/deployment.json',JSON.stringify(deployment,null,2));report.passed=true;await fs.writeFile('docs/testnet/dao-deployment.json',JSON.stringify(report,null,2));console.log(deployment);
