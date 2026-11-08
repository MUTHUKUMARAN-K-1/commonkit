import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
const port=Number(process.env.PORT||4317);
let model=null, now=Math.floor(Date.now()/1000),events=[],queue=Promise.resolve();
function run(input){return new Promise((resolve,reject)=>{
 const child=spawn(root+'target/debug/commonkit-local',[],{stdio:['pipe','pipe','pipe']});let out='',err='';
 child.stdout.on('data',c=>out+=c);child.stderr.on('data',c=>err+=c);
 child.on('error',reject);child.on('close',code=>{if(code)return reject(Error(err||'Local engine failed'));try{resolve(JSON.parse(out))}catch(e){reject(e)}});
 child.stdin.end(JSON.stringify(input));
});}
function serial(fn){const p=queue.then(fn);queue=p.catch(()=>{});return p;}
async function body(req){let s='';for await(const c of req){s+=c;if(s.length>16384)throw Error('Request too large')}return JSON.parse(s||'{}');}
function json(res,status,value){res.writeHead(status,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(value));}
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1:'+port);
  if(req.method==='POST'){
   if(req.headers.origin&&!['http://127.0.0.1:'+port,'http://localhost:'+port].includes(req.headers.origin))return json(res,403,{error:'Local origin required'});
   const data=await body(req);
   return await serial(async()=>{
    if(url.pathname==='/api/reset'){model=null;events=[];now=Math.floor(Date.now()/1000);}
    else if(url.pathname==='/api/clock'){if(!Number.isSafeInteger(data.now)||data.now<now||data.now>now+365*86400)throw Error('Clock must move forward by at most one year');now=data.now;}
    else if(url.pathname==='/api/action'){
     const response=await run({...data,model,now});
     if(response.model)model=response.model;
     events.unshift({n:events.length+1,at:now,actor:data.actor,action:data.action,ok:response.ok,detail:response.error||'Applied to local state'});
     return json(res,response.ok?200:400,{...response,now,events:events.slice(0,60),mode:'local-simulation'});
    }else return json(res,404,{error:'Unknown route'});
    const state=await run({model,now,action:'state'});model=state.model;return json(res,200,{...state,now,events,mode:'local-simulation'});
   });
  }
  if(req.method!=='GET')return json(res,405,{error:'Unsupported method'});
  if(url.pathname==='/api/state')return await serial(async()=>{const state=await run({model,now,action:'state'});model=state.model;json(res,200,{...state,now,events,mode:'local-simulation'});});
  const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css'};
  const file=files[url.pathname];if(!file)return json(res,404,{error:'Not found'});
  res.writeHead(200,{'content-type':file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"});
  res.end(await readFile(root+'web/'+file));
 }catch(e){json(res,500,{error:e.message});}
}).listen(port,'127.0.0.1',()=>console.log(`CommonKit local simulation: http://127.0.0.1:${port}`));
