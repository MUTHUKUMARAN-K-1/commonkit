import fs from 'node:fs/promises';
import {createRpc} from '../app/public/verification/rpc.js';
import {runVerification} from '../app/public/verification/engine.js';

const args = process.argv.slice(2);
if (args.some(a => !['--json', '--help'].includes(a))) { console.error('Usage: npm run verify:testnet -- [--json]'); process.exit(2); }
if (args.includes('--help')) { console.log('Read-only CommonKit testnet verification. No wallet, keys, environment variables or signing. Exit: 0 all pass; 1 mismatch; 2 unavailable/incomplete. --json emits the full report.'); process.exit(0); }
try {
  const manifest = JSON.parse(await fs.readFile(new URL('../app/public/verification/manifest.json', import.meta.url), 'utf8'));
  const transport = createRpc();
  const report = await runVerification(manifest, {rpc: transport.rpc, onCheck: args.includes('--json') ? undefined : c => console.log(`${c.status.padEnd(10)} ${c.label}\n           ${c.detail}`)});
  report.requests = transport.requests;
  if (args.includes('--json')) console.log(JSON.stringify(report, null, 2));
  else console.log(`\n${report.summary.pass} passed; ${report.summary.fail} failed; ${report.summary.unverified} unverified. ${report.passed ? 'Recorded flow verified.' : 'Verification incomplete or mismatched.'}\nRead-only public RPC evidence; not an audit or proof of physical handover.`);
  process.exitCode = report.passed ? 0 : report.summary.fail ? 1 : 2;
} catch (error) {
  const report = {passed: false, error: error.message};
  console.log(args.includes('--json') ? JSON.stringify(report) : `UNVERIFIED ${error.message}`); process.exitCode = 2;
}
