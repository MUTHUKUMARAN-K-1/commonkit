# Meteor booking from mobile-width CommonKit — 12 November 2026

Booking **13** was submitted from the public Vercel demo after reviewing the
reservation at **390 × 844** in Chrome device emulation. The operator completed
the real Meteor approval. Independent public RPC verification passed all eight
checks recorded in [verification.json](verification.json).

- Demo: https://commonkit-testnet.vercel.app
- Transaction: [3auV5rdBF2ykhfLpBcbsXz877Xhnnz15AFEVR6GRAuy5](https://testnet.nearblocks.io/txns/3auV5rdBF2ykhfLpBcbsXz877Xhnnz15AFEVR6GRAuy5)
- Borrower: `borrower.commonkit-mw7dph80.testnet`
- Contract: `library.ckdao-mw7e25at.testnet`
- Equipment: `campus-camera`
- Window: **12 November 2026, 8:30–9:30 PM IST**
- Attached deposit: **0.111 testnet NEAR**, plus network gas
- Principal: **0.001 NEAR usage fee + 0.010 NEAR refundable bond**
- Retained nonrefundable storage: **0.100 NEAR**
- Verified booking state: **Reserved**

## Evidence

[review.json](review.json) records the public origin, borrower, quote and
390 × 844 viewport with no horizontal document overflow.
[mobile-review.jpg](mobile-review.jpg) captures the review before requesting
the signature. The other `mobile-*.jpg` files record the library, connection,
quote and Meteor handoff.

[reserve.json](reserve.json) contains the raw final transaction result.
The verifier checked the exact hash, signer, receiver, method, arguments and
deposit, successful child outcomes, and the booking ID returned by the contract.
[before.json](before.json) and [after.json](after.json) record final public chain
reads with block references and RPC request provenance. Exactly one booking was
added; principal deposited and escrow both increased by 0.011 NEAR. The ledger
remained balanced.

[confirmation-ui.json](confirmation-ui.json) confirms the UI selected booking
13, filtered to active bookings, focused `detail-title`, and displayed final
transaction confirmation. At that later observation the browser had returned
to **1280 × 609**. This evidence therefore proves a mobile-width review and
signature initiation followed by real Meteor execution; it does not claim that
the approval popup or final confirmation stayed at phone width. No physical
phone was used. Browser control was stopped before a final mobile screenshot.

This is a reservation proof, not a completed return or dispute settlement.
The completed public proof cases remain bookings 10 and 11. No mainnet funds,
private keys or seed phrases are included.

## Public judge proof

Booking #13 now has a [wallet-free verification section](https://commonkit-testnet.vercel.app/verify.html#mobile-proof)
and appears in the reservation and verification chapters of the
[60-second tour](https://commonkit-testnet.vercel.app/judge.html).

The shared browser/CLI verifier runs six fresh checks. The eight checks in the
original capture report additionally used before/after snapshots from the live
rehearsal; they are not the live public verifier's check count. Browser viewport
records remain explicitly off-chain evidence. The public receipt copy omits
signature and public-key fields while retaining the complete execution graph.

Use `npm run verify:testnet -- --flow mobile` for this proof alone. The default
command also checks both completed flows: 54 checks in total. Publication
validation and screenshots are in [public-pages](public-pages/README.md).
