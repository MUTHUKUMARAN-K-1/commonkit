# Verify CommonKit without a wallet

Open [the public verification page](https://commonkit-testnet.muthukumarank.chatgpt.site/verify.html). It runs 27 read-only checks from your browser and provides an expandable explanation, receipt links and a downloadable JSON report. No login, wallet connection, private key or signing server is used.

From a clone, with Node.js 24 (dependency installation is unnecessary for this command):

```sh
npm run verify:testnet
npm run --silent verify:testnet -- --json > verification-report.json
```

Exit codes: **0** means all 27 checks pass; **1** means at least one mismatch; **2** means evidence is unavailable or verification could not complete. An RPC outage, timeout, pruned transaction, malformed response or non-final execution never becomes a pass. The transport uses FastNEAR testnet with NEAR public RPC as a fallback, records endpoint usage in JSON, limits each request to 12 seconds, and only permits read methods. Live RPC verification is not required by CI; CI runs deterministic failure tests instead.

## What is checked

The [public manifest](../app/public/verification/manifest.json) records expected claims for booking **#4**, settlement proposal **#6**, treasury proposal **#7**, and the eleven transactions captured in the 8 November Meteor rehearsal. It contains expected IDs, payloads, hashes and amounts, not saved pass results. Changing it changes the claims being checked and must be reviewed as such.

| Checks | Evidence |
| --- | --- |
| 3 manifest/network/block checks | Eleven distinct transaction claims; RPC identifies testnet and is not syncing; a recent finalized block anchors current state reads |
| 8 deployment/governance/accounting checks | Pinned library code hash; no library access keys; expected DAO authority; current two-of-two council without another approval role; closed booking and exact evidence/damage fields; both proposals' exact target/actions and two named approvals; independently recomputed whole-library accounting |
| 11 transaction checks | Exact hash, signer, receiver, single method, decoded arguments, deposit and return value; initial contract receipt binding; FINAL status; complete connected receipt graph with no failed child outcomes |
| 5 execution/payment checks | First settlement vote made no `resolve` call; second vote executed the exact DAO-to-library decision; first treasury vote made no `withdraw` call; actual library-to-DAO and library-to-borrower transfers and their bound successful callbacks |

The payment checks require **0.004 NEAR to the DAO** and **0.007 NEAR to the borrower**, originating from the library. System gas refunds cannot satisfy them. A successful outer DAO vote is insufficient: its library execution and the eventual payment receipts must also succeed.

Current views use the **same finalized block hash and height**, including the library state and ledger. The verifier recomputes principal deposits from all booking records, escrow from active bookings, credits and pending amounts from their maps, then checks conservation and agreement with the contract ledger. It does not require today's ledger to equal the historical 0.044 NEAR/zero-escrow snapshot; later valid bookings may add funds or credits.

## Boundaries of the evidence

- This is verification against public RPC, not a light-client proof, an audit, or a guarantee that the RPC provider is honest.
- The pinned code hash identifies the recorded deployment. The verifier does not rebuild Rust or assert a source-to-Wasm reproducible-build proof.
- The first-vote transaction check proves that transaction did not execute `resolve`. Intermediate escrow/credit snapshots are explicitly labeled **historical**; the verifier does not turn them into live historical-state queries or pass badges.
- The deployment's current policy is checked separately from recorded votes. It is not a reconstruction of every past DAO policy change.
- Both demo council accounts are controlled by one operator. Two account signatures are not independent human governance.
- Synthetic evidence hashes cannot prove physical handover, condition or damage. The transaction arguments preserve the original damage report hash; the closed booking's `dispute_hash` stores the final decision hash after resolution.
- Withdrawals consume an account's available credit rather than a specific booking. These checks establish the exact recorded transfers and their callbacks, with booking allocation separately checked.
- A later unrelated transaction or every future booking is outside this eleven-transaction rehearsal. Current aggregate state is checked, but the verifier is not an exhaustive replay of all contract history.

## Source and tests

Browser and Node use the identical [engine](../app/public/verification/engine.js) and [read-only transport](../app/public/verification/rpc.js). The browser contains no wallet imports. The original transaction-signing page remains separate.

`npm test` includes 37 verification tests: the genuine recorded RPC fixture, 32 altered-data cases, later valid borrowing, RPC outage, pruned history and transport restrictions/fallback. Cases include wrong votes/receivers/deposits, unsafe integers, disconnected or missing receipts, hidden child failures, false callbacks and gas refunds substituted for principal. The [fixture](../scripts/fixtures/verification-rpc.json) was read from public testnet on 8 November 2026 at block 276747851. Signatures, public keys, gas profiles and node host metadata were removed. Tests replace only the fixture's block timestamp with the test clock; they do not claim to be fresh network checks.

Validation during implementation: 27/27 live checks passed in both Node and a browser; all 52 JavaScript tests passed; production build checks passed. Browser checks covered desktop, 375px mobile without overflow, report download, and an RPC outage after a successful run: old green results and the old ledger were cleared. See [verification validation](testnet/public-verification-validation.json).

RPC references: [NEAR transaction status and finality](https://docs.near.org/api/rpc/transactions), [read-only account and contract queries](https://docs.near.org/api/rpc/contracts).
