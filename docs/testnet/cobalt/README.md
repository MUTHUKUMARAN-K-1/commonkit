# Cobalt / apricot live app validation

This directory records the new real-app integration and Meteor rehearsals. It is separate from the earlier booking #4 dispute and booking #5 normal-return evidence.

## Scope

The user selected desktop and responsive Chrome testing for this pass. Phone-width runs use desktop Chrome with a viewport override. They do not establish physical Android/iPhone wallet compatibility.

All signing uses the existing Meteor Web testnet accounts. Evidence files are synthetic fixtures from `app/public/evidence/`; the file remains local and only its SHA-256 digest goes on-chain. Both council accounts are controlled by the demo operator.

## Baseline

- 66 JavaScript tests passed before implementation.
- Vercel build and production artifact scan passed before implementation.
- Both existing proof manifests passed 48 fresh public RPC checks before implementation.
- New rehearsal starts at booking #6 and proposal #9, with 55,000 microNEAR deposited and withdrawn; zero active escrow, credit and pending transfers.
- Borrower funded with 1 testnet NEAR through Meteor for the new rehearsals. Public final transaction: `HJa5Uw3HoHMEkWXhVvHvDTJmDHcf8gLiUKpoWrn1ZCig`; details in `testnet-topup.json`.

## Read-only capture

`scripts/capture-ui-rehearsal.mjs` accepts a run (`desktop-normal`, `desktop-dispute`, `mobile-normal`, `mobile-dispute`) and a checkpoint (`baseline`, `reserved`, `single-vote`, `settled`, `treasury-single-vote`, `final`). It never signs transactions.

Each run records its own baseline and asserts there was no concurrent new booking. Intermediate snapshots are explicitly historical. A final run requires a manually captured `receipts.json` list in the manifest's step order, containing `id`, `hash` and `signerId` for each transaction. It verifies final receipt graphs, payloads, named signers, separate council approvals, principal payments and bound callbacks through the shared verification engine. Signatures/key fields are removed from stored execution graphs.

Example:

```powershell
node scripts/capture-ui-rehearsal.mjs desktop-normal baseline
node scripts/capture-ui-rehearsal.mjs desktop-normal final
```

Run completion is established only by a `final.json` with a passing verification report. A baseline or screenshot is not proof of completed borrowing.

## Integration status

The cobalt/apricot interface is implemented in `app/`, including live Library, Bookings and Council views, booking review, wallet role details, transaction progress and separate decision evidence. Motion mini, NumberFlow and self-hosted fonts are bundled; provenance is in `docs/UI-COMPONENTS.md`.

- 71 JavaScript tests pass after integration.
- `npm run build:vercel` passes; the production scan checks 37 files and excludes the development signer.
- Independent visual review passed at 1440×900, 768×1024, 390×844 and 375×812. No horizontal overflow was observed. The evaluator used a separate session with the same provider because no different-provider model was available.
- Browser checks covered library filtering, equipment/booking dialogs, keyboard navigation, booking timelines, council cards, the dedicated decision-evidence form and the public verifier. The verifier passed 21 normal-return and 27 dispute checks against the existing historical cases.
- A second targeted review passed: out-of-filter selection notice, manual refresh focus restoration, same-booking evidence persistence and evidence clearing when switching bookings. Evidence identity also includes the contract account to prevent reuse across libraries with the same booking number.
- Screenshots: `desktop-library.jpg`, `desktop-booking-drawer.jpg`, `desktop-booking-progress.jpg`, `desktop-council.jpg`, `mobile-library.jpg`, `mobile-booking-sheet.jpg`, `mobile-dispute-progress.jpg`, `mobile-council.jpg`, `mobile-verification.jpg`, and `tablet-bookings.jpg`.
- The browser console included opaque `Object` error entries and extension warnings. No visible app failure accompanied them; the opaque entries could not be attributed confidently from the available log detail.
- Desktop normal return completed through Meteor: booking #6, treasury proposal #9, eight receipts, and 21/21 final verification checks. Final ledger: 66,000 microNEAR deposited and withdrawn, zero escrow/credits/pending. See `desktop-normal/final.json`, `manifest.json`, `transactions.json` and `receipts.json`.
- All four fresh Meteor rehearsals completed on 8 November 2026. See the results below. The public verifier still selects historical booking #4 (dispute) and #5 (normal return), not these new rehearsals.
- This integration and its receipt evidence are prepared for the private repository. Deployment remains pending. The local production preview is at `http://127.0.0.1:4326/` while its preview process runs.

## Completed Meteor rehearsals

| Run | Booking | Settlement / treasury proposal | Final transactions | Receipt checks |
| --- | --- | --- | --- | --- |
| [Desktop normal return](desktop-normal/final.json) | #6 | — / #9 | 8 | 21 passed |
| [Desktop dispute](desktop-dispute/final.json) | #7 | #10 / #11 | 11 | 27 passed |
| [Responsive normal return](mobile-normal/final.json) | #8 | — / #12 | 8 | 21 passed |
| [Responsive dispute](mobile-dispute/final.json) | #9 | #13 / #14 | 11 | 27 passed |

**38 successful transactions; 96 passed receipt checks; zero failed or unverified checks.** Each linked run directory includes `receipts.json`, `manifest.json`, sanitized `transactions.json`, intermediate snapshots and screenshots. These are new testnet transactions signed through Meteor Web from the local production preview, not a deployed-origin rehearsal. Desktop signing was observed at 1280×609; responsive runs used a verified 390×844 DOM viewport in desktop Chrome. The earlier independent visual review covered additional sizes.

Both normal returns allocated the full 10,000 microNEAR bond to the borrower and the 1,000 microNEAR fee to the DAO. Both disputes preserved 11,000 microNEAR in escrow after the first settlement vote. The second distinct council vote automatically executed the decision, allocating 7,000 microNEAR to the borrower and 4,000 to the DAO. Separate two-vote treasury proposals and borrower withdrawals completed all payouts. Verification checks the transfer receipts and bound callbacks, not only proposal status.

The final whole-library ledger at booking #9 completion records **99,000 microNEAR deposited = 99,000 withdrawn**, with zero escrow, available credits and pending transfers. Storage deposits and gas are outside this principal ledger. A fresh `npm run verify:testnet` also passed all 48 checks for the existing public historical cases during this session.

### Wallet recovery observations

- Meteor returned `near_rpc_error` on the responsive normal-return run's first treasury vote attempt. No transaction hash was returned. Before retrying, public RPC showed proposal #12 still had no votes and wallet history still ended at its proposal creation. Closing the failed wallet window released the app's pending state; refreshing and retrying succeeded. See [recovery evidence](mobile-normal/rpc-recovery.json) and `meteor-rpc-error.jpg`. No duplicate vote was submitted blindly.
- A desktop dispute withdrawal popup needed a private wallet unlock. After the user unlocked/approved it, the final receipt and payment callback were verified.
- The wallet unlock-screen screenshot is excluded from Git; it is not transaction evidence. All final transaction receipts and verification reports are included.
- Bringing newly opened Meteor windows to the foreground resolved browser automation stalls. The mobile viewport reset API was called at the end, but the existing tab still reported 390×844 after reload; it was left open with the completed council state.

Physical-phone wallet signing and a fresh rehearsal on a deployed cobalt/apricot origin remain separate checks. The public proof page's existing historical cases were preserved.
