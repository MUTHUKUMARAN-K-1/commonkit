import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {PROOF_CASES} from '../app/public/verification/cases.js';

// Publish a static reading path from the existing dated evidence. No RPC or
// wallet code is included; this page never claims a fresh verification result.
const read = async path => JSON.parse(await fs.readFile(`app/public${path}`, 'utf8'));
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const near = value => (Number(value) / 1e6).toFixed(3);
const receipt = (manifest, id, label) => {
  const step = manifest.steps.find(step => step.id === id);
  assert(step, `Missing receipt ${id}`);
  assert(/^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(step.hash));
  return `<a href="https://testnet.nearblocks.io/txns/${step.hash}" target="_blank" rel="noopener noreferrer">${escape(label)} ↗</a>`;
};
const cases = {};
for (const [flow, config] of Object.entries(PROOF_CASES)) {
  const manifest = await read(config.manifest);
  const base = `/verification/${config.archive}`;
  const settled = await read(`${base}/settled.json`);
  const final = await read(`${base}/final.json`);
  assert.equal(manifest.booking.id, config.bookingId);
  assert.equal(final.state.bookings[config.bookingId].status, 'Closed');
  assert.equal(final.state.credits[manifest.booking.borrower], 0);
  assert.equal(final.state.credits[manifest.daoId], 0);
  cases[flow] = {manifest, base, settled, final};
}
const first = await read(`${cases.dispute.base}/single-vote.json`);
assert.equal(first.booking.status, 'Disputed');
assert.equal(Object.keys(first.settlement.votes).length, 1);
assert.equal(first.state.credits[cases.dispute.manifest.booking.borrower], 0);
assert.equal(first.state.credits[cases.dispute.manifest.daoId], 0);

