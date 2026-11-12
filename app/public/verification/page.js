import {createRpc, DEFAULT_ENDPOINTS, ARCHIVAL_ENDPOINT} from './rpc.js';
import {runVerification, getCheckIds} from './engine.js';
import {PROOF_CASES} from './cases.js';
import {buildCaseFile} from './case-model.js';
import {createCaseFile} from './case-file.js';

const $ = id => document.getElementById(id);
const caseFile = createCaseFile($('case-file'));
const node = (tag, text, className) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; return el; };
const flows = {
  normal: {
    ...PROOF_CASES.normal, title: 'Normal return', count: 21,
    reference: 'Booking #10 · zero damage · treasury proposal #15', borrower: '0.010', dao: '0.001', daoLabel: 'DAO usage fee',
    boundary: 'Normal return is accepted by the custodian. Two council votes authorize the DAO fee withdrawal; the first vote must not execute that withdrawal.',
    stories: [
      ['Borrow & bring it back', 'The borrower reserves the camera, the custodian records pickup, and the borrower requests return with evidence.'],
      ['Accept the return', 'The custodian accepts the matching return evidence. No damage deduction: the full bond becomes borrower credit.'],
      ['Verify both payments', 'Check the 0.01 NEAR borrower refund and the 0.001 NEAR DAO fee. The fee withdrawal requires both council votes.'],
    ],
    singleVote: 'One treasury vote · DAO fee still unpaid',
  },
  dispute: {
    ...PROOF_CASES.dispute, title: 'DAO dispute', count: 27,
    reference: 'Booking #11 · settlement #16 · treasury #17', borrower: '0.007', dao: '0.004', daoLabel: 'DAO fee + damage',
    boundary: 'The first settlement vote must not call resolve; the second executes the exact DAO decision. A separate two-vote proposal authorizes the DAO credit withdrawal.',
    stories: [
      ['Borrow & request return', 'The borrower reserves the camera, the custodian records pickup, and the borrower requests return with evidence.'],
      ['Decide the dispute', 'The custodian raises a damage dispute. One vote cannot settle it; the second executes the DAO’s 0.003 NEAR damage decision.'],
      ['Verify both payments', 'Check the 0.007 NEAR borrower refund and the 0.004 NEAR DAO transfer, including their successful withdrawal callbacks.'],
    ],
    singleVote: 'One settlement vote · principal still escrowed',
  },
};
const categories = ['Deployment', 'Deployment & governance', 'Recorded transaction flow', 'Execution & funds', 'Current accounting'];
let selected = 'normal', generation = 0, report = null;
let activeFlow = null;
const flowFromUrl = () => new URL(location.href).searchParams.get('flow') === 'dispute' ? 'dispute' : 'normal';

function setFlowContent(flow) {
  const config = flows[flow];
  for (const button of document.querySelectorAll('[data-flow]')) button.setAttribute('aria-pressed', String(button.dataset.flow === flow));
  $('claim-title').textContent = `RECORDED CLAIMS / ${config.title.toUpperCase()}`;
  $('result-flow').textContent = `LIVE VERIFICATION / ${config.title.toUpperCase()}`;
  $('flow-reference').textContent = config.reference;
  for (const [id, amount] of [['borrower-amount', config.borrower], ['dao-amount', config.dao]]) $(id).replaceChildren(document.createTextNode(`${amount} `), node('small', 'NEAR'));
  $('dao-label').textContent = config.daoLabel;
  $('check-count').textContent = `${config.count} READ-ONLY CHECKS`;
  $('boundary-note').textContent = config.boundary;
  $('story').replaceChildren(...config.stories.map(([title, description], i) => { const article = node('article'); article.append(node('span', `0${i + 1}`), node('h3', title), node('p', description)); return article; }));
  $('command-text').textContent = `# Both completed flows + mobile reservation\nnpm run verify:testnet\n\n# Selected flow\nnpm run verify:testnet -- --flow ${flow}\n\n# Machine-readable report for all three proofs\nnpm run --silent verify:testnet -- --json`;
  $('copy-status').textContent = '';
  const links = [
    [config.manifest, 'Expected claims & transaction hashes', 'Published inputs to the verifier'],
    [`/verification/${config.archive}/${flow === 'normal' ? 'treasury-single-vote' : 'single-vote'}.json`, config.singleVote, 'Saved checkpoint · 9 November 2026'],
    [`/verification/${config.archive}/settled.json`, 'Return settled · credits allocated', 'Saved checkpoint · 9 November 2026'],
    ...(flow === 'dispute' ? [[`/verification/${config.archive}/treasury-single-vote.json`, 'One treasury vote · DAO payout still pending', 'Saved checkpoint · separate withdrawal proposal #17']] : []),
    [`/verification/${config.archive}/final.json`, 'Both withdrawals completed', 'Saved final state · not a fresh verification result'],
    ['/verification/vercel/deployment.json', 'Where these receipts were captured', 'Public Vercel origin · Meteor approvals · pinned source commit'],
  ];
  $('evidence-links').replaceChildren(...links.map(([href, label, note]) => { const item = node('li'); const link = node('a', `${label} ↗`); link.href = href; item.append(link, node('span', note)); return item; }));
}

