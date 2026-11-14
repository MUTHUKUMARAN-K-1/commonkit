# Final public-film checks — 14 November 2026

The final production test passed at 1440 × 1000 and 390 × 844. [Machine report](public/report.json).

- Correct 114.73-second, 720 × 1280 video; controls and inline playback, no autoplay.
- Chapter jump to DAO dispute, playback progress and 31 English caption cues.
- No horizontal overflow; visible film link in onboarding at both widths.
- MP4 byte-range requests return 206, allowing seeking; downloaded SHA-256 matches the approved final master.
- Dated proof report contains 54 PASS / 0 FAIL / 0 UNVERIFIED; this was a file check, not a new RPC rerun.
- No browser page errors. Film and library screenshots are saved in `public/`.

An initial localhost navigation timed out. The first public run passed video checks but found the hero-side film link hidden at mobile width. The film link was added to visible onboarding, deployed and the full public test passed. No new wallet signatures were performed. All 94 JavaScript tests passed; local production-artifact check passed 87 files; Vercel's build completed.

Final deployment: dpl_4GsVXkmmaeMdWtxkUmnegrg3EU6M, https://commonkit-testnet.vercel.app.
