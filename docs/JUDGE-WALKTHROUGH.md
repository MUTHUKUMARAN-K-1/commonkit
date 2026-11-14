# CommonKit: 60-second judge walkthrough

**Borrow the camera. If it comes back damaged, who gets the deposit? CommonKit lets the community decide—and lets anyone follow the payout.**

Use this presenter-led, wallet-free route through the existing [recorded outcomes](https://commonkit-testnet.vercel.app/recorded.html). It leads with booking #11's damage dispute and ends with booking #10's clean return. These are separate completed rehearsals, not two outcomes of one booking. No new signatures are needed. Pre-open the links so page loading does not consume the presentation.

| Time | Show | Narration |
| --- | --- | --- |
| 0–10s | [Disputed return #11](https://commonkit-testnet.vercel.app/recorded.html#dispute) | “The camera comes back damaged. Who gets the deposit? CommonKit lets the community decide—and lets anyone follow the payout.” |
| 10–20s | [One-vote checkpoint](https://commonkit-testnet.vercel.app/recorded.html#first-vote) | “The custodian reports damage but cannot take the bond. One council vote leaves 0.011 NEAR locked and no credits.” |
| 20–30s | Second-vote allocation in that same section | “The second account approves 0.003 for damage. That creates 0.007 borrower credit and 0.004 DAO credit, including the fee.” |
| 30–40s | Dispute withdrawal links and [case file](https://commonkit-testnet.vercel.app/verify.html?flow=dispute#case-file) | “Credits are not payments. Separate withdrawals paid both parties. Open these receipts to check the actual transfers.” |
| 40–50s | [Clean return #10](https://commonkit-testnet.vercel.app/recorded.html#normal) | “For comparison, this separate clean return paid the full 0.010 bond back and the 0.001 fee to the DAO.” |
| 50–60s | Recorded notice and fresh-check option | “Read the records without a wallet. These are testnet rehearsals: synthetic damage evidence, one operator controlling both council accounts.” |

Presentation timing is explanatory, not transaction execution speed. Fresh RPC checks take additional time and may be UNVERIFIED. Never wait silently for them or replace an unavailable result with a saved PASS. Use dated records for the presentation and let the judge run fresh checks afterward.

The existing [animated tour](https://commonkit-testnet.vercel.app/judge.html) remains a separate six-chapter illustration in its current order: roles, reserve, normal return, first vote, settlement and verification. Select chapters manually for the order above. It is not a newly recorded signing session. The [1:55 product film](https://commonkit-testnet.vercel.app/film.html) has an existing **0:50 · Real app** chapter; use that chapter for a shorter product introduction. The video and deployed tour have not been re-edited for this script.

## Two-minute follow-up

- Open the [damage case file](https://commonkit-testnet.vercel.app/verify.html?flow=dispute#case-file): compare the original report and final decision. A matching hash identifies a file; it does not establish that damage happened.
- Show the price split: 0.111 NEAR attached = 0.100 retained storage + 0.010 bond + 0.001 fee. Gas and DAO proposal bonds are separate. Do not describe the full charge as refundable.
- Offer [fresh dispute verification](https://commonkit-testnet.vercel.app/verify.html?flow=dispute) or the dependency-free public-read command `npm run verify:testnet -- --flow dispute` after cloning with Node.js 24.
- Use the [judge Q&A](JUDGE-QA.md) for trust, wallet access, storage economics and validation questions. The [first-visit test](INDEPENDENT-TEST.md) remains pending until a real participant supplies results.

## Payment links to keep ready

These transactions contain the payment execution; inspect their connected transfer receipts, not just the outer success status. Withdrawals consume the account's available credit, not a booking-specific credit bucket. Booking allocation is checked separately.

| Proof | Public transaction |
| --- | --- |
| Dispute borrower: 0.007 NEAR | [Borrower withdrawal](https://testnet.nearblocks.io/txns/73dGx8M9mYaXdWKmLpjYHe65v371tZL4VC8LFedGai57) |
| Dispute DAO: 0.004 NEAR | [Treasury #17 final vote and payment execution](https://testnet.nearblocks.io/txns/AcaSqQEvD5DuXP3N4EDLjLzwVum7ndcfD13ty8zL5jgQ) |
| Normal borrower: 0.010 NEAR | [Full-bond withdrawal](https://testnet.nearblocks.io/txns/5UPDMqhf7P6xq8VQuFuMWJnsBXjG3xVJ7xSAxn2HmMdM) |
| Normal DAO: 0.001 NEAR | [Treasury #15 final vote and payment execution](https://testnet.nearblocks.io/txns/CueE8VvF96x6JNnNRHfL2yiHBKfJ2ASSQguLDUAq7gNo) |

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
