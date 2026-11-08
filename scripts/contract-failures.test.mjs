import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {Near, generateKey} from 'near-kit';
import {Sandbox} from 'near-kit/sandbox';
import {loadDaoWasm, sha256, DAO_WASM_SHA256, DAO_SOURCE} from './sandbox-fixture.mjs';

// Sign ONLY to the fresh loopback sandbox. No .testnet files or wallet keys.
const root = new URL('../', import.meta.url);
const SANDBOX_VERSION = '2.14.0';
const UNIT = 10n ** 18n;
const hash = 'a'.repeat(64), otherHash = 'b'.repeat(64);
const report = {network:'local sandbox', sandboxVersion:SANDBOX_VERSION, startedAt:new Date().toISOString(), checks:[]};
const outcomes = r => [r.transaction_outcome, ...r.receipts_outcome];
const failures = r => outcomes(r).filter(o => o.outcome.status.Failure);
const value = r => JSON.parse(Buffer.from(r.status.SuccessValue, 'base64').toString());
function success(r) {
  assert.equal(r.final_execution_status, 'FINAL');
  assert.deepEqual(failures(r), [], 'Unexpected failed receipt');
  assert.ok(Object.hasOwn(r.status, 'SuccessValue'));
  return r;
}

test('compiled CommonKit contract failures and real Sputnik execution', {timeout:600000}, async t => {
  assert.notEqual(process.platform, 'win32', 'Run with Linux Node in WSL, or Linux/macOS; NEAR Sandbox has no Windows binary');
  const [wasm, driver, daoWasm] = await Promise.all([
    readFile(new URL('target/wasm32-unknown-unknown/release/commonkit_contract.wasm', root)),
    readFile(new URL('target/wasm32-unknown-unknown/release/examples/failure_driver.wasm', root)),
    loadDaoWasm(),
  ]);
  report.contractWasmSha256 = sha256(wasm);
  report.driverWasmSha256 = sha256(driver);
  report.sputnik = {source:DAO_SOURCE, wasmSha256:DAO_WASM_SHA256};
  const sandbox = await Sandbox.start({version:SANDBOX_VERSION, detached:false});
  const url = new URL(sandbox.rpcUrl);
  assert.equal(url.hostname, '127.0.0.1');
  const accounts = {root:{id:sandbox.rootAccount.id, key:sandbox.rootAccount.secretKey}};
  const client = role => new Near({network:sandbox, privateKey:accounts[role].key, defaultSignerId:accounts[role].id});
  async function rpc(method, params) {
    const response = await fetch(sandbox.rpcUrl, {method:'POST', headers:{'content-type':'application/json'},
      body:JSON.stringify({jsonrpc:'2.0', id:1, method, params}), signal:AbortSignal.timeout(45000)});
    assert.ok(response.ok, `Sandbox HTTP ${response.status}`);
    const body = await response.json();
    assert.ok(!body.error, `Sandbox RPC ${JSON.stringify(body.error)}`);
    return body.result;
  }
  // Raw final outcomes retain EXPECTED failures instead of a client exception.
  async function send(tx) {
    await tx.sign();
    const result=await rpc('send_tx', {signed_tx_base64:Buffer.from(tx.serialize()).toString('base64'), wait_until:'FINAL'});
    assert.equal(result.final_execution_status,'FINAL');
    return result;
  }
  const call = (role, receiver, method, args={}, deposit='0 NEAR', gas='150 Tgas') =>
    send(client(role).transaction(accounts[role].id).functionCall(accounts[receiver].id, method, args, {gas, attachedDeposit:deposit}));
  const view = (role, method, args={}) => client('root').view(accounts[role].id, method, args);
  const state = () => view('library','get_state');
  const ledger = () => view('library','get_ledger');
  async function create(role) {
    const key = generateKey();
    accounts[role] = {id:`${role}.${accounts.root.id}`, key:key.secretKey};
    success(await send(client('root').transaction(accounts.root.id).createAccount(accounts[role].id)
      .transfer(accounts[role].id,'20 NEAR').addKey(String(key.publicKey), {type:'fullAccess'})));
  }
  async function rejected(role, method, args, message, deposit='0 NEAR', gas='150 Tgas') {
    const before = await state();
    const r = await call(role,'library',method,args,deposit,gas);
    assert.ok(r.status.Failure, 'Expected a final contract rejection, not a transport error');
    assert.match(JSON.stringify(failures(r)), message);
    assert.deepEqual(await state(), before, 'A rejected receipt changed persisted contract state');
    assert.equal((await ledger()).balanced,true);
    return r;
  }
  async function check(name, fn) {
    await t.test(name, async () => {
      const entry = {name, passed:false}; report.checks.push(entry);
      try {
        const result = await fn(); entry.passed = true;
        if (result?.transaction) {
          entry.transactionHash = result.transaction.hash;
          entry.finalStatus = result.status;
          entry.receipts = result.receipts_outcome.map(o => ({id:o.id, executor:o.outcome.executor_id, status:o.outcome.status}));
        }
      } catch (error) { entry.error=error.message; throw error; }
    });
    // Later tests depend on the prior state; stop after a failed subtest.
    assert.equal(report.checks.at(-1).passed,true, `Stopped after ${name}`);
  }
  try {
    for (const role of ['library','borrower','custodian','dao','council1','council2','vanishing']) await create(role);
    success(await send(client('library').transaction(accounts.library.id).deployContract(accounts.library.id,wasm)
      .functionCall(accounts.library.id,'new',{dao:accounts.dao.id},{gas:'100 Tgas'})));
    // Bootstrap under a sandbox-only DAO key, then install the actual Sputnik code.
    success(await call('dao','library','set_member',{member:accounts.borrower.id,admitted:true}));
    success(await call('dao','library','set_member',{member:accounts.vanishing.id,admitted:true}));
    success(await call('dao','library','register_asset',{id:'camera',name:'Sandbox camera',custodian:accounts.custodian.id,fee_micro_near:1000,bond_micro_near:10000}));
    const policy = {roles:[{name:'council',kind:{Group:[accounts.council1.id,accounts.council2.id]},permissions:['*:AddProposal','*:VoteApprove','*:VoteReject'],vote_policy:{}}],default_vote_policy:{weight_kind:'RoleWeight',quorum:'2',threshold:'2'},proposal_bond:'10000000000000000000000',proposal_period:'604800000000000',bounty_bond:'10000000000000000000000',bounty_forgiveness_period:'86400000000000'};
    success(await send(client('dao').transaction(accounts.dao.id).deployContract(accounts.dao.id,daoWasm)
      .functionCall(accounts.dao.id,'new',{config:{name:'Failure tests',purpose:'Isolated CommonKit receipt tests',metadata:''},policy},{gas:'100 Tgas'})));
    const now = async () => Math.floor(Number((await rpc('block',{finality:'final'})).header.timestamp_nanosec)/1e9);
    let start=(await now())+30, end=start+3600;
    await check('invalid reserve deposit rolls back state', () => rejected('borrower','reserve',{asset_id:'camera',start,end},/whole microNEAR/,'111000000000000000000001 yocto'));
    const booking=(await state()).next_booking;
    success(await call('borrower','library','reserve',{asset_id:'camera',start,end},'0.111 NEAR'));
    await sandbox.fastForward(60);
    success(await call('custodian','library','pickup',{id:booking,evidence_hash:hash}));
    success(await call('borrower','library','request_return',{id:booking,evidence_hash:hash}));
    await check('borrower cannot approve their own return', () => rejected('borrower','accept_return',{id:booking,expected_hash:hash},/custodian/i));
    await check('stale return evidence cannot settle', () => rejected('custodian','accept_return',{id:booking,expected_hash:otherHash},/evidence|hash/i));
    success(await call('custodian','library','dispute',{id:booking,evidence_hash:otherHash}));
    await check('borrower cannot resolve a dispute', () => rejected('borrower','resolve',{id:booking,damage_micro_near:3000,evidence_hash:hash},/DAO authorization/));
    await check('council signer cannot bypass the DAO contract', () => rejected('council1','resolve',{id:booking,damage_micro_near:3000,evidence_hash:hash},/DAO authorization/));
    const kind = damage => ({FunctionCall:{receiver_id:accounts.library.id,actions:[{method_name:'resolve',args:Buffer.from(JSON.stringify({id:booking,damage_micro_near:damage,evidence_hash:hash})).toString('base64'),deposit:'0',gas:'100000000000000'}]}});
    async function propose(damage) {
      const id=await view('dao','get_last_proposal_id');
      success(await call('council1','dao','add_proposal',{proposal:{description:'Sandbox settlement failure test',kind:kind(damage)}},'0.01 NEAR'));
      return id;
    }
    const vote=(role,id,damage)=>call(role,'dao','act_proposal',{id,action:'VoteApprove',proposal:kind(damage)},'0 NEAR','250 Tgas');
    const badProposal=await propose(10001);
    await check('one council vote leaves disputed escrow untouched', async () => {
      const before=await state(); const r=success(await vote('council1',badProposal,10001));
      assert.equal((await view('dao','get_proposal',{id:badProposal})).status,'InProgress');
      assert.deepEqual(await state(),before); return r;
    });
    await check('failed DAO execution is Failed and leaves escrow intact', async () => {
      const before=await state(); const r=await vote('council2',badProposal,10001);
      assert.match(JSON.stringify(failures(r)), /Damages exceed the bond/);
      assert.equal((await view('dao','get_proposal',{id:badProposal})).status,'Failed');
      assert.deepEqual(await state(),before); assert.equal((await ledger()).escrow,11000); return r;
    });
    const goodProposal=await propose(3000);
    success(await vote('council1',goodProposal,3000));
    await check('corrected proposal settles only after both votes', async () => {
      const r=success(await vote('council2',goodProposal,3000)); const s=await state();
      assert.equal((await view('dao','get_proposal',{id:goodProposal})).status,'Approved');
      assert.equal(s.bookings[booking].status,'Closed'); assert.equal(s.credits[accounts.borrower.id],7000);
      assert.equal(s.credits[accounts.dao.id],4000); assert.equal((await ledger()).balanced,true); return r;
    });
    await check('replaying settlement cannot allocate credits again', () => rejected('dao','resolve',{id:booking,damage_micro_near:3000,evidence_hash:hash},/not disputed/));
    await check('external callers cannot forge a withdrawal callback', () => rejected('borrower','on_withdrawal',{nonce:0},/private/i));
    await check('self call without a dependency receipt is rejected', () => rejected('library','on_withdrawal',{nonce:0},/Expected one transfer receipt/));
    await check('insufficient withdrawal gas preserves available credit', () => rejected('borrower','withdraw',{},/at least 50 TGas/,'0 NEAR','40 Tgas'));
    await check('liquid balance guard rolls back the already-created pending nonce', async () => {
      const account=await rpc('query',{request_type:'view_account',account_id:accounts.library.id,finality:'final'});
      const original={amount:account.amount,locked:account.locked,code_hash:account.code_hash,storage_usage:account.storage_usage,version:'V1'};
      await sandbox.patchState([{Account:{account_id:accounts.library.id,account:{...original,amount:String(BigInt(account.storage_usage)*10n**19n+UNIT)}}}]);
      try { return await rejected('borrower','withdraw',{},/Insufficient liquid balance/); }
      finally {await sandbox.patchState([{Account:{account_id:accounts.library.id,account:original}}]);}
    });
    await check('second withdrawal in one receipt rejects pending spend and rolls back batch', async () => {
      const before=await state();
      const tx=client('borrower').transaction(accounts.borrower.id);
      for (let i=0;i<2;i++) tx.functionCall(accounts.library.id,'withdraw',{}, {gas:'100 Tgas'});
      const r=await send(tx); assert.ok(r.status.Failure); assert.match(JSON.stringify(failures(r)),/pending/i);
      assert.deepEqual(await state(),before); assert.equal((await ledger()).balanced,true); return r;
    });
    // Reserve + cancel creates legitimate credit for a contract account.
    start=(await now())+120; end=start+3600;
    const cancelled=(await state()).next_booking;
    success(await call('vanishing','library','reserve',{asset_id:'camera',start,end},'0.111 NEAR'));
    success(await call('vanishing','library','cancel',{id:cancelled}));
    success(await send(client('vanishing').transaction(accounts.vanishing.id).deployContract(accounts.vanishing.id,driver)));
    const failedNonce=(await state()).next_nonce;
    await check('failed transfer restores credit and clears pending withdrawal', async () => {
      const before=await state();
      const r=await call('root','vanishing','withdraw_after_delete',{library:accounts.library.id,beneficiary:accounts.root.id},'0 NEAR','250 Tgas');
      assert.match(JSON.stringify(failures(r)),/AccountDoesNotExist/);
      assert.equal(failures(r).length,1); assert.equal(failures(r)[0].outcome.executor_id,accounts.vanishing.id);
      // true acknowledges processing this nonce, including credit restoration.
      // It is NOT proof of payment: the failed child receipt must remain visible.
      assert.equal(value(r),true, 'Withdrawal callback should acknowledge the restored nonce');
      const s=await state(); assert.equal(s.credits[accounts.vanishing.id],11000);
      assert.deepEqual(s.pending,{}); assert.equal(s.total_withdrawn,before.total_withdrawn);
      assert.equal(s.next_nonce,failedNonce+1); assert.equal((await ledger()).balanced,true); return r;
    });
    // Recreate ONLY the deleted sandbox receiver and retry its restored credit.
    await create('vanishing');
    const successfulNonce=(await state()).next_nonce;
    await check('retry pays exactly once after receiver recovery', async () => {
      const before=await state(); const r=success(await call('vanishing','library','withdraw'));
      assert.equal(value(r),true); const s=await state();
      assert.equal(s.credits[accounts.vanishing.id],0); assert.deepEqual(s.pending,{});
      assert.equal(s.total_withdrawn,before.total_withdrawn+11000); assert.equal(s.next_nonce,successfulNonce+1);
      const detail=await rpc('EXPERIMENTAL_tx_status',{tx_hash:r.transaction.hash,sender_account_id:accounts.vanishing.id,wait_until:'FINAL'});
      const payments=detail.receipts.filter(receipt=>receipt.predecessor_id===accounts.library.id && receipt.receiver_id===accounts.vanishing.id &&
        receipt.receipt.Action?.actions.some(action=>action.Transfer?.deposit===String(11000n*UNIT)));
      assert.equal(payments.length,1,'Require the exact library-to-receiver principal transfer, not a gas refund');
      assert.ok(Object.hasOwn(detail.receipts_outcome.find(o=>o.id===payments[0].receipt_id).outcome.status,'SuccessValue'));
      assert.equal((await ledger()).balanced,true); return r;
    });
    await check('second withdrawal cannot spend the same credit', () => rejected('vanishing','withdraw',{},/No available credit/));
    for (const [nonce,failed] of [[failedNonce,true],[successfulNonce,false]]) {
      await check(`duplicate ${failed?'failure':'success'} callback cannot change credit or totals`, async () => {
        const before=await state();
        success(await send(client('library').transaction(accounts.library.id).deployContract(accounts.library.id,driver)));
        const r=await call('library','library','replay_callback',{original_code:wasm.toString('base64'),nonce,failed},'0 NEAR','250 Tgas');
        if (failed) {assert.equal(failures(r).length,1);assert.match(JSON.stringify(failures(r)),/MethodNotFound/);} else success(r);
        assert.equal(value(r),false); assert.deepEqual(await state(),before); assert.equal((await ledger()).balanced,true);
        const code=await rpc('query',{request_type:'view_code',account_id:accounts.library.id,finality:'final'});
        assert.equal(sha256(Buffer.from(code.code_base64,'base64')),sha256(wasm)); return r;
      });
    }
    report.finalLedger=await ledger(); report.passed=true;
  } finally {
    report.completedAt=new Date().toISOString(); report.passed=report.passed===true && report.checks.every(c=>c.passed);
    await mkdir(new URL('artifacts/',root),{recursive:true});
    await writeFile(new URL('artifacts/contract-failures-report.json',root),JSON.stringify(report,null,2)+'\n');
    await sandbox.stop();
  }
});
