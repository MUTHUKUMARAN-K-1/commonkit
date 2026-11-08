import {createRpc, DEFAULT_ENDPOINTS} from './rpc.js';
import {runVerification, CHECK_IDS} from './engine.js';
const $ = id => document.getElementById(id);
const node = (tag, text, className) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; return el; };
let report = null, running = false;
const categories = ['Deployment', 'Deployment & governance', 'Recorded transaction flow', 'Execution & funds', 'Current accounting'];
const groups = new Map();
function showCheck(check) {
  const row = node('details', undefined, `check ${check.status}`);
  row.dataset.order = CHECK_IDS.indexOf(check.id);
  if (check.status !== 'PASS') row.open = true;
  const summary = node('summary'); summary.append(node('span', check.status, 'badge'), node('span', check.label)); row.append(summary);
  const body = node('div', check.detail, 'detail');
  if (check.transactionHash) { const link = node('a', 'View transaction ↗', 'receipt'); link.href = `https://testnet.nearblocks.io/txns/${encodeURIComponent(check.transactionHash)}`; link.target = '_blank'; link.rel = 'noopener noreferrer'; body.append(link); }
  row.append(body);
  const group = groups.get(check.category), next = [...group.querySelectorAll('.check')].find(r => Number(r.dataset.order) > Number(row.dataset.order));
  group.insertBefore(row, next || null);
  for (const [id, status] of [['passed', 'PASS'], ['failed', 'FAIL'], ['unverified', 'UNVERIFIED']]) $(id).textContent = document.querySelectorAll(`.check.${status}`).length;
  $('progress').textContent = `${document.querySelectorAll('.check').length} of 27 checks returned. ${check.label}`;
}
async function run() {
  if (running) return;
  running = true; report = null; $('run').disabled = true; $('download').disabled = true;
  $('result-title').textContent = 'Checking fresh testnet data…'; $('progress').textContent = 'Reading public RPC. No wallet connection is used.';
  $('anchor').textContent = 'Finalized block: waiting for RPC'; $('ledger').replaceChildren(); $('ledger-status').textContent = 'Current ledger not verified yet.';
  for (const id of ['passed', 'failed', 'unverified']) $(id).textContent = '0';
  $('groups').replaceChildren(); groups.clear();
  for (const category of categories) { const section = node('section', undefined, 'group'); section.append(node('h3', category)); groups.set(category, section); $('groups').append(section); }
  try {
    const response = await fetch('/verification/manifest.json', {cache: 'no-store'});
    if (!response.ok) throw Error(`Evidence manifest unavailable (HTTP ${response.status})`);
    const manifest = await response.json(), transport = createRpc();
    report = await runVerification(manifest, {rpc: transport.rpc, onCheck: showCheck});
    report.requests = transport.requests;
    $('result-title').textContent = report.passed ? 'The recorded flow checks out.' : report.summary.fail ? 'A mismatch needs attention.' : 'Verification is incomplete.';
    $('progress').textContent = `${report.summary.pass} passed · ${report.summary.fail} mismatched · ${report.summary.unverified} unverified. Checked ${new Date(report.finishedAt).toLocaleString()}. ${report.passed ? 'Expand any result to inspect its evidence.' : 'Results below explain what could not be verified. You can retry.'}`;
    if (report.block) $('anchor').textContent = `Final block ${report.block.height} · ${report.block.time} · ${report.block.hash}`;
    if (report.ledger) {
      $('ledger-status').textContent = 'Recomputed and matched at the finalized block above.';
      for (const name of ['deposited', 'escrow', 'credits', 'pending', 'withdrawn']) { const row = node('div'); row.append(node('dt', name[0].toUpperCase() + name.slice(1)), node('dd', `${report.ledger[name]} microNEAR`)); $('ledger').append(row); }
    }
    $('download').disabled = false;
  } catch (error) {
    $('result-title').textContent = 'Verification is incomplete.'; $('progress').textContent = `UNVERIFIED: ${error.message}. No successful result is inferred. Try again when the connection is available.`; $('unverified').textContent = '1';
  } finally {
    running = false; $('run').disabled = false;
    for (const section of groups.values()) if (section.children.length === 1) section.append(node('p', 'Not checked because prerequisite evidence is unavailable.', 'empty'));
  }
}
$('run').addEventListener('click', run);
$('download').addEventListener('click', () => {
  if (!report) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], {type: 'application/json'}));
  const link = node('a'); link.href = url; link.download = 'commonkit-verification.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText('npm run verify:testnet'); $('copy-status').textContent = 'Command copied.'; } catch { $('copy-status').textContent = 'Copy this command: npm run verify:testnet'; } });
$('providers').textContent = `Read-only RPC providers: ${DEFAULT_ENDPOINTS.join(' · ')}. Failed requests may fall back to the next provider; the report lists which served each request.`;
run();
