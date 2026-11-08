# Compiled-contract failure tests

`npm run test:contract` runs the release Wasm against NEAR Sandbox **2.14.0** using the existing `near-kit` dependency. It creates disposable accounts with generated keys on loopback. It never reads `.testnet`, opens a wallet, or signs on a public network.

Recorded on 8 November 2026: **19/19 targeted cases passed** (Node reports 20 tests including the parent). The [sanitized receipt report](testnet/contract-failures-sandbox.json) records the actual sandbox execution. The production Wasm remains SHA-256 `687dbd4f95d90c346eeabf738a1e270c2db9cc74a2d1bd5803ccb6c75761192c`, identical to the existing testnet deployment artifact. All 52 JavaScript tests, 14 Rust core tests, the local API lifecycle and production build also passed. A fresh read-only verification of the existing public dispute rehearsal passed 27/27 checks.

## Run

On Linux/macOS, with Node 24, Rust 1.95.0, and the Wasm target:

```sh
npm ci
RUSTFLAGS='--cfg near' cargo +1.95.0 build -p commonkit-contract --lib --examples --target wasm32-unknown-unknown --release --locked
npm run test:contract
```

On Windows, build with `npm run build:contract:tests`, then run `npm run test:contract` from WSL with a **Linux** Node 24 installation. A WSL shim that launches Windows Node cannot run the Linux sandbox binary.

The first run downloads the official sandbox binary and reads publicly deployed Sputnik bytecode into ignored `artifacts/sputnik-dao.wasm`. Both are cached. Sputnik is pinned to SHA-256 `880bae9a58c99ec1efe8b10cf834b3f0c0ebc7a05d71206f3c1202c4280952da` from `ckdao-mw7e25at.sputnikv2.testnet`. Every run checks the cached fixture hash; an unexpected code change fails the suite. This is real Sputnik execution in isolation, not a mock council. See [fixture loader](../scripts/sandbox-fixture.mjs).

CI builds both artifacts, runs the suite, and uploads `contract-failures-report.json`. A local report is written to `artifacts/contract-failures-report.json`, including each check's result, final transaction status and receipt outcomes; it contains no keys or signed transaction bytes.

## What the cases establish

| Case | Required result |
| --- | --- |
| Non-integer microNEAR deposit | Contract rejects; persisted state unchanged |
| Borrower self-approval or stale return hash | No settlement or credit allocation |
| Borrower/council calling `resolve` directly | DAO authorization rejects the call |
| One of two council votes | Proposal remains in progress; disputed escrow unchanged |
| Two votes for damages above the bond | Library receipt fails; actual Sputnik proposal becomes `Failed`; escrow and credits unchanged |
| Corrected two-vote proposal | Booking closes with borrower 7,000 and DAO 4,000 microNEAR credits |
| Duplicate settlement | No second allocation |
| External callback or self call with no receipt | Private/receipt-count guards reject; state unchanged |
| Withdrawal below 50 TGas | Credit remains available |
| Liquid balance below the storage reserve | Pending nonce created earlier in the method is rolled back |
| Two withdrawals in one action receipt | Pending guard rejects the second; the whole receipt rolls back |
| Transfer to deleted receiver | Actual failed transfer reaches the callback; credit restored, pending cleared, withdrawn total unchanged |
| Retry after receiver recreation | Exactly one payment; credit zero; pending empty; withdrawn total increases once |
| Second spend after success | No available credit; rejected |
| Duplicate failed/successful callback | Both return false; no credit, pending, or total changes |

Every expected rejection checks persisted state, rather than treating any thrown client/network error as proof of contract enforcement. The checks inspect child receipts; a successful outer DAO transaction does not hide an execution failure.

`on_withdrawal` returns `true` when it processes an existing pending nonce, including when it restores credit after a failed transfer. It returns `false` for an unknown/already-consumed nonce. Its Boolean alone is therefore not proof of payment; the transfer receipt and accounting changes must be checked too.

## Fault injection and limits

The [failure driver](../contract/examples/failure_driver.rs) is a separate Cargo example. It is **not linked into the production Wasm**, deployed to testnet, or included in the frontend.

- A sandbox contract account earns a real cancellation credit. Its driver deletes itself, then calls the library. The library's transfer to that now-missing named account fails. The unchanged production callback must restore its credit. The test recreates that account and retries.
- The balance test uses `sandbox_patch_state` to reduce only the sandbox library's liquid balance, then restores it.
- Duplicate callback tests temporarily install the driver on the sandbox library, preserve its existing storage, and schedule restoration of the original Wasm **before** invoking its callback. The callback has the correct self predecessor and one genuine successful/failed dependency receipt. The test checks the restored bytecode hash afterward. This is controlled fault injection, not an externally available attack on the keyless deployed library.

These tests add runtime evidence to the 14 core state-machine tests. They do not establish exhaustive gas/capacity safety, recovery from a callback that never executes, physical equipment condition, or mainnet readiness. Sandbox receipt hashes are local evidence and are not testnet explorer transactions.

## Browser evidence remains separate

The existing [Meteor dispute rehearsal](testnet/METEOR-POLISHED-REHEARSAL.md) proves booking #4, settlement proposal #6 and treasury proposal #7 through the polished public demo. The [public verifier](VERIFICATION.md) independently checks its eleven testnet transactions.

The [normal-return Meteor rehearsal](testnet/METEOR-NORMAL-RETURN-REHEARSAL.md) subsequently passed through the public demo: booking #5, zero-damage custodian acceptance, full bond withdrawal and two-vote DAO fee withdrawal (proposal #8). All eight final transactions and both exact transfers were independently verified through public RPC. The captured single-vote checkpoint confirms that the DAO fee remained unpaid before the second approval.
