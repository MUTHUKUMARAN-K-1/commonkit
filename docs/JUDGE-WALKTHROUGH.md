# CommonKit: 60-second judge walkthrough

Open [the animated tour](https://commonkit-testnet.vercel.app/judge.html). It is an interactive illustrated web page, not a rendered video. Six chapters run for ten seconds each. Pause, seek or choose a chapter; reduced-motion preferences suppress transitions. The page pauses when hidden.

| Time | Show | Narration |
| --- | --- | --- |
| 0–10s | Camera and wallet roles | Campus clubs share equipment. CommonKit gives the borrower, custodian and community council clear responsibilities. |
| 10–20s | Attached-deposit split | The borrower reserves with a refundable bond. The contract records handover and return evidence; retained storage is shown separately. |
| 20–30s | Normal-return allocation | A clean return gives the borrower their full bond. The DAO receives the usage fee through a separately approved withdrawal. |
| 30–40s | Saved one-vote checkpoint | When damage is disputed, one council approval cannot release escrow. The policy requires both accounts. |
| 40–50s | Second vote and allocation | The second approval executes the damage decision. Settlement creates credits; separate transactions withdraw them. |
| 50–60s | Public verifier links | Judges can inspect both flows, receipts and accounting without our accounts. Open either proof to run fresh checks. |

The tour's timing is explanatory, not the speed of blockchain execution. Fresh RPC checks take additional time. No live pass count is claimed by the illustration.

## Evidence map

- Normal return: booking #10, treasury proposal #15, [8 transaction claims](../app/public/verification/vercel/normal/manifest.json), [21 browser checks](https://commonkit-testnet.vercel.app/verify.html?flow=normal).
- Dispute: booking #11, settlement proposal #16, treasury proposal #17, [11 transaction claims](../app/public/verification/vercel/dispute/manifest.json), [27 browser checks](https://commonkit-testnet.vercel.app/verify.html?flow=dispute).
- [One-vote checkpoint](../app/public/verification/vercel/dispute/single-vote.json): 0.011 principal remains escrowed, zero credits.
- [Settled checkpoint](../app/public/verification/vercel/dispute/settled.json): 0.007 borrower credit, 0.004 DAO credit.
- [Final historical checkpoint](../app/public/verification/vercel/dispute/final.json): withdrawals completed. Later demos can change aggregate library totals.

Both demo council accounts are operated by one person. Fixtures simulate evidence and do not establish physical condition. The tour now illustrates the [completed Vercel rehearsals](testnet/vercel/README.md): bookings #10/#11 on 9 November with operator-assisted Meteor approvals. Both actual payouts completed; the public browser and CLI recheck these same 19 transactions with 48 checks. Earlier #4/#5 manifests remain archived at their original paths. See [the longer wallet-recording script](DEMO-SCRIPT.md) for a human-reviewed video.
