import {defineConfig} from 'vite';
import fs from 'node:fs/promises';
export default defineConfig({root:'app',build:{outDir:'../dist'},plugins:[{
 name:'local-test-wallet',configureServer(server){
 if(process.env.VITE_DEV_WALLET!=='1')return;
 server.middlewares.use('/__dev-wallet/keys',async(req,res)=>{
  if(req.method!=='POST'||req.headers.origin!=='http://127.0.0.1:4320'||req.headers.host!=='127.0.0.1:4320'||req.headers['content-type']!=='application/json'){res.writeHead(403);return res.end('Local wallet origin required');}
  try{const data=JSON.parse(await fs.readFile('.testnet/accounts.json','utf8'));const deployment=JSON.parse(await fs.readFile('app/public/deployment.json','utf8'));const roles=['governance','custodian','borrower'];res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify({accounts:Object.fromEntries(roles.map(r=>[r,data.accounts[r]])),deployment}));}catch{res.writeHead(500);res.end('Test wallet unavailable');}
 });
 }}]});
