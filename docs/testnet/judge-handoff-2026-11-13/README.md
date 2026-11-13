# Judge handoff browser checks — 13 November 2026

This is UI/media/outage validation, **not a new signed borrowing rehearsal**.
No wallet connected and no transactions were submitted.

- Local production preview: [browser-checks.json](browser-checks.json).
- Deployed public alias: [public/browser-checks.json](public/browser-checks.json).
- Public source: https://commonkit-testnet.vercel.app.
- Deployment: `dpl_iXeHZRWFCQubLiniwsuQUFodupiS`.

Both runs passed eight grouped checks at 1440 × 1000 and 390 × 844:
recorded outcomes with JavaScript disabled, zero external resource requests,
nine saved-evidence links, normal/dispute RPC outage behavior, all six tour
chapters, reduced-motion layouts and film playback/metadata at both widths.

The outage tests abort requests to every origin except the demo. They verify
that chain checks stay UNVERIFIED and the overall result stays incomplete.
The local manifest-consistency check can still pass; that is not chain proof.
The initial test incorrectly expected zero total passes; it was corrected after
reading the engine's manifest check. No verifier logic was changed to satisfy it.

Screenshots in the root are local; screenshots under `public/` are from Vercel.
`recorded-*` images show dated historical evidence, not new live passes.
`rpc-outage-*` captures are intentionally simulated failures, not evidence of
an actual public-provider incident. Film screenshots were captured after muted
playback advanced and paused; they do not establish perceptual audio review.

All amounts and checkpoint identities come from the existing November 9
manifests. The latest fresh proof reports remain November 12. Physical-phone
signing and independent human usability are outside these automated checks.
The owner is arranging a tester using [the five-minute sheet](../../INDEPENDENT-TEST.md).
