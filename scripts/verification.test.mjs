import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {runVerification} from '../app/public/verification/engine.js';
import {createRpc, Unavailable} from '../app/public/verification/rpc.js';

const fixture = JSON.parse(await fs.readFile(new URL('./fixtures/verification-rpc.json', import.meta.url)));
const manifest = JSON.parse(await fs.readFile(new URL('../app/public/verification/manifest.json', import.meta.url)));
const read = r => JSON.parse(Buffer.from(r.result).toString());
const write = (r, value) => { r.result = [...Buffer.from(JSON.stringify(value))]; };
function setup() {
  const data = structuredClone(fixture);
  data.block.header.timestamp_nanosec = String(BigInt(Date.now()) * 1000000n);
  const rpc = async (method, params) => {
    if (method === 'status') return data.status;
    if (method === 'block') return data.block;
    if (method === 'EXPERIMENTAL_tx_status') {
      assert.equal(params.wait_until, 'FINAL');
      const tx = data.transactions.find(r => r.transaction.hash === params.tx_hash);
      if (!tx) throw new Unavailable('Receipt pruned');
      return tx;
    }
    assert.equal(method, 'query'); assert.equal(params.block_id, data.block.header.hash);
    if (params.request_type === 'view_account') return data.account;
    if (params.request_type === 'view_access_key_list') return data.keys;
    const names = {get_state: 'state', get_ledger: 'ledger', get_policy: 'policy'};
    const key = names[params.method_name] || (JSON.parse(Buffer.from(params.args_base64, 'base64')).id === 6 ? 'settlement' : 'treasury');
    return data[key];
  };
  return {data, rpc};
}
test('recorded real RPC fixture passes all 27 checks without signing', async () => {
  const report = await runVerification(manifest, setup());
  assert.equal(report.passed, true, JSON.stringify(report.checks.filter(c => c.status !== 'PASS')));
  assert.deepEqual(report.summary, {pass: 27, fail: 0, unverified: 0});
});