async function run() {
  const flow = selected, config = flows[flow], token = ++generation;
  if (activeFlow && activeFlow !== flow) { $(`status-${activeFlow}`).textContent = 'Check interrupted'; $(`status-${activeFlow}`).removeAttribute('data-state'); }
  activeFlow = flow;
  caseFile.reset(flow);
  report = null;
  $('run').disabled = true; $('download').disabled = true;
  document.querySelector('.result-panel').setAttribute('aria-busy', 'true');
  $(`status-${flow}`).textContent = 'Checking fresh data…'; $(`status-${flow}`).dataset.state = 'running';
  $('result-title').textContent = 'Checking fresh testnet data…';
  $('progress').textContent = `Reading public RPC for ${config.title.toLowerCase()}. No wallet connection is used.`;
  $('anchor').textContent = 'Finalized block: waiting for RPC';
  $('ledger').replaceChildren(); $('ledger-status').textContent = 'Current ledger not verified yet.';
  for (const id of ['passed', 'failed', 'unverified']) $(id).textContent = '0';
  const groups = new Map();
  $('groups').replaceChildren();
  for (const category of categories) { const section = node('section', undefined, 'group'); section.append(node('h3', category)); groups.set(category, section); $('groups').append(section); }
  const current = () => token === generation;
  let ids = [];
  function showCheck(check) {
    if (!current()) return;
    caseFile.update(check);
    const row = node('details', undefined, `check ${check.status}`);
    row.dataset.order = ids.indexOf(check.id);
    if (check.status !== 'PASS') row.open = true;
    const summary = node('summary'); summary.append(node('span', check.status, 'badge'), node('span', check.label)); row.append(summary);
    const body = node('div', check.detail, 'detail');
    if (check.transactionHash) { const link = node('a', 'View transaction ↗', 'receipt'); link.href = `https://testnet.nearblocks.io/txns/${encodeURIComponent(check.transactionHash)}`; link.target = '_blank'; link.rel = 'noopener noreferrer'; body.append(link); }
    row.append(body);
    const group = groups.get(check.category);
    const next = [...group.querySelectorAll('.check')].find(r => Number(r.dataset.order) > Number(row.dataset.order));
    group.insertBefore(row, next || null);
    for (const [id, status] of [['passed', 'PASS'], ['failed', 'FAIL'], ['unverified', 'UNVERIFIED']]) $(id).textContent = $('groups').querySelectorAll(`.check.${status}`).length;
    $('progress').textContent = `${$('groups').querySelectorAll('.check').length} of ${ids.length} checks returned. ${check.label}`;
  }
  try {
    const response = await fetch(config.manifest, {cache: 'no-store'});
    if (!current()) return;
    if (!response.ok) throw Error(`Evidence manifest unavailable (HTTP ${response.status})`);
    const manifest = await response.json();
    if (!current()) return;
    if (manifest.flow !== flow || manifest.booking?.id !== config.bookingId) throw Error('Evidence manifest does not match the selected flow and booking');
    try { caseFile.load(buildCaseFile(manifest)); } catch (error) { caseFile.fail(error.message); }
    ids = getCheckIds(manifest);
    $('check-count').textContent = `${ids.length} READ-ONLY CHECKS`;
    const transport = createRpc();
    const nextReport = await runVerification(manifest, {rpc: transport.rpc, onCheck: showCheck});
    if (!current()) return;
    report = nextReport; report.requests = transport.requests;
    const checkedAt = new Date(report.finishedAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    const state = report.passed ? 'pass' : report.summary.fail ? 'fail' : 'unverified';
    $(`status-${flow}`).dataset.state = state;
    $(`status-${flow}`).textContent = `${report.passed ? `Verified ${report.summary.pass}/${ids.length}` : state === 'fail' ? 'Mismatch found' : 'Incomplete'} · ${checkedAt}`;
    $('result-title').textContent = report.passed ? `${config.title} checks out.` : report.summary.fail ? 'A mismatch needs attention.' : 'Verification is incomplete.';
    $('progress').textContent = `${report.summary.pass} passed · ${report.summary.fail} mismatched · ${report.summary.unverified} unverified. Checked ${new Date(report.finishedAt).toLocaleString()}. ${report.passed ? 'Expand any result to inspect its evidence.' : 'Results below explain what could not be verified. You can retry.'}`;
    if (report.block) $('anchor').textContent = `Final block ${report.block.height} · ${report.block.time} · ${report.block.hash}`;
    if (report.ledger) {
      $('ledger-status').textContent = 'Recomputed and matched at the finalized block above.';
      for (const name of ['deposited', 'escrow', 'credits', 'pending', 'withdrawn']) { const row = node('div'); row.append(node('dt', name[0].toUpperCase() + name.slice(1)), node('dd', `${report.ledger[name]} microNEAR`)); $('ledger').append(row); }
    }
    $('download').disabled = false;
  } catch (error) {
    if (!current()) return;
    caseFile.fail(error.message);
    $('result-title').textContent = 'Verification is incomplete.';
    $('progress').textContent = `UNVERIFIED: ${error.message}. No successful result is inferred. Retry when the connection is available.`;
    $('unverified').textContent = String(Math.max(1, Number($('unverified').textContent)));
    $(`status-${flow}`).textContent = 'Incomplete · retry available'; $(`status-${flow}`).dataset.state = 'unverified';
  } finally {
    if (current()) {
      activeFlow = null; $('run').disabled = false;
      document.querySelector('.result-panel').setAttribute('aria-busy', 'false');
      for (const section of groups.values()) if (section.children.length === 1) section.append(node('p', 'Not checked because prerequisite evidence is unavailable.', 'empty'));
    }
  }
}

function selectFlow(flow, updateUrl = true) {
  selected = flow;
  if (updateUrl) { const url = new URL(location.href); url.searchParams.set('flow', flow); history.replaceState(null, '', url); }
  setFlowContent(flow); run();
}
for (const button of document.querySelectorAll('[data-flow]')) button.addEventListener('click', () => { if (button.dataset.flow !== selected) selectFlow(button.dataset.flow); });
window.addEventListener('popstate', () => {
  const flow = flowFromUrl();
  // In-page evidence links must not clear local file checks or restart RPC.
  if (flow !== selected) selectFlow(flow, false);
});
$('run').addEventListener('click', run);
$('download').addEventListener('click', () => {
  if (!report) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], {type: 'application/json'}));
  const link = node('a'); link.href = url; link.download = `commonkit-${selected}-verification.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('copy').addEventListener('click', async () => { const flow = selected, command = `npm run verify:testnet -- --flow ${flow}`; try { await navigator.clipboard.writeText(command); if (flow === selected) $('copy-status').textContent = 'Selected-flow command copied.'; } catch { if (flow === selected) $('copy-status').textContent = `Copy this command: ${command}`; } });
$('providers').textContent = `Current-state RPC: ${DEFAULT_ENDPOINTS.join(' · ')}. Historical receipts: ${ARCHIVAL_ENDPOINT}, with fallback to the current-state providers. Each downloaded report lists which provider served its requests.`;
selectFlow(flowFromUrl(), false);
