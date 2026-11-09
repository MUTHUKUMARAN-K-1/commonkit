import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {buildCaseFile, checkEvidence, MAX_EVIDENCE_BYTES} from '../app/public/verification/case-model.js';
import {PROOF_CASES} from '../app/public/verification/cases.js';

const manifests = Object.fromEntries(await Promise.all(Object.entries(PROOF_CASES).map(async ([flow, proof]) => [flow, JSON.parse(await fs.readFile(new URL(`../app/public${proof.manifest}`, import.meta.url)))])));

for (const flow of ['normal', 'dispute']) {
  test(`${flow} case matches every published fixture byte-for-byte and rejects a changed file`, async () => {
    const model = buildCaseFile(manifests[flow]);
    for (const card of model.evidence) {
      const bytes = await fs.readFile(new URL(`../app/public${card.fileUrl}`, import.meta.url));
      assert.equal((await checkEvidence(bytes, card.expectedHash)).matches, true, card.id);
      const changed = Buffer.from(bytes); changed[0] ^= 1;
      assert.equal((await checkEvidence(changed, card.expectedHash)).matches, false, card.id);
    }
  });
}
test('dispute case distinguishes original damage from the final decision and binds each to its own receipt', () => {
  const m = manifests.dispute, model = buildCaseFile(m);
  const damage = model.evidence.find(c => c.id === 'damage'), decision = model.evidence.find(c => c.id === 'decision');
  assert.notEqual(damage.expectedHash, decision.expectedHash);
  assert.equal(damage.expectedHash, m.steps.find(s => s.id === 'dispute').args.evidence_hash);
  assert.equal(decision.expectedHash, m.resolution.evidence_hash);
  assert.equal(damage.transactionHash, m.steps.find(s => s.id === 'dispute').hash);
  assert.equal(decision.transactionHash, m.steps.find(s => s.id === 'settlement-proposal').hash);
  assert.equal(model.events.find(e => e.id === 'dao-payment').checkId, 'dao-paid');
  assert.equal(model.events.find(e => e.id === 'borrower-payment').checkId, 'borrower-paid');
  assert.deepEqual(model.amounts, {principal:'0.011',bond:'0.010',fee:'0.001',damage:'0.003',borrower:'0.007',dao:'0.004'});
});
test('normal case does not fabricate damage evidence or settlement votes', () => {
  const model = buildCaseFile(manifests.normal);
  assert.deepEqual(model.evidence.map(c => c.id), ['pickup', 'return']);
  assert(!model.events.some(e => ['first-vote', 'second-vote'].includes(e.id)));
  assert.equal(model.amounts.borrower, '0.010');
  assert.equal(model.amounts.damage, '0.000');
});
test('case refuses cross-booking evidence, duplicate receipt IDs and divergent decisions', () => {
  const mutations = [
    m => m.booking.id = 10,
    m => m.steps.push(m.steps[1]),
    m => m.steps.find(s => s.id === 'pickup').args.id = 9,
    m => m.steps.find(s => s.id === 'return').args.evidence_hash = 'a'.repeat(64),
    m => m.resolution.damage_micro_near = 0,
    m => m.booking.damage = m.booking.bond + 1,
    m => m.booking.bond = Number.MAX_SAFE_INTEGER + 1,
    m => m.steps.find(s => s.id === 'settlement-proposal').args.proposal.kind.FunctionCall.actions[0].args = btoa(JSON.stringify({id:11, damage_micro_near:0, evidence_hash:m.booking.dispute_hash})),
  ];
  for (const mutate of mutations) {
    const changed = structuredClone(manifests.dispute); mutate(changed);
    assert.throws(() => buildCaseFile(changed), /Case file unavailable/);
  }
});
test('file hashing preserves binary bytes and rejects invalid or oversized input', async () => {
  const bytes = new Uint8Array([0, 255, 128, 13, 10, 65]);
  const {actualHash} = await checkEvidence(bytes, '0'.repeat(64));
  assert.equal((await checkEvidence(bytes.buffer, actualHash)).matches, true);
  assert.equal((await checkEvidence(bytes.subarray(1), actualHash)).matches, false);
  await assert.rejects(checkEvidence(new Uint8Array(MAX_EVIDENCE_BYTES + 1), actualHash), /25 MiB/);
  await assert.rejects(checkEvidence(bytes, 'invalid'), /fingerprint/);
  await assert.rejects(checkEvidence('text', actualHash), /readable file/);
});
