import {checkTransaction, checkLedger, decode, Mismatch} from './engine.js';
import {Unavailable} from './rpc.js';

export const MOBILE_MANIFEST = '/verification/mobile/manifest.json';
const assert = (value, message) => { if (!value) throw new Mismatch(message); };
const labels = {
  manifest: 'Published reservation claim is internally consistent',
  network: 'RPC identifies NEAR testnet',
  block: 'Current reads share a fresh finalized block',
  reserve: 'Exact reservation and every child receipt finalized successfully',
  booking: 'Booking #13 matches the signed reservation',
  ledger: 'Current whole-library principal balances',
};

// The viewport is documented off-chain. It is deliberately not a blockchain check.
export async function runMobileVerification(manifest, {rpc, onCheck = () => {}}) {
  const report = {schemaVersion: 1, flow: 'mobile', bookingId: 13, network: 'testnet',
    startedAt: new Date().toISOString(), block: null, checks: [], ledger: null,
    limits: ['Reservation only; completed returns are separate bookings #10 and #11.',
      '390 × 844 review and signature initiation are operator-captured browser evidence, not chain attestations.',
      'Meteor approval was real; final UI confirmation was observed at 1280 × 609. No physical-phone test.',
      'Fresh public RPC evidence, not a light-client proof or security audit.']};
  const emit = (id, status, detail) => {
    const item = {id, label: labels[id], status, detail};
    report.checks.push(item); onCheck(item); return status === 'PASS';
  };
  const check = async (id, fn) => {
    try { return emit(id, 'PASS', await fn() || 'Verified against fresh public testnet RPC.'); }
    catch (error) { return emit(id, error instanceof Mismatch ? 'FAIL' : 'UNVERIFIED', error.message); }
  };
  const finish = () => {
    for (const id of Object.keys(labels)) if (!report.checks.some(c => c.id === id)) emit(id, 'UNVERIFIED', 'Required manifest or network evidence unavailable.');
    report.finishedAt = new Date().toISOString();
    report.summary = Object.fromEntries(['PASS', 'FAIL', 'UNVERIFIED'].map(s => [s.toLowerCase(), report.checks.filter(c => c.status === s).length]));
    report.passed = report.checks.every(c => c.status === 'PASS');
    return report;
  };
  const valid = await check('manifest', () => {
    const {booking: b, transaction: t} = manifest;
    assert(manifest.version === 1 && manifest.network === 'testnet' && manifest.flow === 'mobile' && b?.id === 13, 'Unexpected mobile reservation manifest');
    assert(manifest.contractId === 'library.ckdao-mw7e25at.testnet' && b.borrower === 'borrower.commonkit-mw7dph80.testnet', 'Unexpected library or borrower');
    assert(b.asset_id === 'campus-camera' && b.start === 1794495600 && b.end === 1794499200 && b.fee === 1000 && b.bond === 10000, 'Unexpected booking terms');
    assert(t?.hash === '3auV5rdBF2ykhfLpBcbsXz877Xhnnz15AFEVR6GRAuy5' && t.signerId === b.borrower && t.receiverId === manifest.contractId && t.method === 'reserve' && t.deposit === '111000000000000000000000', 'Unexpected reservation transaction');
    assert(t.args?.asset_id === b.asset_id && t.args.start === b.start && t.args.end === b.end && Object.keys(t.args).length === 3 && decode(t.returnValue) === '13', 'Reservation arguments or returned booking ID differ');
    return 'Booking #13 · 0.111 testnet NEAR attached. Published values are claims, not cached passes.';
  });
  if (!valid) return finish();
  if (!await check('network', async () => {
    const status = await rpc('status', []);
    assert(status.chain_id === 'testnet' && status.sync_info?.syncing === false, 'RPC network differs or node is syncing');
  })) return finish();
  const anchored = await check('block', async () => {
    const {header} = await rpc('block', {finality: 'final'});
    if (!header?.hash || !Number.isSafeInteger(header.height)) throw new Unavailable('Final block unavailable');
    const time = Number(BigInt(header.timestamp_nanosec || header.timestamp) / 1000000n);
    assert(Math.abs(Date.now() - time) < 600000, 'Final block is stale or local clock differs by over ten minutes');
    report.block = {hash: header.hash, height: header.height, time: new Date(time).toISOString()};
    return `Final block ${header.height} · ${report.block.time}`;
  });
  await check('reserve', async () => {
    const t = manifest.transaction;
    const result = await rpc('EXPERIMENTAL_tx_status', {tx_hash: t.hash, sender_account_id: t.signerId, wait_until: 'FINAL'});
    return checkTransaction(result, t);
  });
  const views = new Map();
  const view = method => {
    if (!anchored) throw new Unavailable('Finalized state anchor unavailable');
    if (!views.has(method)) views.set(method, (async () => {
      const result = await rpc('query', {account_id: manifest.contractId, request_type: 'call_function', method_name: method, args_base64: 'e30=', block_id: report.block.hash});
      assert(result.block_hash === report.block.hash && result.block_height === report.block.height, 'RPC returned a different state block');
      if (!Array.isArray(result.result)) throw new Unavailable('Contract view result unavailable');
      return JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(Uint8Array.from(result.result)));
    })());
    return views.get(method);
  };
  await check('booking', async () => {
    const b = (await view('get_state')).bookings?.[13];
    assert(b, 'Recorded booking missing from current state');
    for (const key of ['id', 'asset_id', 'borrower', 'start', 'end', 'fee', 'bond']) assert(b[key] === manifest.booking[key], `Booking ${key} mismatch`);
    report.bookingStatus = b.status;
    return `Immutable reservation terms match. Current status: ${b.status}. Later returns or cancellations do not invalidate this reservation receipt.`;
  });
  await check('ledger', async () => {
    const state = await view('get_state'), ledger = await view('get_ledger');
    const detail = checkLedger(state, ledger); report.ledger = ledger; return detail;
  });
  return finish();
}
