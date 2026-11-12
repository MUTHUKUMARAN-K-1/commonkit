# Booking #13: mobile-width reservation proof

Recorded on 12 November 2026 at https://commonkit-testnet.vercel.app.

- [Expected claims](manifest.json): exact signed reservation and immutable booking terms.
- [Final execution receipt](reserve.json): saved historical evidence, not a fresh RPC result. Signatures and public-key fields are omitted; the execution graph is retained.
- [Review record](review.json) and [screenshot](mobile-review.jpg): 390 × 844 Chrome review and signature initiation.
- [Later confirmation](confirmation-ui.json): confirmed booking #13, observed at 1280 × 609.

The operator approved the real Meteor transaction. The browser viewport is
operator-captured evidence, not an on-chain attestation. No physical phone was
used and no uninterrupted phone-width wallet approval is claimed.

Reservation only: this does not prove pickup, return, refund or dispute settlement.
The completed normal and dispute flows are separate bookings #10 and #11.

Use /verify.html#mobile-proof for six fresh public checks, or run:

    npm run verify:testnet -- --flow mobile

The verifier checks the exact transaction and every child receipt, immutable
booking terms, and whole-library principal conservation at a fresh finalized
block. Later returns or cancellations do not invalidate the reservation.
Unavailable RPC results never fall back to saved evidence as a live pass.
