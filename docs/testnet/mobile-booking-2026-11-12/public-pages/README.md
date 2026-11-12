# Public mobile-proof publication checks — 12 November 2026

Public origin: https://commonkit-testnet.vercel.app

Deployment: `dpl_2iNGeugCBczysRsUU8bo8VHKH2mt`.

- [CLI report](cli-verification.json): 54/54 live checks passed: normal return 21, dispute 27, mobile reservation 6.
- [Mobile browser report](mobile-browser-report.json): 6/6 fresh checks passed; downloaded from the public verifier without a wallet.
- [Normal browser report](normal-browser-report.json): 21/21 fresh checks passed on the public page.
- [Browser checks](browser-checks.json): desktop 1440 × 1000 and responsive 390 × 844, no horizontal overflow or page errors, public evidence links reachable, report download, tour link, and reduced-motion support.
- Blocking every RPC provider displayed incomplete verification with five unverified checks, never a cached live pass. The published manifest check remained a local-input check.
- The first browser run timed out waiting 150 seconds for the normal verifier; a subsequent run completed 21/21. RPC availability and latency remain external dependencies. No saved result was substituted.
- `npm test`: 92 tests passed, including seven mobile-verifier failure/accounting tests. After sanitizing the public receipt, all seven mobile tests passed again.
- `npm run build:vercel`: passed, 74 production files; the Vercel production build also succeeded.

Screenshots show the published verification section and tour at both widths.
Tour screenshot capture disables animation only to capture the final rendered
frame; motion remains enabled in the public tour unless reduced motion is set.
These are read-only publication checks, not another signed booking or a physical
phone test. Original Meteor reservation evidence is in the parent directory.

The repository remains private. Public artifacts contain only testnet evidence;
transaction signatures and public-key fields are omitted from the saved receipt.