const mutations = [
  ['wrong network', 'network', d => { d.status.chain_id = 'mainnet'; }],
  ['stale final block', 'block', d => { d.block.header.timestamp_nanosec = '1000000'; }],
  ['different query block', 'code', d => { d.account.block_hash = 'other'; }],
  ['changed deployment', 'code', d => { d.account.code_hash = 'other'; }],
  ['library access key exists', 'keys', d => { d.keys.keys = [{public_key: 'unexpected'}]; }],
  ['wrong governance account', 'authority', d => { const s = read(d.state); s.dao = 'other.testnet'; write(d.state, s); }],
  ['one-vote policy', 'policy', d => { const p = read(d.policy); p.default_vote_policy.threshold = '1'; write(d.policy, p); }],
  ['approval bypass role', 'policy', d => { const p = read(d.policy); p.roles.push({name: 'bypass', kind: 'Everyone', permissions: ['call:VoteApprove']}); write(d.policy, p); }],
  ['wrong council member', 'policy', d => { const p = read(d.policy); p.roles[0].kind.Group[1] = 'other.testnet'; write(d.policy, p); }],
  ['booking not closed', 'booking', d => { const s = read(d.state); s.bookings[4].status = 'Disputed'; write(d.state, s); }],
  ['decision evidence changed', 'booking', d => { const s = read(d.state); s.bookings[4].dispute_hash = '0'.repeat(64); write(d.state, s); }],
  ['only one recorded approval', 'settlement', d => { const p = read(d.settlement); delete p.votes[manifest.council[0]]; write(d.settlement, p); }],
  ['rejected proposal', 'settlement', d => { const p = read(d.settlement); p.status = 'Rejected'; write(d.settlement, p); }],
  ['proposal wrong receiver', 'settlement', d => { const p = read(d.settlement); p.kind.FunctionCall.receiver_id = 'other.testnet'; write(d.settlement, p); }],
  ['treasury extra action', 'treasury', d => { const p = read(d.treasury); p.kind.FunctionCall.actions.push(p.kind.FunctionCall.actions[0]); write(d.treasury, p); }],
  ['false balanced flag', 'ledger', d => { const l = read(d.ledger); l.withdrawn++; write(d.ledger, l); }],
  ['unaccounted credit', 'ledger', d => { const s = read(d.state); s.credits['other.testnet'] = 1; write(d.state, s); }],
  ['unsafe accounting integer', 'ledger', d => { const s = read(d.state); s.total_withdrawn = Number.MAX_SAFE_INTEGER + 1; write(d.state, s); }],
  ['non-final receipt', 'reserve', d => { d.transactions[0].final_execution_status = 'EXECUTED_OPTIMISTIC'; }],
  ['wrong signer', 'reserve', d => { d.transactions[0].transaction.signer_id = 'other.testnet'; }],
  ['wrong deposit', 'reserve', d => { d.transactions[0].transaction.actions[0].FunctionCall.deposit = '0'; }],
  ['initial receipt differs from transaction', 'pickup', d => { d.transactions[1].receipts[0].receipt.Action.actions[0].FunctionCall.method_name = 'dispute'; }],
  ['wrong booking argument', 'pickup', d => { d.transactions[1].transaction.actions[0].FunctionCall.args = Buffer.from(JSON.stringify({id: 99})).toString('base64'); }],
  ['wrong vote proposal ID', 'settlement-vote-1', d => { const a = d.transactions[5].transaction.actions[0].FunctionCall; const args = JSON.parse(Buffer.from(a.args, 'base64')); args.id = 7; a.args = Buffer.from(JSON.stringify(args)).toString('base64'); }],
  ['child failure hidden behind root success', 'settlement-vote-2', d => { d.transactions[6].receipts_outcome[0].outcome.status = {Failure: {error: 'failed'}}; }],
  ['missing child outcome', 'reserve', d => { d.transactions[0].receipts_outcome.pop(); }],
  ['missing receipt bodies', 'reserve', d => { delete d.transactions[0].receipts; }],
  ['duplicate receipt', 'reserve', d => { d.transactions[0].receipts.push(d.transactions[0].receipts[0]); }],
  ['wrong transfer amount', 'borrower-paid', d => { const t = d.transactions[10].receipts.find(r => r.predecessor_id === manifest.contractId && r.receipt.Action.actions[0].Transfer); t.receipt.Action.actions[0].Transfer.deposit = '1'; }],
  ['gas refund substituted for principal', 'borrower-paid', d => { const t = d.transactions[10].receipts.find(r => r.predecessor_id === manifest.contractId && r.receipt.Action.actions[0].Transfer); t.predecessor_id = 'system'; }],
  ['callback false despite root success', 'borrower-paid', d => { const t = d.transactions[10]; const r = t.receipts.find(r => r.receipt.Action.actions[0].FunctionCall?.method_name === 'on_withdrawal'); t.receipts_outcome.find(o => o.id === r.receipt_id).outcome.status = {SuccessValue: 'ZmFsc2U='}; }],
  ['unrelated callback', 'borrower-paid', d => { const t = d.transactions[10]; const r = t.receipts.find(r => r.receipt.Action.actions[0].FunctionCall?.method_name === 'on_withdrawal'); r.receipt.Action.input_data_ids = []; }]
];
for (const [label, id, mutate] of mutations) test(`never passes when ${label}`, async () => {
  const {data, rpc} = setup(); mutate(data);
  const report = await runVerification(manifest, {rpc});
  assert.equal(report.passed, false);
  assert.notEqual(report.checks.find(c => c.id === id)?.status, 'PASS', id);
});

test('later legitimate bookings do not invalidate historical settlement or require zero current escrow', async () => {
  const {data, rpc} = setup(), s = read(data.state), l = read(data.ledger);
  s.bookings[5] = {...s.bookings[4], id: 5, status: 'Reserved'}; s.total_deposited += 11000;
  l.deposited += 11000; l.escrow += 11000; write(data.state, s); write(data.ledger, l);
  assert.equal((await runVerification(manifest, {rpc})).passed, true);
});
test('RPC outage cannot produce green or reuse historical evidence', async () => {
  const report = await runVerification(manifest, {rpc: async () => { throw new Unavailable('RPC offline'); }});
  assert.equal(report.passed, false); assert.equal(report.summary.unverified, 1);
});
test('pruned historical transaction is unverified and its derived checks cannot pass', async () => {
  const {data, rpc} = setup(); data.transactions.pop();
  const report = await runVerification(manifest, {rpc});
  assert.equal(report.checks.find(c => c.id === 'borrower-withdraw').status, 'UNVERIFIED');
  assert.equal(report.checks.find(c => c.id === 'borrower-paid').status, 'UNVERIFIED');
});
test('read transport refuses write methods and falls back only after an unavailable endpoint', async () => {
  const urls = [];
  const {rpc, requests} = createRpc({endpoints: ['https://first.example', 'https://second.example'], fetchImpl: async url => { urls.push(url); return url.includes('first') ? {ok: false, status: 503} : {ok: true, json: async () => ({result: {chain_id: 'testnet'}})}; }});
  await assert.rejects(rpc('broadcast_tx_commit', {}), /Read-only/); assert.equal(urls.length, 0);
  assert.equal((await rpc('status', [])).chain_id, 'testnet'); assert.equal(requests.length, 2);
});
