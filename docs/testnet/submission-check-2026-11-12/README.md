# Final public submission checks — 12 November 2026

Public origin: https://commonkit-testnet.vercel.app

- [Browser audit](browser-audit.json) records the final status and timestamps.
- [Normal return report](normal-report.json), [dispute report](dispute-report.json),
  and [mobile reservation report](mobile-report.json) are downloaded directly
  from the deployed wallet-free verifier. Inspect each report's `passed`,
  `summary`, block anchor and provider provenance rather than inferring success
  from the presence of a file.
- Desktop 1440 × 1000 and responsive 390 × 844 checks covered onboarding,
  both recorded outcome previews, the unsigned quote, membership guidance,
  disabled booking without a wallet, Bookings/Council routes, all six tour
  chapters and reduced motion. No horizontal overflow or page errors were seen.
- The 60-second illustrated tour played naturally to completion. Screenshots
  capture its settled animation frames, not new wallet transactions.
- [Initial audit](browser-audit-initial.json) stopped on archive availability:
  [dispute attempt](dispute-unavailable-report.json) had 14 passed checks,
  13 unverified and no mismatches. Its result was retained rather than replaced
  with cached successes. [One-second pacing](dispute-one-second-pacing-report.json) reduced this to two unverified checks but did not resolve availability. The final transport uses at least 6.5 seconds between archive request starts; provider limits are not guaranteed or bypassed.
- [Targeted secret-pattern scan](secret-pattern-scan.json) covered Git history
  before this review; it is not a comprehensive audit.

The corrected guide and paced read-only transport are deployed as
`dpl_Bch9VUbK8kDdJSKFzLmCr5zFu1BZ`,
https://commonkit-testnet-5d758plf4-muthukumaran-k-1s-projects.vercel.app,
with the public alias above. No wallet was connected or transaction signed in
this review. Existing Meteor receipts establish the recorded signed flows.

Current local validation: 94 JavaScript tests and the 74-file production artifact
check passed. Prior implementation CI also passed Rust, API and compiled-contract
Sandbox suites; see the linked readiness report for the exact commit/run.

Availability diagnosis: the archive eventually returned HTTP 429 with
`Retry-After: 397`; its failure responses lacked browser CORS headers. A
browser-simple content-type probe also failed and was not adopted. Single
historical-read probes against the documented dRPC, Intear and ZAN alternatives
did not yield a complete receipt. No alternative is configured on speculation.
The failed reports remain recorded; a later recheck must fetch fresh data.
