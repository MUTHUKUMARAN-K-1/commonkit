# CommonKit UI integration plan

Prepared 8 November 2026. Status: production UI implemented; independent visual review and four fresh Meteor rehearsals completed (desktop and responsive Chrome, normal return and dispute). All 38 transactions and 96 receipt checks passed. See `docs/testnet/cobalt/README.md` for evidence and the separate physical-phone/deployed-origin checks.

## Direction

Keep the approved preview's equipment photography, editorial headings, generous spacing, booking journey and mobile bottom navigation. Replace its green palette with cobalt, warm ivory, midnight ink and apricot. The product should feel welcoming for a borrower and precise enough for a council member reviewing a settlement.

| Token | Proposed color | Use |
| --- | --- | --- |
| Canvas | `#F7F5F0` | Warm ivory background |
| Surface | `#FFFFFF` | Forms, inventory and booking cards |
| Ink | `#202238` | Body text and dark council/funds cards |
| Primary | `#3D4DDB` | Main action, active navigation, focus |
| Primary soft | `#E9ECFF` | Selected state and informational surfaces |
| Accent | `#F4B49B` | Apricot artwork accents and small decorative areas |
| Secondary text | `#626577` | Supporting explanations |
| Pending | `#8A4B13` on `#FFF1D6` | Awaiting signature/vote/check |
| Error | `#B42318` on `#FEECE9` | Rejection and failed execution |

Confirmed states use an explicit check icon and label with cobalt/ink. Color alone never communicates status. Validate actual foreground/background combinations before implementation is accepted. Retain DM Sans with Instrument Serif for selected headings; use tabular numerals for amounts and monospace for account IDs. Self-host licensed font assets where practical.

## Research and component selections

Browser research covered Designeer's resource catalogue, 21st.dev's Motion Primitives catalogue and interactive Transition Panel, Uniswap's disconnected action interface, Safe's account entry interface, and Snapshot's public Aave proposal list and completed proposal details. Supporting primary documentation and component source listings were reviewed. This was a focused review of relevant surfaces, not an audit of every page in these products.

| Selection | Source | CommonKit use | Integration |
| --- | --- | --- | --- |
| Animated Tabs / segmented selection | https://21st.dev/@ibelick/components/animated-tabs | Navigation and booking/proposal filters | Adapt the MIT component's selected-indicator pattern into a local vanilla component; implement keyboard semantics explicitly |
| Transition Panel | https://21st.dev/@ibelick/components/transition-panel | Reservation details → cost review → wallet progress | Adapt its directional, height-aware transition; preserve form state and focus |
| Morphing Dialog | https://21st.dev/@ibelick/components/morphing-dialog | Equipment details and evidence inspection | Use as a transition reference; retain native dialog focus/close behavior and responsive bottom-sheet layout |
| NumberFlow, vanilla | https://number-flow.barvian.me/vanilla | Small integer counts, such as bookings and approvals | Direct framework-compatible library candidate; do not pass yoctoNEAR/precise financial balances through floating-point animation |
| Motion JavaScript | https://motion.dev/docs/quick-start | Panels, progress and coordinated entry animations | Direct JavaScript API, pinned dependency, bundled with Vite; use native CSS for simple interactions |
| Fontsource and color tools | https://designeer.xyz/resources | Self-hosted typography, accessible token validation | Designeer is a discovery catalogue; use the actual resource's source/license |

21st components above use React/Tailwind; the app currently does not. Keep vanilla Vite and the existing wallet/chain libraries. Port the selected patterns deliberately, retain applicable attribution/license notices, and record which code was reused versus independently implemented. Do not install multiple competing UI frameworks.

MotionSites at https://motionsites.com failed to load in both the web reader and Chrome. No component from that site is claimed as inspected or selected. Revisit if a working component URL becomes available; this does not block the other selections.

Animation budget: approximately 140–180 ms for controls, 220–300 ms for panels, a restrained initial card reveal. Prefer transform and opacity. Pause nonessential motion in hidden tabs; respect reduced-motion preferences. Transaction confirmation only animates after verified data arrives. Avoid repeated animations every refresh, animated signing amounts, continuous glowing controls and scroll effects that delay task completion.

## Web3 patterns to apply

