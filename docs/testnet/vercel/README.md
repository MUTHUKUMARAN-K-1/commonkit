# Vercel-origin Meteor rehearsals

Production origin: https://commonkit-testnet.vercel.app. See [deployment metadata](deployment.json) for the exact release used. GitHub remains private.

These are fresh Chrome / Meteor Web testnet transactions from the Vercel origin, completed on **9 November 2026**. The operator assisted with Meteor Connect/Approve prompts because popup input automation stalled. The app prepared transactions, and public RPC verified final results. Neither the development signer nor operator CLI signing scripts were used.

## Completed flows

| Run | Booking | Settlement / treasury proposal | Transactions | Receipt checks | Actual payouts |
| --- | --- | --- | --- | --- | --- |
| [Normal return](desktop-normal/final.json) | #10 | — / #15 | 8 | 21 passed | 0.010 NEAR borrower; 0.001 NEAR DAO |
| [DAO dispute](desktop-dispute/final.json) | #11 | #16 / #17 | 11 | 27 passed | 0.007 NEAR borrower; 0.004 NEAR DAO |

**19 finalized transactions; 48 passed checks; zero failed or unverified checks.** The final whole-library ledger records **121,000 microNEAR deposited = 121,000 withdrawn**, with zero escrow, available credits and pending transfers. Storage deposits, gas and DAO proposal bonds are separate from this principal ledger.

- [Normal receipts](desktop-normal/receipts.json), [manifest](desktop-normal/manifest.json), [sanitized execution graphs](desktop-normal/transactions.json) and [settlement checkpoint](desktop-normal/settled.json).
- [Dispute receipts](desktop-dispute/receipts.json), [manifest](desktop-dispute/manifest.json), [sanitized execution graphs](desktop-dispute/transactions.json) and [settlement checkpoint](desktop-dispute/settled.json).
- [Dispute first-vote checkpoint](desktop-dispute/single-vote.json): booking #11 remained disputed, all 11,000 microNEAR stayed escrowed, zero credits, and proposal #16 was still in progress. The second distinct account approval closed the booking with 3,000 microNEAR damage and the recorded decision hash.
- Separate treasury first-vote checkpoints for [normal](desktop-normal/treasury-single-vote.json) and [dispute](desktop-dispute/treasury-single-vote.json) confirm that one vote did not withdraw DAO credit. Both final verifications check actual transfer receipts and bound callbacks, not just proposal status.
- [Historical public verification](historical-public-verification.json): 48 checks for the earlier public proof cases. This is separate from the new signed cycles; the public verifier and judge tour continue to select bookings #4/#5.

Screenshots: [normal journey](desktop-normal/final-journey.png), [normal allocation](desktop-normal/final-allocation.png), [dispute journey](desktop-dispute/final-journey.png), [dispute one vote](desktop-dispute/single-vote.png), [settled council](desktop-dispute/settled-council.png), [DAO payout](desktop-dispute/treasury-executed.png) and [final ledger](desktop-dispute/final-browser.png). Final normal screenshots were taken after both cycles, so aggregate balances can include booking #11; the normal `final.json` preserves its own completion checkpoint.

Each run stores its own exact synthetic fixtures in `evidence/`. The normal run reuses `docs/testnet/normal-pickup.txt` and `normal-return.txt`; fixture hashes describe simulated evidence, not a physical handover. Both council accounts remain controlled by one operator. This is desktop Chrome, not physical-phone validation.

## Read-only capture commands

These are the commands used during the rehearsal, at the matching chain state:

```sh
node scripts/capture-ui-rehearsal.mjs desktop-normal settled vercel
node scripts/capture-ui-rehearsal.mjs desktop-normal final vercel
node scripts/capture-ui-rehearsal.mjs desktop-dispute final vercel
```

The `vercel` suite writes into this directory and preserves the earlier cobalt receipts. A final capture requires the complete ordered receipt list, checks each expected call and signer, verifies child receipt outcomes and both principal transfers, and requires zero remaining escrow, credit or pending transfers. A checkpoint is not proof that the whole flow completed.

Checkpoint capture commands assert the state at that moment; do not rerun `settled` after withdrawals or replay the normal final capture after another booking and expect the original isolated-run assertions to pass. The saved manifests and transaction graphs preserve the completed cases. Receipt rows follow each verifier template's order; the actual normal-run DAO withdrawal happened before the borrower withdrawal.

## Rehearsal observations

- Chrome/Meteor popup clicks and screenshots intermittently timed out, especially when the Chrome window was minimized. The owner explicitly took over wallet Connect/Approve clicks; application actions and receipt checks remained automated. No CLI signing fallback was used.
- Starting the second reservation retained the earlier form date; it was manually changed to a future pickup before review. Existing validation prevented a stale start time from being submitted.
- The first dispute final-capture attempt rejected the manually assembled receipt-list order. Reordering it to the existing template passed all 27 checks. No transaction or verification assertion was changed to bypass that check.
- Screenshot capture does not establish transaction finality; the final JSON reports and sanitized receipt graphs do.
