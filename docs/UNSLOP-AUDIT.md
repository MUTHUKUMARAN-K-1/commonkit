# CommonKit focused polish audit

8 November 2026. Baseline: commit `4aafcd6`. Status: approved combined direction implemented, final desktop review completed and packaged for the authorized private-repository push. Vercel configuration and production output are validated; no deployment was performed.

Method: Unslop by Damir Sokolovsky ([@heydamir](https://x.com/heydamir)), [skill](https://github.com/heydamir/unslop/tree/main/skills/unslop), CC BY 4.0. This report applies its audit and direction framework.

## Assessment

Light slop: retain the cobalt/apricot palette, DM Sans and Instrument Serif brand typography, camera illustration, section order and existing Library/Bookings/Council architecture. The interface already has a product-specific visual and working real state. This is a targeted craft and readability pass.

Inspected the running production preview at `http://127.0.0.1:4326/`, including current Library, booking #9 and council proposals #13/#14, plus source breakpoint rules. The observed browser viewport was 736×590. Mobile findings below derive from source and the previous recorded mobile screenshots, not a fresh physical-phone test. Baseline screenshot: `docs/testnet/unslop/before-library.jpg`.

## Findings

- Spacing: `app/style.css` mixes 17/19/21/22/25/26px gaps/padding in cards, headings and mobile panels; align corresponding groups to a 4px rhythm.
- Color: cobalt-tinted notices, decorative labels, selections and panel surfaces compete with the primary action; make routine chrome neutral while preserving semantic pending/error states and the apricot equipment moment.
- Icons: search and mobile navigation use unrelated Unicode glyphs (`⌕`, `▦`, `▤`, `◉`), with different sizing; replace functional glyphs with one consistent 18px line-icon treatment and accessible labels.
- Copy: `app/ui.js` headlines such as “Good gear. Better together.” and “A fair decision. Made together.” are broad; name shared equipment, booking progress and council decisions directly.
- Copy: reservation confirmation asks “Ready to make it yours?” despite temporary borrowing; use “Review your booking” and retain the exact deposit/signing details.
- Type: `.eyebrow`, brand captions and proposal labels use uppercase tracking, often at 7–10px; mobile rules shrink several captions to 6–10px. Use sentence case, 12px metadata and 14px supporting text where space permits.
- Type: small wordmarks/labels use tight tracking and many components use 700 weight; simplify interface weights to 400/500 with limited 600. Preserve the chosen display family as brand typography, not italic emphasis on operational facts.
- Layout: a large repeated slogan/header precedes every operational view; reduce its vertical footprint within the existing section order so booking actions and votes appear earlier.
- Details: the trust card's decorative ring and repeated round arrows do not explain borrowing; remove unnecessary decoration and normalize control/card radii.
- Motion: `.asset:hover .asset-media img` scales the photo; remove the zoom. Vote progress animates `width` in both CSS and `animateVoteProgress`; use transform-based progress while preserving exact accessible vote values.
- UX state: the connected borrower header coexists with “Connect your wallet” in the loaded-library banner. Make the ready notice reflect the actual connection without changing wallet permissions or signing.
- UX state: settled booking copy explains credit allocation while the current credit is zero. Label historical allocation and current available credit explicitly; do not infer a booking-specific payout from a whole-library balance.

No fabricated social proof, gradient text, glowing background, autoplay loop or need for a new hero image was found. Keep the existing camera illustration and its illustrative label.

## Five-line direction

- Product: community equipment borrowing with recorded handovers and council-governed dispute settlement.
- Character: practical, warm, accountable.
- World: a campus equipment desk, paper checkout records and carefully maintained gear.
- Moments: the existing camera photograph; the real handover timeline and two-account approval state.
- Signature: a consistent numbered checkout trail connecting booking, handover, return and settlement to their receipts.

The user selected all three emphases: product-first, community-first and evidence-first. Equipment and the next action lead each view; approachable guidance supports the borrowing journey; wallet roles, exact amounts, votes and execution evidence remain easy to inspect. The existing palette, fonts, camera image and section order are retained.

## Proposed implementation and validation

Apply the nine passes in order: spacing, color, icons, copy, type, layout, details, visuals, motion. Keep palette, type families, real data, section order and features. Preserve Meteor integration, account authorization, transaction arguments/deposits, contract code, quorum, final-receipt verification and historical evidence.

After approval, implement in the production `app/` presentation layer, then check desktop and phone-width library, booking review, wallet-role dialog, booking detail and council cards. Confirm keyboard focus, reduced motion, long account IDs, disabled actions and pending states. Run existing JavaScript tests, Vercel build/production scan and wallet-free receipt verification. New signing is needed only if a substantive transaction-path change or unresolved behavior requires it; do not claim fresh signed cycles from read-only testing.

## Applied passes

1. **Spacing:** regularized page/card/control spacing around the 4px grid, with 20px phone cards, 24px desktop cards and smaller grouped gaps. Optical offsets and borders remain exceptions.
2. **Color:** retained cobalt, apricot and warm paper. Routine notices and supporting cards use neutral surfaces; primary actions, selection and real vote progress carry cobalt. Pending/error states keep their semantic colors.
3. **Icons:** replaced the mixed navigation/search/wallet glyphs with Lucide SVGs at 18px and 1.5 stroke. Decorative icons are hidden from assistive technology; buttons retain text or accessible names. Included the Lucide license.
4. **Copy:** named equipment, booking and council contexts directly. Replaced ownership-like reservation language with “Review your booking.” The loaded-state banner no longer asks an already connected borrower to connect. Historical allocations are explicitly separate from current available credit and payment receipts.
5. **Type:** retained DM Sans and the established Instrument Serif display treatment. Removed the 700-weight font asset, increased small labels to 12px and supporting copy to 13–14px, and changed operational labels to sentence case. Financial values remain exact and use tabular figures.
6. **Layout:** compact operational headings and library hero bring equipment/actions earlier. The phone header separates account name from role; voter details wrap within their cards. The original section order remains.
7. **Details:** quiet card surfaces, consistent corner sizes, visible focus rings and numbered journey markers. Dialog focus restoration now resolves the current trigger after periodic rendering replaces an equipment card.
8. **Visuals:** retained the existing illustrative camera photograph and its label. Removed decorative trust-card rings. No image was generated and no image prompt was written.
9. **Motion:** removed camera hover zoom, unified transition easing, and switched vote progress from width animation to `scaleX`. The meter still exposes the actual 0–2 vote count. Reduced-motion handling remains in place.

## Regression evidence

- 71 JavaScript tests passed after the final code changes.
- Vercel production build and scan passed: 36 output files; testnet configuration and evidence present; development signer excluded.
- Existing public normal/dispute proofs passed 48 fresh public-RPC checks. These verify historical signed receipts, not a new signing rehearsal.
- Source comparison confirms DAO policy validation, confirmation/signing functions, proposal/vote payloads, reservation review guards and all transaction form handlers remain byte-for-byte unchanged from the baseline.
- This pass introduces no contract changes or deployment. The four previous Meteor rehearsal manifests and their 38 signed transactions remain intact.

Screenshots and browser observations are saved under `docs/testnet/unslop/`. Phone-width checks use desktop Chrome, not a physical phone.

### Browser observations

- Desktop review at 1440×900: library, booking review, settled booking, council meters and wallet roles. No horizontal overflow. Exact reservation deposit remained 0.111 NEAR. Both observed approval meters exposed `aria-valuenow=2` and full progress.
- Final phone-width review at 390×844: library search/no-results/reset, reservation review without submitting, Escape focus restoration to `asset-campus-camera`, booking timeline, historical 0.007/0.004 NEAR settlement allocations, zero current credit with withdrawal disabled, and council cards. No horizontal overflow.
- At 375×812: council cards had no overflow; both meters were 2/2 with a fill-to-track width ratio of 1.
- The public verification page completed normal-return checks and DAO dispute checks in the phone-width browser. The saved `mobile-verification.jpg` shows 27 passed, zero mismatched and zero unverified for the dispute. The independent CLI run verified both flows (48 checks).
- Reduced motion was checked in the source: route/dialog/vote animation guards remain and CSS disables transitions. No emulated reduced-motion preference or physical-phone signing was exercised.
- Final desktop recheck at 1440×900 completed in the in-app browser after Chrome automation continued to time out, including after the user restored its window. The `final-desktop-*.jpg` screenshots show the final production build in a disconnected, read-only session; the earlier `desktop-*.jpg` screenshots retain the connected Chrome review. This recheck is not a new Meteor signing rehearsal.
- Final desktop observations: library loaded live equipment; reservation dialog showed the exact 0.111 NEAR deposit and correctly disabled review without an admitted wallet; Escape restored focus to `asset-campus-camera`. Booking #8 showed the normal return stages and historical 0.01/0.001 NEAR borrower/DAO allocations; booking #9 showed council review and historical 0.007/0.004 NEAR allocations. Both council meters exposed 2/2 and a fill-to-track ratio of 1. Library and council had no horizontal overflow (1425px document width in a 1440px viewport). No browser console errors were captured. The in-app viewport override was reset after review; the earlier Chrome override reset could not be verified.

### Push readiness

- Re-ran all 71 JavaScript tests and `npm run build:vercel` after the final desktop review build; both passed, including the 36-file production artifact scan.
- GitHub metadata confirms `MUTHUKUMARAN-K-1/commonkit` is private. The fetched `origin/main` matched the baseline before staging.
- Screenshots include only the application and public testnet state. Wallet credentials and local development keys are excluded.

The ready-state notice now describes browsing actions without implying the connected wallet is disconnected. The app still distinguishes proposal approval, verified settlement, historical allocation and actual withdrawal receipts; no new payment state is inferred from a zero current balance.
