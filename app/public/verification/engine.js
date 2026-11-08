import {Unavailable} from './rpc.js';

export const CHECK_IDS = ['manifest', 'network', 'block', 'code', 'keys', 'authority', 'policy', 'booking', 'settlement', 'treasury', 'ledger',
  'reserve', 'pickup', 'return', 'dispute', 'settlement-proposal', 'settlement-vote-1', 'settlement-vote-2', 'treasury-proposal', 'treasury-vote-1', 'treasury-vote-2', 'borrower-withdraw',
  'vote-boundary', 'resolve-executed', 'treasury-boundary', 'dao-paid', 'borrower-paid'];

export const NORMAL_CHECK_IDS = ['manifest', 'network', 'block', 'code', 'keys', 'authority', 'policy', 'booking', 'treasury', 'ledger',
  'reserve', 'pickup', 'return', 'accept-return', 'borrower-withdraw', 'treasury-proposal', 'treasury-vote-1', 'treasury-vote-2', 'treasury-boundary', 'dao-paid', 'borrower-paid'];
export const getCheckIds = manifest => manifest.flow === 'normal' ? NORMAL_CHECK_IDS : CHECK_IDS;
class Mismatch extends Error {}
const requireThat = (ok, message) => { if (!ok) throw new Mismatch(message); };
const available = (ok, message) => { if (!ok) throw new Unavailable(message); };
export const decode = value => new TextDecoder('utf-8', {fatal: true}).decode(Uint8Array.from(atob(value), c => c.charCodeAt(0)));
const encode = value => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value))));
const canonical = value => JSON.stringify(value && typeof value === 'object' ? (Array.isArray(value) ? value.map(v => JSON.parse(canonical(v))) : Object.fromEntries(Object.keys(value).sort().map(k => [k, JSON.parse(canonical(value[k]))]))) : value);
const equal = (a, b, message) => requireThat(canonical(a) === canonical(b), message);
function integer(value) {
  requireThat((typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) || (typeof value === 'string' && /^(0|[1-9]\d*)$/.test(value)), 'Invalid or unsafe integer in accounting');
  return BigInt(value);
}
const sum = values => values.reduce((a, b) => a + integer(b), 0n);
const outcomeMap = result => new Map(result.receipts_outcome.map(r => [r.id, r.outcome]));
const actions = receipt => receipt.receipt?.Action?.actions || [];
const calls = (result, from, to, method) => result.receipts.filter(r => r.predecessor_id === from && r.receiver_id === to && actions(r).some(a => a.FunctionCall?.method_name === method));

// Validate the complete receipt graph, not just the transaction's top-level success.
export function checkTransaction(result, expected) {
  available(result.final_execution_status === 'FINAL', 'Transaction is not FINAL');
  const tx = result.transaction;
  available(tx && result.transaction_outcome?.outcome && Array.isArray(result.receipts_outcome) && Array.isArray(result.receipts), 'RPC omitted transaction or receipt details');
  equal([tx.hash, tx.signer_id, tx.receiver_id], [expected.hash, expected.signerId, expected.receiverId], 'Transaction identity mismatch');
  requireThat(tx.actions?.length === 1 && tx.actions[0].FunctionCall, 'Expected exactly one function call');
  const action = tx.actions[0].FunctionCall;
  equal([action.method_name, action.deposit, JSON.parse(decode(action.args))], [expected.method, expected.deposit, expected.args], 'Method, attached deposit or arguments differ from the recorded claim');
  requireThat(!result.status?.Failure, 'Transaction failed');
  available(typeof result.status?.SuccessValue === 'string', 'Final return value unavailable');
  equal(result.status.SuccessValue, expected.returnValue, 'Unexpected contract return value');
  requireThat(result.transaction_outcome.id === tx.hash, 'Transaction outcome hash mismatch');
  const outcomes = outcomeMap(result);
  requireThat(outcomes.size === result.receipts_outcome.length, 'Duplicate receipt outcomes');
  const receipts = new Map(result.receipts.map(r => [r.receipt_id, r]));
  requireThat(receipts.size === result.receipts.length, 'Duplicate receipts');
  const root = result.transaction_outcome.outcome;
  requireThat(root.executor_id === expected.signerId, 'Transaction outcome executor mismatch');
  const initial = (root.receipt_ids || []).map(id => receipts.get(id)).filter(r => r?.predecessor_id === expected.signerId && r.receiver_id === expected.receiverId);
  requireThat(initial.length === 1 && actions(initial[0]).length === 1, 'Initial contract receipt does not match the transaction');
  const initialCall = actions(initial[0])[0].FunctionCall;
  available(initialCall, 'Initial function call unavailable');
  equal([initialCall.method_name, initialCall.deposit, JSON.parse(decode(initialCall.args))], [expected.method, expected.deposit, expected.args], 'Initial receipt payload differs from the transaction');
  const visited = new Set();
  const visit = (outcome, id) => {
    available(outcome && Array.isArray(outcome.receipt_ids) && outcome.status, `Missing receipt outcome: ${id}`);
    requireThat(!('Failure' in outcome.status), `Child execution failed: ${id}`);
    available('SuccessValue' in outcome.status || 'SuccessReceiptId' in outcome.status, `Unresolved receipt: ${id}`);
    const children = new Set([...outcome.receipt_ids, ...('SuccessReceiptId' in outcome.status ? [outcome.status.SuccessReceiptId] : [])]);
    for (const child of children) {
      if (visited.has(child)) continue;
      visited.add(child);
      const receipt = receipts.get(child), next = outcomes.get(child);
      available(receipt && next, `RPC omitted receipt ${child}`);
      requireThat(receipt.receiver_id === next.executor_id, 'Receipt executor mismatch');
      visit(next, child);
    }
  };
  visit(root, tx.hash);
  requireThat(visited.size === outcomes.size && visited.size === receipts.size, 'Receipt response contains unrelated or disconnected receipts');
  available(visited.size > 0, 'No executed contract receipts returned');
  return `${visited.size} connected receipts finalized; exact signer, receiver, deposit and arguments match.`;
}

