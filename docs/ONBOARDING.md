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

The wallet and quote show a **Library access** card. Admission comes from fresh
library state; a council role or an approved proposal alone never grants it.
Non-members can prepare and copy a request containing their public account,
library and DAO IDs. This stays a local draft until the visitor shares it with
an organizer; CommonKit has no message delivery or admission-request backend.
No private keys or contact details are requested.

For a matching, unexpired admission proposal in the loaded proposal window,
the card shows the proposal ID and council vote count. Refresh access checks
the library again after execution. The council-process link opens the existing
membership form without submitting anything. Switching wallets from a quote
preserves its time and duration. A successful reservation filters to active
bookings and focuses the new booking's detail so the next actor is visible.

Meteor Web is the desktop browser choice in Meteor Connect. CommonKit reads
accounts from the wallet that completed sign-in, shows recovery instructions
while waiting, and leaves transaction approval separate. It never times out a
signature into an automatic retry or reports an unknown receipt as successful.
Read-only wallet refreshes use the connector's non-destructive lookup: a failed
account read blocks booking without clearing the saved wallet selection.

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

### 12 November 2026 wallet reliability recheck

- A real Meteor reservation created booking 12 on the Vercel demo. Its final
  receipt is saved separately from the completed return/dispute cases 10 and 11.
- A real council-wallet connection showed nonmember guidance and disabled
  borrowing. Copying the unsent request and opening the prefilled council form
  worked without submitting any proposal or changing membership.
- Reload and Refresh access preserved the council identity. Wallet lookup no
  longer clears the saved selection on a transient account-read failure, and
  duplicate accounts no longer produce a misleading selector.
- Isolated Chrome at 390 × 844 passed six responsive checks, including both
  previews and cancellation of the actual Meteor chooser with a retained quote.
  This was responsive UI testing, not a new phone-width signed reservation or
  a physical-phone wallet test.
- 85 JavaScript tests and the production artifact checks passed. Screenshots,
  the reservation receipt and detailed scope are in
  [the rehearsal record](testnet/onboarding-2026-11-12/README.md).
