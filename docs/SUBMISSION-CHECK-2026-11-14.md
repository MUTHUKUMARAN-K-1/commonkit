# Deadline-day submission check — 14 November 2026

Prepared, not submitted. Repository remains private. No X post or application was sent in this check. The owner agreed to the contact notice on 14 November and asked to wait for their application details. Lead name, email and solo-team size were subsequently supplied privately. A mainnet payout account still needs to be created. Independent tester feedback has not been received.

## Rules and deadline

[Official rules](https://nearhackathon.com/HACKATHON.md) re-read on 14 November. The cutoff is **14 November 23:59 UTC / 15 November 05:29 IST**. Testnet is eligible; no additional mainnet integration is required for this implementation. Source must be public by the deadline and throughout judging. Keep the hosted demo available through 18 November, ideally 25 November.

The human publishes the X post with attached video/screenshots, the event name, @NEARProtocol and #NEARHackathon. The application needs that post URL, not just the hosted app. Submit once, only after showing the human the complete final payload and receiving approval. No personal data or placeholder payload is stored here.

## Rechecked evidence

- Reviewed code candidate: `3e6523e3b96b04b423a0bd66b38fc3ad1226dd3f`, tagged `submission-candidate-2026-11-13`.
- [CI on that exact commit](https://github.com/MUTHUKUMARAN-K-1/commonkit/actions/runs/43396584202) is successful: JavaScript, production build, core Rust, API lifecycle and compiled-contract failure checks. It was re-read, not rerun today.
- Public production origin: https://commonkit-testnet.vercel.app. The initial audit needed no code changes; the later final-film deployment is documented below. Transaction logic remains unchanged.
- **Fresh public RPC: 54 PASS, 0 FAIL, 0 UNVERIFIED**, across normal #10 (21), dispute #11 (27), mobile reservation #13 (6). [Full report](testnet/submission-2026-11-14/live-verification.json). This is a fresh read of earlier signed receipts, not new bookings or signatures.
- Browser checks at 1440 × 1000 and 390 × 844: recorded outcomes without JavaScript/external requests, nine saved-evidence links, both RPC-outage fallbacks, six tour chapters and 75-second film playback. [Final browser report](testnet/submission-2026-11-14/recheck/browser-checks.json).
- Both no-wallet onboarding choices navigate to their matching recorded outcome at both widths with external RPC blocked: [four route checks](testnet/submission-2026-11-14/onboarding-checks.json).
- With live network access, the equipment card loads and the unsigned quote shows 0.111 testnet NEAR at both widths. Membership guidance is visible and reservation remains disabled while disconnected: [live library checks](testnet/submission-2026-11-14/live-library-recheck.json). An initial test searched case-sensitively for `Camera`; the live name is `Campus camera kit`. The corrected check uses the equipment-card selector. This was a test assertion correction, not a product fix.
- The initial film check timed out with the test page in the background. Foregrounding the test page made both widths pass; both reports are retained. No product change was made to hide the initial result.
- [Targeted history secret-pattern scan](testnet/submission-2026-11-14/secret-pattern-scan.json) inspected 404 text blobs across 20 reachable commits. Two long ed25519 strings were inspected in their exact Git blobs and classified as public transaction signatures (`transaction.signature`), not private keys. No unresolved pattern matches remain. This is not an exhaustive audit of all secrets, image pixels or remote Actions logs.

## Publication sequence

1. Review README, license, baseline disclosure, the evidence above and the film. The final 1:55 film uses an illustrated introduction, real-app walkthrough and dated #10/#11 outcomes. Its 54-check count includes the separate #13 reservation; keep that provenance intact.
2. Confirm the final display name. The public directory now includes a separate builder's project with the same name. Suggested descriptor for ours: **CommonKit — Equipment Borrowing & DAO Disputes**. Our repository is **MUTHUKUMARAN-K-1/commonkit** and our demo is **commonkit-testnet.vercel.app**. Do not treat another same-name entry as our submission.
3. Explicitly authorize publication, or open the repository's Settings → General → Danger Zone → Change visibility → Public. Confirm the exact owner/repository and GitHub's visibility effects. [GitHub instructions](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility). Public visibility exposes source history and Actions history/logs. Recheck the repository while signed out.
4. The human watches and attaches [the MP4](../app/public/media/commonkit-final-2026-11-14.mp4), adapts the [post draft](DEMO-POST-DRAFT.md), and publishes from their own X account. Return the public post URL for verification. Do not use @usecommonkit; that account links to the other builder's project.
5. Lead name, email and solo-team size are received privately; create and confirm the team's own mainnet payout account. Preserve consent already given, and review the entire final application JSON before sending. Use Social Money (`social`); do not add the NFT track just because the other CommonKit selected it.
6. Send once after exact-payload approval, preserve the request UUID and successful application ID, then verify the saved entry. Use the organizer's change-request process for corrections, never a second application for the same repository.

Independent tester feedback is useful evidence, but no such result is claimed. This check makes no winning prediction or production-security claim.

## Final film update

The final 1:55 film, English captions, chapter links, dated verification report and README video link replace the older film as the recommended submission attachment. [Player](https://commonkit-testnet.vercel.app/film.html) · [handoff](submission-media/README.md). The 94 JavaScript tests and 87-file production check passed. [Latest deployment](VERCEL.md). Repository remains private.