function checkPolicy(policy, manifest) {
  available(Array.isArray(policy.roles), 'DAO roles unavailable');
  const role = policy.roles.find(r => r.name === 'council');
  equal([...(role?.kind?.Group || [])].sort(), [...manifest.council].sort(), 'Council membership changed');
  requireThat(manifest.council.length === 2 && new Set(manifest.council).size === 2, 'Expected two distinct council accounts');
  const canApprove = r => (r.permissions || []).some(p => ['*:VoteApprove', 'call:VoteApprove', '*:*', 'call:*'].includes(p));
  requireThat(canApprove(role) && !policy.roles.some(r => r !== role && canApprove(r)), 'Another role can approve library calls, or council cannot approve');
  const vote = role.vote_policy?.call || policy.default_vote_policy;
  requireThat(vote?.weight_kind === 'RoleWeight' && String(vote.quorum) === '2' && String(vote.threshold) === '2', 'Library calls no longer require two of two votes');
}

function checkProposal(proposal, expected, manifest) {
  equal([proposal.id, proposal.proposer, proposal.kind], [expected.id, expected.proposer, expected.kind], 'Proposal identity, author or action payload mismatch');
  requireThat(proposal.status === 'Approved', 'Proposal is not approved');
  equal(proposal.votes, Object.fromEntries(manifest.council.map(a => [a, 'Approve'])), 'Expected one approval from each council account');
  equal(proposal.vote_counts?.council, [2, 0, 0], 'Proposal vote tally mismatch');
}

function checkLedger(state, ledger) {
  available(state.bookings && state.credits && state.pending, 'State accounting records unavailable');
  const bookings = Object.values(state.bookings);
  const active = new Set(['Reserved', 'CheckedOut', 'ReturnPending', 'Disputed']);
  requireThat(bookings.every(b => active.has(b.status) || ['Closed', 'Cancelled'].includes(b.status)), 'Unknown booking status');
  const deposited = sum(bookings.map(b => integer(b.fee) + integer(b.bond)).map(String));
  const escrow = sum(bookings.filter(b => active.has(b.status)).map(b => String(integer(b.fee) + integer(b.bond))));
  const credits = sum(Object.values(state.credits)), pending = sum(Object.values(state.pending).map(w => w.amount));
  const withdrawn = integer(state.total_withdrawn);
  requireThat(integer(state.total_deposited) === deposited, 'Deposit total differs from booking principal');
  requireThat(deposited === escrow + credits + pending + withdrawn, 'Principal conservation failed');
  for (const [key, value] of Object.entries({deposited, escrow, credits, pending, withdrawn})) requireThat(integer(ledger[key]) === value, `Ledger ${key} differs from recomputed state`);
  requireThat(ledger.balanced === true, 'Contract reports an unbalanced ledger');
  return `All amounts in microNEAR: ${deposited} deposited = ${escrow} escrow + ${credits} credit + ${pending} pending + ${withdrawn} withdrawn. Storage and gas excluded.`;
}