- Uniswap (https://app.uniswap.org/): one prominent task with a legible review surface, clear account entry, and progressive detail. Apply this to booking and withdrawal review.
- Safe (https://app.safe.global/; https://docs.safe.global/sdk/starter-kit/guides/send-transactions): make approval threshold, individual participation and execution state explicit. Borrow the clarity of approval tracking, while implementing CommonKit's own contract semantics.
- Snapshot (https://snapshot.box/#/s:aavedao.eth): public proposal browsing, concise state/author/timing summaries and detailed vote/result views. Apply to council cards and read-only judging. Do not copy Snapshot's voting mechanics: CommonKit uses on-chain Sputnik votes.

The resulting app must answer: which account is connected, which role can act, what will be signed, how much it costs, what is pending, what completed, and where the receipt can be verified.

## Screen plan

### Equipment library

Live equipment, availability and fees; honest empty states; search/filter controls; camera artwork marked illustrative until actual asset media exists. Equipment detail opens a desktop drawer or mobile bottom sheet. Booking review separates usage fee, refundable bond, retained storage and network cost information. All amounts come from live configuration using exact integer conversions. A disconnected visitor can browse and inspect proof before connecting Meteor.

### My bookings

Persistent booking selection, borrower/custodian identifiers, scheduled pickup window, normal-return and dispute branches, and one appropriate next action. Evidence upload shows a local SHA-256 fingerprint and does not imply the file is stored on-chain. Keep selected files/form values stable while refreshing. Display account-wide credit separately from this booking's allocation. Explain escrow → allocated credit → withdrawal pending → paid.

### Council and treasury

Show open/recent proposals, their linked bookings, evidence, damage/refund split, proposer, actual threshold, each council vote and execution receipts. Separate settlement proposals from treasury withdrawal proposals. Label limited history as recent proposals or add pagination.

Important prototype correction: the current live Sputnik DAO executes the function call when the second VoteApprove reaches the configured threshold. Do not retain the prototype's extra Execute button. Show 1/2 approvals → second approval pending → execution being verified → credits allocated. An Approved proposal alone must not be represented as a successful payment; inspect child receipts and resulting state. Treasury withdrawal uses its own proposal and voting cycle.

### Wallet and public proof

Persistent NEAR Testnet badge, Meteor connection, readable account ID with copy/detail, actual role badges and an account-switch entry. A single account may be custodian and council member. Roles derive from live membership/policy; preview role impersonation is removed. Public proof remains available without a wallet and receives the same typography/colors. Historical receipts remain clearly distinct from newly created bookings.

## Implementation sequence

1. Establish current JS tests and production build baseline. Work in `app/`; `web/` and `server.mjs` are the older simulator. Preserve existing public proof artifacts.
2. Extract wallet/session, RPC refresh, transaction tracking and view modules from `app/app.js`, retaining `app/presentation.js` and `app/wallet-result.js` behavior. Preserve request sequence guards. The existing 15-second interval rerenders cached state; add controlled real refresh on wallet return/focus and visible-tab polling. Retain component nodes so refresh does not destroy focus, form fields or animations.
3. Implement tokens, shell, wallet/account control, reusable cards, tabs, drawer/sheet, notices and motion. Integrate the library and reservation review first, then bookings, then council/treasury, then verification styling.
4. Wire all controls to live views and existing transaction functions. Track waiting for wallet, submitted hash, confirming, final success, rejected, unknown/unconfirmed, and failed child receipt. Recheck an existing transaction hash before offering a retry. Prevent duplicate submissions and stale-account actions.
5. Run deterministic production-app browser tests and responsive/accessibility review. Fix findings before live signing.
6. Exercise fresh normal-return and dispute cycles through Meteor, capture receipts and verify state. Repeat responsive flows. The user selected desktop and responsive Chrome testing for this pass; physical-device wallet behavior remains a separate future check. Create new evidence manifests while retaining the old cases.
7. Run Vercel production build/scan and verify public routes/assets. Prepare release notes, demo script and deployment-ready artifact. If a new origin is deployed, reconnect and test Meteor on that origin; local success does not establish deployment-origin success. Existing scope remains Vercel configuration readiness unless deployment is separately requested.

## Test matrix and acceptance criteria

| Layer | Required evidence |
| --- | --- |
| Existing behavior | JS tests and production build/scan pass; targeted contract tests rerun when transaction semantics change |
| Production UI | New browser tests address `app/`; the existing `test:browser` targets the older simulator and is insufficient |
| Responsive | 1440 desktop, 768 tablet, 390 and 375 phone widths; no overflow, accessible controls, visible pending state, working dialogs, preserved fields, reduced motion |
| Wallet edge cases | Disconnected/nonmember/wrong role, account switch, cancellation, popup closed, reconnect, refresh after submitted transaction, duplicate click, insufficient balance, stale/failed RPC, failed child receipt |
| Normal return | Reserve → pickup → request return → custodian accept → borrower withdrawal → DAO treasury proposal/two votes → verified final payment |
| Dispute | Reserve → pickup → return/dispute → settlement proposal → first vote with escrow unchanged → second vote with verified automatic execution → borrower withdrawal → DAO withdrawal proposal/two votes → verified final payment |
| Public proof | Fresh booking/proposal/hash records verify without wallet access; existing historical cases still work |
| Genuine mobile | Test actual supported device/browser wallet handoff, return, reconnection, account switching, signing and both flows; record device/browser and evidence |

A phone-sized desktop viewport proves responsive layout, not a genuine mobile Meteor signing flow. Actual device access and Meteor's supported mobile handoff must be established before marking mobile-wallet testing complete. If unavailable, report that exact gap and provide the device test procedure instead of claiming a pass.

Receipt validation should use transaction-derived historical facts; current aggregate ledger values may change as new cycles run. Screenshots are useful UX evidence but transaction hashes, final receipts and contract reads establish testnet success.

## Delivery checkpoints

1. Real app with new palette and live read-only views.
2. Meteor-connected library, normal return and council flow with designed pending/error states.
3. Desktop and responsive test evidence, plus a separately reported real-mobile outcome.
4. Fresh judge-verifiable receipts and a Vercel-ready production build.

The initial research/planning pass made no production changes. The subsequent implementation and test pass completed the local production UI and fresh testnet rehearsals documented above; deployment remains pending.
