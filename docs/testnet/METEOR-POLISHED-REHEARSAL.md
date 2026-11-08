# Polished public demo: Meteor rehearsal

Completed 8 November 2026 on public frontend version 2 at https://commonkit-testnet.muthukumarank.chatgpt.site. All writes were approved through Meteor Web in Chrome. RPC was used only for independent read verification. No private keys or local development signer were used for this run.

## Verified flow

Booking **#4**: reserve (0.111 testnet NEAR including retained storage), pickup, request return, custodian dispute, settlement proposal **#6**, council two's first vote, council one's second vote, treasury withdrawal proposal **#7**, both treasury votes, and borrower withdrawal. Eleven new transactions executed successfully. Each final transaction and its child receipts was independently checked for finality, signer, receiver, method and failure status by `scripts/capture-meteor-polished.mjs final`.

| Checkpoint | Booking / proposal | Principal escrow | Available credit |
| --- | --- | --- | --- |
| First settlement vote | Disputed / InProgress, 1 vote | 0.011 NEAR | 0 |
| Second settlement vote | Closed / Approved, 2 votes | 0 | Borrower 0.007 + DAO 0.004 NEAR |
| First treasury vote | Treasury proposal still pending | 0 | DAO still 0.004 NEAR |
| Final withdrawals | Both proposals Approved | 0 | 0 |

Final cumulative principal ledger: **0.044 NEAR deposited, 0.044 NEAR withdrawn, zero escrow, credits and pending transfers, balanced**. Storage, gas and proposal bonds are outside this principal ledger.

Connected wallet roles matched borrower, custodian plus council voter, and council-only accounts. Booking #4 remained selected across account changes. The pickup button became available when its time window opened. The first voter could not vote again through the UI. Historical allocations remained visible after withdrawal without being described as current credits.

## Wallet recovery observations

Meteor popups and their overlays can appear after a delay. During pickup, an unsigned request was cancelled while recovering from a delayed wallet prompt; an extra unsigned popup was discarded. Only one pickup transaction executed. The remaining connections and signatures completed normally. An initially suspected lingering connection overlay was not established as a persistent application defect; no speculative signing or contract changes were made.

For a live demo, after clicking once, wait for the wallet request and inspect the existing Meteor window. Do not infer failure solely from the page behind the overlay or click the action repeatedly. If cancelling, cancel the unsigned request in Meteor and confirm its state before retrying. If a hash exists, use its final receipt and contract state before any retry.

## Evidence

- `meteor-polished-receipts.txt`: the eleven new transaction hashes.
- `meteor-polished-single-vote.json`: RPC assertions before the second settlement vote.
- `meteor-polished-settled.json`: exact borrower and DAO credits after settlement.
- `meteor-polished-final.json`: final ledger, proposals and eleven independently verified receipts.
- `meteor-polished-single-vote.jpg`, `meteor-polished-settled.jpg`, `meteor-polished-final.jpg`: browser evidence.

This run followed the disputed return path. It does not claim another normal-return acceptance test. Evidence hashes are synthetic rehearsal fixtures, and both council accounts are controlled by the demo operator.