function checkCall(result, from, to, method, args) {
  const matches = calls(result, from, to, method);
  requireThat(matches.length === 1, `Expected one ${method} receipt from ${from}`);
  const call = actions(matches[0]).find(a => a.FunctionCall?.method_name === method).FunctionCall;
  equal([JSON.parse(decode(call.args)), call.deposit], [args, '0'], `Unexpected executed ${method} arguments or deposit`);
  return matches[0];
}

function checkWithdrawal(result, manifest, recipient, amount, nonce) {
  const matching = result.receipts.filter(r => r.predecessor_id === manifest.contractId && r.receiver_id === recipient && actions(r).some(a => a.Transfer?.deposit === amount));
  requireThat(matching.length === 1, 'Exact principal transfer missing or duplicated; gas refunds do not count');
  const outcomes = outcomeMap(result);
  equal(outcomes.get(matching[0].receipt_id)?.status, {SuccessValue: ''}, 'Principal transfer did not succeed');
  const callback = checkCall(result, manifest.contractId, manifest.contractId, 'on_withdrawal', {nonce});
  equal(outcomes.get(callback.receipt_id)?.status, {SuccessValue: 'dHJ1ZQ=='}, 'Withdrawal callback did not confirm payment');
  const transferOutputs = matching[0].receipt.Action.output_data_receivers || [];
  const callbackInputs = callback.receipt.Action.input_data_ids || [];
  requireThat(transferOutputs.some(d => d.receiver_id === manifest.contractId && callbackInputs.includes(d.data_id)), 'Callback is not bound to the principal transfer');
}

