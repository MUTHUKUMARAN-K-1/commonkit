# CommonKit: 60-second judge walkthrough

For a zero-RPC reading path, open [the two recorded outcomes](https://commonkit-testnet.vercel.app/recorded.html). The [75-second product film](https://commonkit-testnet.vercel.app/film.html) is a separate, downloadable attachment with dated product captures.

Open [the animated tour](https://commonkit-testnet.vercel.app/judge.html). It is an interactive illustrated web page, not a rendered video. Six chapters run for ten seconds each. Pause, seek or choose a chapter; reduced-motion preferences suppress transitions. The page pauses when hidden.

| Time | Show | Narration |
| --- | --- | --- |
| 0–10s | Camera and wallet roles | Campus clubs share equipment. CommonKit gives the borrower, custodian and community council clear responsibilities. |
| 10–20s | Mobile reservation #13 and deposit split | A 390 × 844 review led to a real Meteor reservation. Verify its receipt without a wallet. The next chapters follow separate completed bookings. |
| 20–30s | Normal-return allocation | A clean return gives the borrower their full bond. The DAO receives the usage fee through a separately approved withdrawal. |
| 30–40s | Saved one-vote checkpoint | When damage is disputed, one council approval cannot release escrow. The policy requires both accounts. |
| 40–50s | Second vote and allocation | The second approval executes the damage decision. Settlement creates credits; separate transactions withdraw them. |
| 50–60s | Public verifier links | Read both dated outcomes without a wallet or RPC. Then run fresh public checks; an unavailable provider stays UNVERIFIED. |

The tour's timing is explanatory, not the speed of blockchain execution. Fresh RPC checks take additional time. No live pass count is claimed by the illustration.

## Evidence map

- Mobile reservation: booking #13, [1 transaction claim](../app/public/verification/mobile/manifest.json), [6 fresh checks and saved screenshot](https://commonkit-testnet.vercel.app/verify.html#mobile-proof). Review and signature initiation used 390 × 844 Chrome emulation; later confirmation was observed at 1280 × 609. No physical phone or full return is claimed for this booking.

- Normal return: booking #10, treasury proposal #15, [8 transaction claims](../app/public/verification/vercel/normal/manifest.json), [21 browser checks](https://commonkit-testnet.vercel.app/verify.html?flow=normal).
- Dispute: booking #11, settlement proposal #16, treasury proposal #17, [11 transaction claims](../app/public/verification/vercel/dispute/manifest.json), [27 browser checks](https://commonkit-testnet.vercel.app/verify.html?flow=dispute).
- [One-vote checkpoint](../app/public/verification/vercel/dispute/single-vote.json): 0.011 principal remains escrowed, zero credits.
- [Settled checkpoint](../app/public/verification/vercel/dispute/settled.json): 0.007 borrower credit, 0.004 DAO credit.
- [Final historical checkpoint](../app/public/verification/vercel/dispute/final.json): withdrawals completed. Later demos can change aggregate library totals.

Both demo council accounts are operated by one person. Fixtures simulate evidence and do not establish physical condition. The tour now illustrates the [completed Vercel rehearsals](testnet/vercel/README.md): bookings #10/#11 on 9 November with operator-assisted Meteor approvals. Both actual payouts completed; the public browser and CLI recheck these same 19 transactions with 48 checks. Earlier #4/#5 manifests remain archived at their original paths. See [the longer wallet-recording script](DEMO-SCRIPT.md) for a human-reviewed video.

For a deeper look after the tour, open the [dispute case file](https://commonkit-testnet.vercel.app/verify.html?flow=dispute#case-file). Compare pickup, return, original damage and final decision evidence; then follow the two votes and actual withdrawals. File matching runs locally and does not prove physical condition.

The default CLI now checks all three proofs (54 checks): `npm run verify:testnet`. Select only the mobile reservation with `npm run verify:testnet -- --flow mobile`. The screenshot documents the browser session; RPC independently verifies the signed reservation, immutable booking terms and current ledger.
