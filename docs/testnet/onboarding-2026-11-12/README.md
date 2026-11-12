# Onboarding and wallet reliability rehearsal — 12 November 2026

Public site: https://commonkit-testnet.vercel.app

## Confirmed desktop result

Meteor signed a fresh camera reservation from
`borrower.commonkit-mw7dph80.testnet` to
`library.ckdao-mw7e25at.testnet`.

- Booking: **12**
- Pickup: **12 November 2026, 19:15 IST**, for one hour
- Attached deposit: **0.111 testnet NEAR**
- Escrow principal: **0.011 NEAR** (0.001 usage fee + 0.010 bond)
- Nonrefundable storage: **0.100 NEAR**
- Transaction: [`EA4yVAjuksjPKKd5d14HRAFAAFvyNebrBX4NKePbTqfp`](https://testnet.nearblocks.io/txns/EA4yVAjuksjPKKd5d14HRAFAAFvyNebrBX4NKePbTqfp)
- Raw final execution result: [desktop-reserve.json](desktop-reserve.json)

The final receipt was checked independently against the signer, receiver,
method, arguments, attached deposit and successful booking ID. The observed
state was `Reserved`; this is a fresh onboarding reservation, not another
completed return or dispute proof. The published completed cases remain
bookings 10 and 11.

Desktop checks also confirmed that both outcome previews work without a
wallet and that cancelling Meteor Connect restores the selected quote,
including its pickup time and two-hour duration. Connection is separate from
booking approval. Meteor popup clicks required the operator because browser
automation timed out; CommonKit itself remained interactive.

## Responsive Chrome results

An isolated Chrome window controlled by Playwright measured **390 × 844**.
All six checks passed: viewport and document overflow, wallet-free normal
preview, wallet-free dispute preview, deposit and membership gating, real
Meteor chooser cancellation with preserved quote, and no uncaught page errors.
See [responsive-report.json](responsive-report.json) and the `mobile-*.png`
screenshots. No wallet account was connected and no transaction was signed
in that isolated browser.

## Real Meteor nonmember result

`commonkit-mw7dph80.testnet` connected through Meteor. The quote preserved
20:30 IST and its two-hour window, showed **Not admitted to borrow**, and
disabled Review booking. Council authority did not grant borrowing membership.
The request draft copied successfully with the public account, library and
DAO IDs, and explicitly said nothing was sent. View council process opened
the membership form with that account prefilled; no proposal was submitted
and the DAO still showed 18 recent proposals, none awaiting a decision.
See [nonmember-check.json](nonmember-check.json) and the desktop nonmember
screenshots. The same council identity and nonmember status survived reloading
the latest deployment and Refresh access. The duplicate account selector was
hidden for a single distinct account.

Meteor popup controls timed out. Selecting the council account in Meteor's
regular wallet tab worked, followed by the operator clicking Connect in the
popup. Earlier connection attempts returned the borrower, so those attempts
were not counted as nonmember evidence.

## Scope and limitations

An initial automated 390 × 844 viewport request left the controlled Chrome
page measuring 1280 × 609. The isolated Playwright run above resolved the
responsive UI check; only its `mobile-*.png` screenshots are mobile evidence.
No new transaction was signed at phone width and no physical phone was tested.
Booking 12 is the real desktop signing proof. The new successful-booking focus
behavior was deployed, but not exercised with another signed reservation.

Latest release: https://commonkit-testnet-2slzx9syx-muthukumaran-k-1s-projects.vercel.app
Public alias: https://commonkit-testnet.vercel.app

The regression suite passes 85 tests, including duplicate wallet accounts,
stale membership, pending
admission, account mismatch, cancellation and recovery from transient wallet
lookup failure. The production artifact check excludes the development signer.
