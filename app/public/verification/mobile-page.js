import {createRpc} from './rpc.js';
import {MOBILE_MANIFEST, runMobileVerification} from './mobile-engine.js';

const $ = id => document.getElementById(id);
let report = null;
async function run() {
  if ($('mobile-run').disabled) return;
  $('mobile-run').disabled = true; $('mobile-download').disabled = true;
  $('mobile-results').replaceChildren();
  $('mobile-status').textContent = 'Checking fresh public testnet data…';
  $('mobile-anchor').textContent = '';
  report = null;
  try {
    const response = await fetch(MOBILE_MANIFEST, {cache: 'no-store'});
    if (!response.ok) throw Error(`Manifest unavailable (HTTP ${response.status})`);
    const transport = createRpc();
    report = await runMobileVerification(await response.json(), {rpc: transport.rpc, onCheck: check => {
      const row = document.createElement('details'); row.className = `check ${check.status}`;
      row.open = check.status !== 'PASS';
      const summary = document.createElement('summary');
      const badge = document.createElement('span'); badge.className = 'badge'; badge.textContent = check.status;
      const label = document.createElement('span'); label.textContent = check.label;
      summary.append(badge, label);
      const detail = document.createElement('div'); detail.className = 'detail'; detail.textContent = check.detail;
      row.append(summary, detail); $('mobile-results').append(row);
    }});
    report.requests = transport.requests;
    const {pass, fail, unverified} = report.summary;
    $('mobile-status').textContent = `${report.passed ? 'Reservation verified.' : fail ? 'A mismatch needs attention.' : 'Verification is incomplete.'} ${pass}/6 passed · ${fail} mismatched · ${unverified} unverified. Checked ${new Date(report.finishedAt).toLocaleString()}.`;
    if (report.block) $('mobile-anchor').textContent = `Final block ${report.block.height} · ${report.block.hash}`;
    $('mobile-download').disabled = false;
  } catch (error) {
    $('mobile-status').textContent = `UNVERIFIED: ${error.message}. Retry when the connection is available. Saved evidence never supplies a live pass.`;
  } finally { $('mobile-run').disabled = false; }
}
$('mobile-run').addEventListener('click', run);
$('mobile-download').addEventListener('click', () => {
  if (!report) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], {type: 'application/json'}));
  const link = document.createElement('a'); link.href = url; link.download = 'commonkit-mobile-booking-13-verification.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
// Deep links run the mobile checks; the normal/dispute verifier remains independent.
if (location.hash === '#mobile-proof') run();
window.addEventListener('hashchange', () => { if (location.hash === '#mobile-proof' && !report) run(); });
