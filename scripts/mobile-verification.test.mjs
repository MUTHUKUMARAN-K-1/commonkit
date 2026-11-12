import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {runMobileVerification} from '../app/public/verification/mobile-engine.js';
import {Unavailable} from '../app/public/verification/rpc.js';

const read = async path => JSON.parse(await fs.readFile(new URL(path, import.meta.url), 'utf8'));
const manifest = await read('../app/public/verification/mobile/manifest.json');
const receipt = await read('../app/public/verification/mobile/reserve.json');
const snapshot = await read('../docs/testnet/mobile-booking-2026-11-12/after.json');
function setup(mutate = () => {}) {
  const data = {receipt: structuredClone(receipt), state: structuredClone(snapshot.state.value), ledger: structuredClone(snapshot.ledger.value)};
  mutate(data);
  const rpc = async (method, params) => {
    if (method === 'status') return {chain_id: 'testnet', sync_info: {syncing: false}};
    if (method === 'block') return {header: {hash: 'test-final-block', height: 99, timestamp_nanosec: String(BigInt(Date.now()) * 1000000n)}};
    if (method === 'EXPERIMENTAL_tx_status') {
      assert.equal(params.tx_hash, manifest.transaction.hash);
      assert.equal(params.wait_until, 'FINAL'); return data.receipt;
    }
    assert.equal(method, 'query'); assert.equal(params.block_id, 'test-final-block');
    assert.equal(params.account_id, manifest.contractId);
    assert.equal(params.request_type, 'call_function');
    assert(['get_state', 'get_ledger'].includes(params.method_name));
    return {block_hash: 'test-final-block', block_height: 99, result: [...Buffer.from(JSON.stringify(params.method_name === 'get_state' ? data.state : data.ledger))]};
  };
  return {rpc};
}
test('mobile proof validates recorded booking and connected receipt graph using fresh reads', async () => {
  const report = await runMobileVerification(manifest, setup());
  assert.equal(report.passed, true, JSON.stringify(report.checks));
  assert.deepEqual(report.summary, {pass: 6, fail: 0, unverified: 0});
});
test('receipt failure or changed deposit cannot produce a mobile proof pass', async () => {
  for (const mutate of [d => {d.receipt.receipts_outcome[0].outcome.status = {Failure: {error: 'rejected'}};}, d => {d.receipt.transaction.actions[0].FunctionCall.deposit = '1';}]) {
    const report = await runMobileVerification(manifest, setup(mutate));
    assert.equal(report.checks.find(c => c.id === 'reserve').status, 'FAIL');
    assert.equal(report.passed, false);
  }
});
test('unavailable receipt never falls back to published JSON', async () => {
  const {rpc} = setup();
  const report = await runMobileVerification(manifest, {rpc: (m, p) => {
    if (m === 'EXPERIMENTAL_tx_status') throw new Unavailable('Archive offline');
    return rpc(m, p);
  }});
  assert.equal(report.checks.find(c => c.id === 'reserve').status, 'UNVERIFIED');
  assert.equal(report.passed, false);
});
test('changed immutable booking terms and an unbalanced ledger are failures', async () => {
  const report = await runMobileVerification(manifest, setup(d => {d.state.bookings[13].start++; d.ledger.escrow++;}));
  assert.equal(report.checks.find(c => c.id === 'booking').status, 'FAIL');
  assert.equal(report.checks.find(c => c.id === 'ledger').status, 'FAIL');
});
test('later legitimate cancellation preserves the historical reservation proof', async () => {
  const report = await runMobileVerification(manifest, setup(d => {
    d.state.bookings[13].status = 'Cancelled';
    d.state.credits[manifest.booking.borrower] = 11000;
    d.ledger.escrow -= 11000; d.ledger.credits += 11000;
  }));
  assert.equal(report.passed, true, JSON.stringify(report.checks));
  assert.equal(report.bookingStatus, 'Cancelled');
});
test('mismatched state block fails, and a missing anchor cannot pass current state', async () => {
  for (const unavailable of [false, true]) {
    const {rpc} = setup();
    const report = await runMobileVerification(manifest, {rpc: async (m, p) => {
      if (unavailable && m === 'block') throw new Unavailable('No finalized block');
      const result = await rpc(m, p);
      if (m === 'query') result.block_hash = 'other-block';
      return result;
    }});
    assert.equal(report.passed, false);
    assert.equal(report.checks.find(c => c.id === 'booking').status, unavailable ? 'UNVERIFIED' : 'FAIL');
  }
});
test('wrong network and inconsistent manifest cannot be reported as complete', async () => {
  const wrong = structuredClone(manifest); wrong.transaction.args.start++;
  const invalid = await runMobileVerification(wrong, setup());
  assert.equal(invalid.checks[0].status, 'FAIL');
  assert.equal(invalid.summary.unverified, 5);
  const {rpc} = setup();
  const network = await runMobileVerification(manifest, {rpc: (m, p) => m === 'status' ? {chain_id: 'mainnet', sync_info: {syncing: false}} : rpc(m, p)});
  assert.equal(network.passed, false);
  assert.equal(network.summary.unverified, 4);
});
