import fs from 'node:fs/promises';
import {createRpc} from '../app/public/verification/rpc.js';
import {runVerification} from '../app/public/verification/engine.js';

const args = process.argv.slice(2);
let flow = 'all', json = false, help = false;
try {
  for (let i=0; i<args.length; i++) {
    if(args[i]==='--json') json=true;
    else if(args[i]==='--help') help=true;
    else if(args[i]==='--flow' && ['normal','dispute','all'].includes(args[i+1])) flow=args[++i];
    else throw Error('Usage: npm run verify:testnet -- [--flow normal|dispute|all] [--json]');
  }
  if(help) {
    console.log('Read-only CommonKit testnet verification. Default: both flows. --flow normal|dispute|all selects a proof. No wallet, keys or dependencies needed. Exit 0: all pass; 1: mismatch; 2: incomplete/unavailable. --json emits the full report.');
  } else {
    const reports=[];
    for(const selected of flow==='all'?['normal','dispute']:[flow]) {
      const manifest=JSON.parse(await fs.readFile(new URL(`../app/public/verification/${selected==='normal'?'normal-manifest':'manifest'}.json`,import.meta.url),'utf8'));
      const transport=createRpc();
      if(!json) console.log(`\n${selected.toUpperCase()} / BOOKING #${manifest.booking.id}`);
      const report=await runVerification(manifest,{rpc:transport.rpc,onCheck:json?undefined:c=>console.log(`${c.status.padEnd(10)} ${c.label}\n           ${c.detail}`)});
      report.requests=transport.requests; reports.push(report);
    }
    const summary={pass:0,fail:0,unverified:0};
    for(const r of reports) for(const k of Object.keys(summary)) summary[k]+=r.summary[k];
    const passed=reports.every(r=>r.passed);
    const result=flow==='all'?{schemaVersion:1,flow:'all',passed,summary,reports}:reports[0];
    if(json) console.log(JSON.stringify(result,null,2));
    else console.log(`\n${summary.pass} passed; ${summary.fail} failed; ${summary.unverified} unverified. ${passed?'Selected flows verified.':'Verification incomplete or mismatched.'}\nRead-only public RPC evidence; not an audit or proof of physical handover.`);
    process.exitCode=passed?0:summary.fail?1:2;
  }
} catch(error) {
  console.log(json?JSON.stringify({passed:false,error:error.message}):`UNVERIFIED ${error.message}`); process.exitCode=2;
}
