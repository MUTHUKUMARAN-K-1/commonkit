# Public judge-proof validation — 9 November 2026

Release tested: `cce4331f3c91a894db34b66b32cbed566bb31508`, deployed at
[public demo](https://commonkit-testnet.vercel.app).
[Pinned Vercel release](https://commonkit-testnet-1u7j7tpkk-muthukumaran-k-1s-projects.vercel.app).

The public verifier and animated walkthrough now select the completed Vercel
Meteor rehearsals: normal booking #10 / treasury #15, and disputed booking #11 /
settlement #16 / treasury #17. This session performed only read-only checks,
without connecting or signing with a wallet.

- Desktop browser: normal **21/21**, dispute **27/27**, no mismatches or unavailable checks.
- Phone viewport: requested 390 × 844; document content width 375 CSS px after the scrollbar, with no horizontal overflow. Both flows passed again. This is responsive browser testing, not a physical phone wallet test.
- Download report: the normal-flow JSON downloaded through the public button and was parsed successfully; see [browser report](normal-browser-report.json).
- Tour: normal-return and first-vote chapters show the new booking/proposal IDs; playback ran from 0:00 to 1:00 and displayed the completion message. Selecting a chapter afterward restored the replay explanation.
- All 24 current page/module/proof files checked over unauthenticated HTTPS matched source after Git text line-ending normalization. Evidence fixture bytes matched exactly.
- Local validation: 73 JavaScript tests and production artifact checks passed. [Release CI](https://github.com/MUTHUKUMARAN-K-1/commonkit/actions/runs/42579467872) passed, including Rust, API and compiled-contract sandbox checks.
- [CLI report](../public-verification.json): 48 fresh RPC checks passed. Saved snapshots do not substitute for live verification.

## Captures

| View | Capture |
| --- | --- |
| Normal proof, desktop | [Screenshot](normal-desktop.png) |
| Both selected-flow badges and dispute result, desktop | [Screenshot](dispute-desktop.png) |
| Normal proof, phone viewport | [Screenshot](normal-mobile.png) |
| Dispute proof, phone viewport | [Screenshot](dispute-mobile.png) |
| Tour normal-return chapter | [Screenshot](tour-normal-desktop.png) |
| Tour one-vote checkpoint | [Screenshot](tour-first-vote-desktop.png) |
| Tour completed | [Screenshot](tour-completed-desktop.png) |
| Tour one-vote checkpoint, phone viewport | [Screenshot](tour-first-vote-mobile.png) |

The original Meteor transactions remain pinned to the earlier rehearsed release
in [deployment.json](../deployment.json). Updating this read-only presentation
does not create new wallet transactions or change their provenance.