const card = (flow, title, explanation) => {
  const {manifest: m, base, settled, final} = cases[flow];
  const borrower = settled.state.credits[m.booking.borrower];
  const dao = settled.state.credits[m.daoId];
  assert.equal(borrower + dao, m.booking.bond + m.booking.fee);
  return `<article class="outcome" id="${flow}">
  <p class="eyebrow">BOOKING #${m.booking.id} · ${m.steps.length} RECORDED TRANSACTIONS</p>
  <h2>${title}</h2><p>${explanation}</p>
  <dl class="money"><div><dt>Borrower received</dt><dd>${near(borrower)} <small>NEAR</small></dd></div><div><dt>Community DAO received</dt><dd>${near(dao)} <small>NEAR</small></dd></div></dl>
  <p class="caption">Recorded testnet payouts · not current balances</p>
  <ol class="path"><li><b>${flow === 'normal' ? 'Custodian accepts the return' : 'Both council accounts approve'}</b><span>${flow === 'normal' ? 'Zero damage. The full bond becomes borrower credit.' : 'Proposal #16 allocates 0.003 NEAR for damage. Credits are created; payment is a separate step.'}</span></li><li><b>Withdrawals move the money</b><span>The borrower withdraws their credit. Treasury proposal #${m.treasury.id} needs both council votes to pay the DAO.</span></li></ol>
  <div class="links">${receipt(m,'borrower-withdraw','Borrower payout receipt')}${receipt(m,'treasury-vote-2','DAO payout execution')}</div>
  <p class="capture">Final snapshot: <time datetime="${final.capturedAt}">${final.capturedAt.replace('T',' ').replace('Z',' UTC')}</time> · block ${final.block.height}</p>
  <details><summary>Inspect all ${m.steps.length} recorded transactions</summary><ol class="receipts">${m.steps.map(step=>`<li>${receipt(m,step.id,step.label)}<small>${escape(step.signerId)} · ${escape(step.method)}</small></li>`).join('')}</ol></details>
  <div class="links secondary"><a href="${base}/manifest.json">Manifest & hashes ↗</a><a href="${base}/receipts.json">Saved receipt data ↗</a><a href="${base}/final.json">Final snapshot ↗</a></div>
  <a class="button" href="/verify.html?flow=${flow}">Run fresh ${flow === 'normal' ? 'normal-return' : 'dispute'} checks ↗</a>
  </article>`;
};
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="description" content="Read CommonKit’s completed normal return and DAO dispute, with dated snapshots and payout receipts. No wallet or RPC connection needed to read."><title>Two returns. Every payment on record. · CommonKit</title><link rel="stylesheet" href="/verification/recorded.css"></head>
<body><a class="skip" href="#outcomes">Skip to recorded outcomes</a>
<header><a class="brand" href="/"><b>ck</b> CommonKit</a><span class="network">NEAR TESTNET</span><nav aria-label="Main navigation"><a href="/judge.html">60-second tour</a><a href="/verify.html">Fresh verification ↗</a></nav></header>
<main><section class="hero"><div><p class="eyebrow">THE CAMERA STORY / RECORDED EVIDENCE</p><h1>One shared camera.<br><em>Two ways home.</em></h1><p class="intro">A campus club lends its camera. It comes back clean—or someone reports damage. Follow who decides and where the bond goes.</p><div class="links"><a class="button" href="#normal">Normal return ↓</a><a class="button alternate" href="#dispute">Disputed return ↓</a></div></div><figure><img src="/assets/camera.png" alt="Illustrative community camera kit" width="600" height="600"><figcaption>Illustrative equipment · controlled testnet demonstration</figcaption></figure></section>
<aside class="recorded-notice"><strong>Recorded on 9 November 2026. Not a live verification result.</strong><p>This page is built from saved manifests and snapshots. It needs no wallet, JavaScript or blockchain connection to read. Explorer links and <a href="/verify.html">fresh checks</a> need network access. A provider outage never turns a saved result into a current PASS.</p></aside>
<section class="terms" aria-label="Booking deposit"><p><b>0.111 NEAR attached</b> to each reservation</p><p><b>0.010</b> refundable bond + <b>0.001</b> usage fee</p><p><b>0.100</b> retained storage, separate from principal</p><small>Testnet funds only. Gas and DAO proposal bonds are additional and separate.</small></section>
<section class="outcomes" id="outcomes" aria-label="Two completed borrowing outcomes">${card('normal','Clean return.<br><em>Full bond back.</em>','The custodian accepts the camera’s return. No damage deduction is made.')}${card('dispute','Damage disputed.<br><em>A council decision.</em>','The custodian records a claim. The council decides the deduction using two approvals.')}</section>
<section class="decision" id="first-vote"><div><p class="eyebrow">THE MOMENT THAT MATTERS / BOOKING #11</p><h2>One vote cannot<br><em>release the bond.</em></h2><p>A proposal is not a payment. Neither is the first approval. The saved checkpoints show exactly where authority changes the outcome.</p></div><ol class="decision-steps"><li><b>1 / 2 approvals</b><strong>0.011 NEAR stays escrowed</strong><p>Booking disputed. Proposal pending. Zero borrower or DAO credits.</p><a href="${cases.dispute.base}/single-vote.json">One-vote snapshot ↗</a>${receipt(cases.dispute.manifest,'settlement-vote-1','First-vote transaction')}</li><li><b>2 / 2 approvals</b><strong>Credits: 0.007 + 0.004 NEAR</strong><p>0.007 for the borrower. 0.003 damage plus the 0.001 usage fee for the DAO. These are credits, not yet payouts.</p><a href="${cases.dispute.base}/settled.json">Settlement snapshot ↗</a>${receipt(cases.dispute.manifest,'settlement-vote-2','Second-vote transaction')}</li><li><b>Separate withdrawals</b><strong>Both payments completed</strong><p>Borrower withdrawal and treasury proposal #17 execute the payouts. The final snapshot records both available credits at zero.</p><a href="${cases.dispute.base}/final.json">Final snapshot ↗</a><a href="/verify.html?flow=dispute#case-file">Recheck actual transfer receipts ↗</a></li></ol></section>
<section class="community"><p class="eyebrow">WHY THE COMMUNITY USES IT</p><h2>The fee goes back<br><em>to the shared treasury.</em></h2><p>Each completed borrowing cycle pays a usage fee to the community DAO. It can support upkeep and future equipment purchases through the DAO’s own decisions. This demo proves the fee withdrawal, not a real purchase or an operating community.</p></section>
<section class="limits"><h2>What the demonstration does—and does not—prove</h2><p>The 19 transactions are real NEAR testnet actions approved through Meteor on the public Vercel demo. One operator controls both council accounts. The damage evidence is synthetic; its hash does not prove physical condition. There is no independent community pilot or audit claimed.</p><p>Booking #13 is separate: a real Meteor reservation initiated at 390 × 844 Chrome width, with later desktop confirmation. It is not a physical-phone test or a completed return. <a href="/verify.html#mobile-proof">Inspect the mobile proof ↗</a></p><div class="links"><a href="/judge.html">Play the 60-second explanation ↗</a><a href="/verify.html">Check fresh public data ↗</a><a href="/verification/vercel/deployment.json">Rehearsal provenance ↗</a></div></section></main><footer>CommonKit · Social Money <span>Historical evidence stays readable when RPC is unavailable.</span></footer></body></html>\n`;
await fs.writeFile('app/public/recorded.html', html);
console.log('Built recorded.html from dated manifests and snapshots; no live-result substitution.');
