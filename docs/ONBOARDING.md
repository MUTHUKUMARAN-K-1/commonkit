# Explore before connecting

The library's **Start here** guide introduces CommonKit without asking for a
wallet. Visitors can learn the borrower, custodian and council roles, compare
normal and disputed returns, and open the recorded case files or animated judge
tour. These explanations are previews; the public verifier separately checks
fresh testnet receipts.

## Visitor path

1. Open the library and read the short orientation.
2. Compare **Normal return** and **DAO dispute**. Acceptance or settlement creates
   credit; separate withdrawals transfer funds. A dispute requires both council
   accounts, and the DAO's treasury withdrawal requires its own approvals.
3. Open either case file to inspect booking #10 or #11. No account or signature
   is required. The evidence is synthetic and both demo council accounts belong
   to one operator.
4. Browse equipment and inspect the current fee, refundable bond and retained
   storage before deciding whether to connect.

## Borrowing path

Connect Meteor deliberately from the wallet controls or reservation quote. Use
your own NEAR testnet account with testnet funds for the deposit and network gas.
Connecting does not admit a member: the library's council must approve membership
before that account can borrow. A custodian cannot borrow their own equipment.

Connection is separate from reservation. The existing review step and wallet
signature remain required, with fresh state, account, equipment and cost checks
before sending. Onboarding never signs, submits a reservation or changes roles.

Cancelling or failing a connection from the quote restores that quote with its
selected time and duration, provided the visitor has not changed equipment,
library or view. It never submits a booking automatically.

The introduction can be reopened after dismissal. Its preference is separate
from wallet state; browser storage failures must not prevent exploring the app.

## Release checks

Check the disconnected introduction, both outcome previews and proof links,
dismiss/reopen, keyboard focus, route changes, and the reservation connection
entry at desktop and phone widths. Keep recorded receipt verification distinct
from a new signed wallet rehearsal. Run the existing JavaScript regression suite
and production artifact checks before deployment.

### 11 November 2026 recheck

- Public desktop visitor path: outcome previews and the disconnected equipment
  quote were inspected. A quote explains the 0.111 testnet NEAR total, including
  retained storage, and keeps booking disabled until a member connects.
- A 390 × 844 isolated browser viewport had no horizontal document overflow.
  Mobile quote cancellation and a fresh signed booking remain pending; this is
  responsive browser testing, not a physical-phone wallet test.
- Connection cancellation now restores the quote. Its live cancellation recheck
  remains pending because browser automation lost its session.
- The recorded booking #10 and #11 verification passed all 48 live checks on
  11 November. Recent RPC nodes could no longer serve their old receipts, so the
  verifier now requests historical transactions from NEAR's documented
  [testnet archival endpoint](https://docs.near.org/api/rpc/providers) first,
  retaining the original providers as fallback. Current-state reads stay on
  recent nodes. Reports still identify the provider for every request; an outage
  remains unverified, never a cached pass.
- 80 JavaScript tests and the production artifact checks passed. No new booking
  was submitted in this recheck; historical proof is distinct from a fresh
  Meteor rehearsal.
