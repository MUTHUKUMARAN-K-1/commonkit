import {PROOF_CASES} from './cases.js';

export const MAX_EVIDENCE_BYTES = 25 * 1024 * 1024;
const hashPattern = /^[a-f0-9]{64}$/;
const requireCase = (condition, message) => { if (!condition) throw Error(`Case file unavailable: ${message}`); };
const near = micro => (micro / 1e6).toFixed(6).replace(/0{1,3}$/, '');

// This is a presentation of recorded claims. Only the shared verification engine
// can mark their chain checks as passed; a file match is a separate local check.
export function buildCaseFile(manifest) {
  const proof = PROOF_CASES[manifest?.flow], b = manifest?.booking;
  requireCase(proof && b?.id === proof.bookingId && manifest.network === 'testnet', 'unexpected rehearsal');
  requireCase(Array.isArray(manifest.steps), 'missing receipt claims');
  const steps = new Map(manifest.steps.map(s => [s.id, s]));
  requireCase(steps.size === manifest.steps.length, 'duplicate receipt claims');
  for (const name of ['fee', 'bond', 'damage']) requireCase(Number.isSafeInteger(b[name]) && b[name] >= 0, 'invalid allocation');
  requireCase(b.damage <= b.bond && Number.isSafeInteger(b.bond + b.fee), 'invalid allocation');
  const base = `/verification/${proof.archive}`;
  function step(id, method) {
    const s = steps.get(id);
    requireCase(s && (!method || s.method === method) && /^[1-9A-HJ-NP-Za-km-z]{32,48}$/.test(s.hash), `invalid ${id} receipt`);
    return s;
  }
  function evidence(id, title, role, stepId, method, expectedHash, note) {
    const s = step(stepId, method);
    requireCase(hashPattern.test(expectedHash), `invalid ${id} fingerprint`);
    if (id !== 'decision') requireCase(s.args?.id === b.id && s.args.evidence_hash === expectedHash, `${id} evidence does not match its receipt claim`);
    return {id, title, role, signerId: s.signerId, expectedHash, fileUrl: `${base}/evidence/${id}.txt`, transactionHash: s.hash, checkId: stepId, note};
  }
  function event(id, title, description, stepId, checkId, checkpoint) {
    const s = step(stepId);
    return {id, title, description, signerId: s.signerId, transactionHash: s.hash, checkId, ...(checkpoint ? {checkpointUrl: `${base}/${checkpoint}.json`} : {})};
  }
  const evidenceCards = [
    evidence('pickup', 'At pickup', 'Custodian', 'pickup', 'pickup', b.pickup_hash, 'The custodian records the pickup evidence fingerprint.'),
    evidence('return', 'At return', 'Borrower', 'return', 'request_return', b.return_hash, 'The borrower requests inspection. This does not accept the return or release the bond.'),
  ];
  const events = [];
  if (manifest.flow === 'dispute') {
    const damage = step('dispute', 'dispute');
    evidenceCards.push(evidence('damage', 'Damage report', 'Custodian', 'dispute', 'dispute', damage.args?.evidence_hash,
      'The original damage claim comes from the dispute transaction. Settlement later replaces the booking’s dispute hash with the council’s decision hash.'));
    const resolution = manifest.resolution, proposal = step('settlement-proposal', 'add_proposal');
    const action = proposal.args?.proposal?.kind?.FunctionCall;
    requireCase(action?.receiver_id === manifest.contractId && action.actions?.length === 1 && action.actions[0].method_name === 'resolve', 'unexpected settlement action');
    let args;
    try { args = JSON.parse(atob(action.actions[0].args)); } catch { throw Error('Case file unavailable: invalid settlement arguments'); }
    requireCase(resolution?.id === b.id && resolution.damage_micro_near === b.damage && resolution.evidence_hash === b.dispute_hash && args.id === b.id && args.damage_micro_near === b.damage && args.evidence_hash === b.dispute_hash, 'decision differs from settlement');
    evidenceCards.push(evidence('decision', 'Council decision', 'Council proposer', 'settlement-proposal', 'add_proposal', b.dispute_hash,
      `The proposal assigns ${near(b.damage)} NEAR of the bond to damage. This separate decision file is not the original damage report.`));
    events.push(
      event('first-vote', `First vote · proposal #${manifest.settlement.id}`, `${near(b.bond + b.fee)} NEAR remains in escrow in the saved checkpoint. This vote must not execute settlement.`, 'settlement-vote-1', 'vote-boundary', 'single-vote'),
      event('second-vote', `Second vote · proposal #${manifest.settlement.id}`, `The DAO executes the decision: ${near(b.bond - b.damage)} NEAR borrower credit and ${near(b.fee + b.damage)} NEAR DAO credit. Credits still need withdrawal.`, 'settlement-vote-2', 'resolve-executed', 'settled'),
    );
  } else {
    requireCase(b.damage === 0 && b.dispute_hash === null, 'normal return contains a dispute');
    events.push(event('accepted', 'Custodian accepts the return', `The full ${near(b.bond)} NEAR bond becomes borrower credit, with no damage deduction.`, 'accept-return', 'accept-return', 'settled'));
  }
  events.push(
    event('treasury-proposal', `Separate treasury proposal #${manifest.treasury.id}`, 'The DAO proposes withdrawing its available credit. Settlement approval alone cannot pay the treasury.', 'treasury-proposal', 'treasury-proposal'),
    event('treasury-first-vote', 'First treasury vote', 'One approval does not withdraw the DAO credit. A second council account must approve.', 'treasury-vote-1', 'treasury-boundary', 'treasury-single-vote'),
    event('dao-payment', 'DAO payout', `The second treasury vote executes withdrawal of ${near(b.fee + b.damage)} NEAR to the DAO. The live payment check includes the transfer and callback.`, 'treasury-vote-2', 'dao-paid'),
    event('borrower-payment', 'Borrower payout', `${near(b.bond - b.damage)} NEAR is withdrawn to the borrower in a separate transaction. The live payment check includes the transfer and callback.`, 'borrower-withdraw', 'borrower-paid', 'final'),
  );
  return {
    flow: manifest.flow, bookingId: b.id, recordedAt: manifest.recordedAt,
    title: manifest.flow === 'dispute' ? 'Read the dispute case.' : 'Read the return case.',
    description: manifest.flow === 'dispute' ? 'From the original damage claim to the council decision and both payouts.' : 'From handover evidence to an accepted return and the full bond refund.',
    amounts: {principal: near(b.bond + b.fee), bond: near(b.bond), fee: near(b.fee), damage: near(b.damage), borrower: near(b.bond - b.damage), dao: near(b.fee + b.damage)},
    evidence: evidenceCards, events,
  };
}

export async function checkEvidence(bytes, expectedHash) {
  if (!hashPattern.test(expectedHash)) throw Error('The expected SHA-256 fingerprint is invalid.');
  if (!(bytes instanceof Uint8Array || bytes instanceof ArrayBuffer)) throw Error('Choose a readable file.');
  if (bytes.byteLength > MAX_EVIDENCE_BYTES) throw Error('Choose a file no larger than 25 MiB.');
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const actualHash = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
  return {matches: actualHash === expectedHash, actualHash, expectedHash};
}
