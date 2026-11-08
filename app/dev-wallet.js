import { Near } from 'near-kit';
function dialog(title,render){return new Promise((resolve,reject)=>{const d=document.createElement('dialog');d.style.cssText='max-width:700px;width:90%;padding:24px;border:2px solid #b65027;max-height:90vh;overflow:auto';const h=document.createElement('h2');h.textContent=title;d.append(h);const end=value=>{d.close();d.remove();resolve(value)};render(d,end);d.addEventListener('cancel',e=>{e.preventDefault();d.close();d.remove();reject(Error('Wallet action cancelled'))});document.body.append(d);d.showModal()})}
const button=(d,label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;d.append(b);return b};
export async function connectDevWallet(){
 if(!import.meta.env.DEV||import.meta.env.VITE_DEV_WALLET!=='1'||location.origin!=='http://127.0.0.1:4320')throw Error('Local test wallet is disabled');
 const r=await fetch('/__dev-wallet/keys',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});if(!r.ok)throw Error('Local wallet unavailable');const {accounts,deployment}=await r.json();
 const role=await dialog('Local testnet wallet — select account',(d,end)=>{const p=document.createElement('p');p.textContent='Dedicated development keys, held in memory only. Real NEAR testnet signatures. No mainnet support.';d.append(p);for(const [role,a]of Object.entries(accounts))button(d,`${role}: ${a.accountId}`,()=>end(role));button(d,'Cancel',()=>end(null));});if(!role)throw Error('Wallet action cancelled');
 let selected=accounts[role];
 return {
 getAccounts:async()=>selected?[{accountId:selected.accountId,publicKey:selected.publicKey}]:[],
 disconnect:async()=>{selected=null},
 async signAndSendTransaction(tx){
  if(!selected||tx.network!=='testnet'||tx.signerId!==selected.accountId)throw Error('Invalid testnet signer');
  if(![deployment.contractId,deployment.daoId].includes(tx.receiverId))throw Error('Receiver is outside this test deployment');
  if(tx.actions.length!==1||tx.actions[0].type!=='FunctionCall')throw Error('Only one contract call is allowed');
  const a=tx.actions[0].params;
  const methods=tx.receiverId===deployment.daoId?['add_proposal','act_proposal']:['reserve','cancel','expire','pickup','request_return','accept_return','dispute','escalate','withdraw'];
  if(!methods.includes(a.methodName)||BigInt(a.deposit)>200000000000000000000000n||BigInt(a.gas)>300000000000000n)throw Error('Transaction exceeds local test wallet policy');
  const approved=await dialog('Review testnet transaction',(d,end)=>{const p=document.createElement('pre');p.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere';p.textContent=JSON.stringify({network:'testnet',signer:selected.accountId,receiver:tx.receiverId,method:a.methodName,args:a.args,depositYoctoNEAR:a.deposit,gas:a.gas},null,2);d.append(p);button(d,'Approve testnet transaction',()=>end(true));button(d,'Reject transaction',()=>end(false));});
  if(!approved)throw Error('Wallet action cancelled');
  const n=new Near({network:'testnet',privateKey:selected.privateKey,defaultSignerId:selected.accountId});
  const result=await n.transaction(selected.accountId).functionCall(tx.receiverId,a.methodName,a.args,{gas:a.gas,attachedDeposit:`${a.deposit} yocto`}).send({waitUntil:'FINAL'});
  return result;
 }
 };
}