export async function runVerification(manifest, {rpc, onCheck = () => {}}) {
  const normal = manifest.flow === 'normal';
  const report = {schemaVersion: 1, flow: normal ? 'normal' : 'dispute', startedAt: new Date().toISOString(), network: 'testnet', bookingId: manifest.booking.id,
    contractId: manifest.contractId, daoId: manifest.daoId, block: null, checks: [], ledger: null,
    limits: ['Read-only RPC evidence, not a light-client proof or security audit.', 'Evidence files are synthetic; hashes do not prove physical custody.', 'Both demo council accounts are controlled by one operator.', 'The one-vote balance snapshot is historical documentation, not a fresh historical-state query.']};
  async function check(id, label, category, fn, hash) {
    let status = 'PASS', detail;
    try { detail = await fn() || 'Verified against public testnet RPC.'; }
    catch (error) { status = error instanceof Mismatch ? 'FAIL' : 'UNVERIFIED'; detail = error.message || String(error); }
    const item = {id, label, category, status, detail, ...(hash ? {transactionHash: hash} : {})};
    report.checks.push(item); onCheck(item);
    return status;
  }
  const config = await check('manifest', normal ? 'Recorded deployment and eight-step normal-return claim' : 'Recorded deployment and eleven-step dispute claim', 'Deployment', () => {
    requireThat(manifest.network === 'testnet' && manifest.version === 1 && manifest.contractId.endsWith('.testnet') && manifest.daoId.endsWith('.testnet'), 'Unexpected evidence manifest');
    requireThat(['normal','dispute'].includes(manifest.flow), 'Unknown rehearsal flow');
    const expectedSteps = normal ? ['reserve', 'pickup', 'return', 'accept-return', 'borrower-withdraw', 'treasury-proposal', 'treasury-vote-1', 'treasury-vote-2'] : ['reserve', 'pickup', 'return', 'dispute', 'settlement-proposal', 'settlement-vote-1', 'settlement-vote-2', 'treasury-proposal', 'treasury-vote-1', 'treasury-vote-2', 'borrower-withdraw'];
    requireThat(new Set(manifest.steps.map(s => s.hash)).size === expectedSteps.length, 'Expected distinct transaction hashes');
    equal(manifest.steps.map(s => s.id), expectedSteps, 'Incomplete rehearsal manifest');
    requireThat(manifest.withdrawals && Number.isSafeInteger(manifest.withdrawals.borrowerNonce) && Number.isSafeInteger(manifest.withdrawals.daoNonce), 'Withdrawal nonces missing');
    requireThat(integer(manifest.booking.damage) <= integer(manifest.booking.bond), 'Damage exceeds bond');
    if (normal) {
      equal([manifest.booking.status,manifest.booking.damage,manifest.booking.dispute_hash], ['Closed',0,null], 'Normal return must close with zero damage and no dispute');
      const acceptance=manifest.steps.find(s=>s.id==='accept-return'), pickup=manifest.steps.find(s=>s.id==='pickup');
      equal([acceptance.signerId,acceptance.receiverId,acceptance.method,acceptance.args,acceptance.deposit], [pickup.signerId,manifest.contractId,'accept_return',{id:manifest.booking.id,expected_hash:manifest.booking.return_hash},'0'], 'Acceptance must bind custodian and recorded return evidence');
    }
    return 'Booking #' + manifest.booking.id + (normal ? '; normal return' : '; settlement #' + manifest.settlement.id) + '; treasury #' + manifest.treasury.id + '. Expected values are published claims, not cached passes.';
  });
  const network = await check('network', 'RPC identifies NEAR testnet', 'Deployment', async () => {
    const status = await rpc('status', []); requireThat(status.chain_id === 'testnet', 'RPC is not NEAR testnet');
    requireThat(status.sync_info?.syncing === false, 'RPC node is still syncing');
  });
  if (config !== 'PASS' || network !== 'PASS') return finish(report);
  const anchor = await check('block', 'Current reads share one finalized block', 'Deployment', async () => {
    const block = await rpc('block', {finality: 'final'});
    available(block.header?.hash && Number.isSafeInteger(block.header.height), 'Final block unavailable');
    const time = Number(BigInt(block.header.timestamp_nanosec || block.header.timestamp) / 1000000n);
    requireThat(Math.abs(Date.now() - time) < 10 * 60 * 1000, 'Final block is stale or local clock differs by over ten minutes');
    report.block = {hash: block.header.hash, height: block.header.height, time: new Date(time).toISOString()};
    return `Final block ${report.block.height} · ${report.block.time}`;
  });
  const cached = new Map();
  async function query(account, request_type, method_name, args = {}) {
    if (anchor !== 'PASS') throw new Unavailable('Finalized state anchor unavailable');
    const key = JSON.stringify([account, request_type, method_name, args]);
    if (!cached.has(key)) cached.set(key, (async () => {
      const r = await rpc('query', {account_id: account, request_type, block_id: report.block.hash,
        ...(method_name ? {method_name, args_base64: encode(args)} : {})});
      requireThat(r.block_hash === report.block.hash && r.block_height === report.block.height, 'RPC returned a different state block');
      if (!method_name) return r;
      available(Array.isArray(r.result), 'View result unavailable');
      return JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(Uint8Array.from(r.result)));
    })());
    return cached.get(key);
  }
  const view = (account, method, args) => query(account, 'call_function', method, args);
  // Small batches avoid overwhelming public RPCs and still deliver incremental results.
  const stateChecks = [
    ['code', 'Library code matches the recorded deployment', async () => {
      const a = await query(manifest.contractId, 'view_account'); equal(a.code_hash, manifest.codeHash, 'Deployed library code hash changed');
      return `Code hash ${a.code_hash}. This pins the recorded build; it is not a reproducible-build attestation.`;
    }],
    ['keys', 'Library has no access keys', async () => { const a = await query(manifest.contractId, 'view_access_key_list'); equal(a.keys, [], 'Library has access keys'); }],
    ['authority', 'Library delegates governance to the expected DAO', async () => { const s = await view(manifest.contractId, 'get_state'); equal(s.dao, manifest.daoId, 'Library DAO differs'); }],
    ['policy', 'Current council requires two distinct approvals', async () => { checkPolicy(await view(manifest.daoId, 'get_policy'), manifest); }],
    ['booking', normal ? 'Normal return closed with zero damage and no dispute' : 'Recorded borrowing ended closed with the agreed damage', async () => {
      const s = await view(manifest.contractId, 'get_state'), b = s.bookings?.[manifest.booking.id];
      available(b, 'Recorded booking not available');
      for (const [key, value] of Object.entries(manifest.booking)) equal(b[key], value, `Booking ${key} mismatch`);
      return `Booking #${manifest.booking.id} closed: ${manifest.booking.bond - manifest.booking.damage} microNEAR borrower allocation; ${manifest.booking.fee + manifest.booking.damage} microNEAR DAO allocation. Historical allocations, not current available credits.`;
    }],
    ...(normal ? [] : [['settlement', 'Settlement proposal binds the booking, amount and decision', async () => { checkProposal(await view(manifest.daoId, 'get_proposal', {id: manifest.settlement.id}), manifest.settlement, manifest); }]]),
    ['treasury', 'Treasury proposal has both approvals and the exact withdrawal action', async () => { checkProposal(await view(manifest.daoId, 'get_proposal', {id: manifest.treasury.id}), manifest.treasury, manifest); }],
    ['ledger', 'Current whole-library accounting is independently recomputed', async () => {
      const s = await view(manifest.contractId, 'get_state'), l = await view(manifest.contractId, 'get_ledger');
      const detail = checkLedger(s, l); report.ledger = l; return detail;
    }]
  ];
  for (let i = 0; i < stateChecks.length; i += 3) await Promise.all(stateChecks.slice(i, i + 3).map(([id, label, fn]) => check(id, label, id === 'ledger' ? 'Current accounting' : 'Deployment & governance', fn)));
  const results = new Map();
  for (let i = 0; i < manifest.steps.length; i += 3) await Promise.all(manifest.steps.slice(i, i + 3).map(step => check(step.id, step.label, 'Recorded transaction flow', async () => {
    const result = await rpc('EXPERIMENTAL_tx_status', {tx_hash: step.hash, sender_account_id: step.signerId, wait_until: 'FINAL'});
    const detail = checkTransaction(result, step); results.set(step.id, result); return detail;
  }, step.hash)));
  const result = id => { available(results.has(id), `Required transaction ${id} is not verified`); return results.get(id); };
  if (!normal) {
    await check('vote-boundary', 'First settlement vote did not execute the library action', 'Execution & funds', () => {
      const r = result('settlement-vote-1'); requireThat(calls(r, manifest.daoId, manifest.contractId, 'resolve').length === 0, 'First vote unexpectedly executed resolve');
      return 'First vote finalized without a resolve receipt. The separately linked one-vote balance snapshot is historical evidence.';
    });
    await check('resolve-executed', 'Second settlement vote executed the exact DAO-authorized decision', 'Execution & funds', () => {
      checkCall(result('settlement-vote-2'), manifest.daoId, manifest.contractId, 'resolve', manifest.resolution);
    });
  }
  await check('treasury-boundary', 'First treasury vote did not withdraw library credit', 'Execution & funds', () => {
    requireThat(calls(result('treasury-vote-1'), manifest.daoId, manifest.contractId, 'withdraw').length === 0, 'First treasury vote unexpectedly withdrew');
  });
  await check('dao-paid', `DAO received ${(manifest.booking.fee + manifest.booking.damage) / 1e6} NEAR and its callback confirmed payment`, 'Execution & funds', () => {
    const r = result('treasury-vote-2'); checkCall(r, manifest.daoId, manifest.contractId, 'withdraw', {});
    checkWithdrawal(r, manifest, manifest.daoId, String((integer(manifest.booking.fee) + integer(manifest.booking.damage)) * 10n**18n), manifest.withdrawals.daoNonce);
  });
  await check('borrower-paid', `Borrower received ${(manifest.booking.bond - manifest.booking.damage) / 1e6} NEAR and its callback confirmed payment`, 'Execution & funds', () => {
    checkWithdrawal(result('borrower-withdraw'), manifest, manifest.booking.borrower, String((integer(manifest.booking.bond) - integer(manifest.booking.damage)) * 10n**18n), manifest.withdrawals.borrowerNonce);
  });
  return finish(report);
}

function finish(report) {
  report.finishedAt = new Date().toISOString();
  report.summary = Object.fromEntries(['PASS', 'FAIL', 'UNVERIFIED'].map(s => [s.toLowerCase(), report.checks.filter(c => c.status === s).length]));
  // An early exit must never accidentally be green.
  const ids = getCheckIds(report);
  report.checks.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  report.passed = report.checks.length === ids.length && report.checks.every((c, i) => c.status === 'PASS' && c.id === ids[i]);
  return report;
}
