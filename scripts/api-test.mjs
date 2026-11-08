import {spawn} from 'node:child_process';
import {once} from 'node:events';
import assert from 'node:assert/strict';
const port=14317;
const server=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','inherit']});
try{
 await Promise.race([once(server.stdout,'data'),once(server,'exit').then(()=>{throw Error('Server exited before listening')})]);
 const base=`http://127.0.0.1:${port}`;
 async function request(path,data){const r=await fetch(base+path,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json'}:undefined,body:data?JSON.stringify(data):undefined});return {status:r.status,...await r.json()};}
 const s=await request('/api/state');const start=s.now+100,a=s.model.assets.camera;
 const act=(action,actor,args)=>request('/api/action',{action,actor,args});
 const booked=await act('reserve','muthu.testnet',{asset_id:'camera',start,end:start+7200,deposit:a.fee+a.bond});assert.equal(booked.status,200);const id=booked.result.booking_id;
 assert.equal((await act('reserve','robotics.testnet',{asset_id:'camera',start,end:start+3600,deposit:a.fee+a.bond})).status,400);
 await request('/api/clock',{now:start});
 assert.equal((await act('pickup',a.custodian,{id,hash:'a'.repeat(64)})).status,200);
 await act('request_return','muthu.testnet',{id,hash:'b'.repeat(64)});
 assert.equal((await act('accept_return','muthu.testnet',{id,hash:'b'.repeat(64)})).status,400);
 const closed=await act('accept_return',a.custodian,{id,hash:'b'.repeat(64)});assert.equal(closed.status,200);assert.equal(closed.model.credits['muthu.testnet'],a.bond);
 const w=await act('withdraw','muthu.testnet',{});const nonce=Object.values(w.model.pending)[0].nonce;
 const fail=await act('callback','local-simulator',{nonce,success:false});assert.equal(fail.model.credits['muthu.testnet'],a.bond);
 const retry=await act('withdraw','muthu.testnet',{});const done=await act('callback','local-simulator',{nonce:Object.values(retry.model.pending)[0].nonce,success:true});assert.equal(done.ledger.withdrawn,a.bond);assert(done.ledger.balanced);
 const origin=await fetch(base+'/api/reset',{method:'POST',headers:{Origin:'https://example.org','Content-Type':'application/json'},body:'{}'});assert.equal(origin.status,403);
 const page=await fetch(base);assert.equal(page.status,200);assert((await page.text()).includes('Local demo'));
 console.log('PASS API lifecycle: reserve, overlap rejection, pickup, return authorization, settlement, failed withdrawal recovery, retry, origin rejection and HTML response.');
}finally{server.kill();}
