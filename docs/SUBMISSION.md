# Hackathon submission preparation

This is a preparation checklist, not an application submission. Rules rechecked on **14 November 2026**. The owner's latest project-status confirmation is that CommonKit is their only entry and no X post/application has been published. Contact consent was given on 14 November; lead name, contact email and solo-team size were supplied privately; the owner-created mainnet payout account has been verified. The owner authorized publication, and the repository is now public. [Latest check and evidence](SUBMISSION-CHECK-2026-11-14.md).

## Prepared project facts

- Project: **CommonKit**.
- Selected track: **Social Money** (`social`), confirmed by the owner.
- Repository: https://github.com/MUTHUKUMARAN-K-1/commonkit — **public, verified without authentication on 14 November**.
- Live product: https://commonkit-testnet.vercel.app.
- Demo: [60-second illustrated judge tour](https://commonkit-testnet.vercel.app/judge.html), [tour script and evidence map](JUDGE-WALKTHROUGH.md), and [three-minute recording script](DEMO-SCRIPT.md). The [final 1:55 pitch, real-app walkthrough and captioned player](https://commonkit-testnet.vercel.app/film.html) are packaged; the human-published X demo post remains pending.
- License: [MIT](../LICENSE), chosen by the owner.
- Baseline: imported `baseline-v0.1` snapshot; current development changes identified by the README baseline-to-main compare link. `submission-ready` is an older intermediate tag, not the final submission. Commits are dated when created, not backdated.
- Public verification: [54 checks across both completed flows and the mobile reservation, without a wallet](https://commonkit-testnet.vercel.app/verify.html), also `npm run verify:testnet`; [scope and limitations](VERIFICATION.md).
- Proof: [Vercel normal return #10](testnet/vercel/README.md) (8 transactions / 21 checks) and [DAO dispute #11](testnet/vercel/desktop-dispute/manifest.json) (11 transactions / 27 checks), with one-vote/two-vote snapshots. Later [cobalt UI rehearsals](testnet/cobalt/README.md) cover 4 separate desktop/responsive cycles, 38 transactions and 96 checks. Do not add these overlapping proof categories together.
- Vercel: publicly deployed; fresh Meteor normal-return (#10) and dispute (#11) cycles completed on 9 November, with 19 finalized transactions and 48 passed receipt checks. The owner handled Meteor approvals. [Final evidence](testnet/vercel/README.md) · [Deployment record](VERCEL.md).

- Mobile proof: [booking #13](https://commonkit-testnet.vercel.app/verify.html#mobile-proof), one real Meteor reservation and six live checks. Review/signature initiation at 390 × 844; later confirmation at desktop width. No physical-phone or completed-return claim.
- Reviewed source candidate: immutable `submission-candidate-2026-11-13` at `3e6523e`, with successful CI. Later changes need a new tag, not a moved tag. The 14 November check adds documentation and fresh read-only evidence.

## Project description draft

CommonKit is a community equipment library on NEAR testnet. Members reserve shared equipment with a refundable bond, a separate custodian records handover and inspection, and a Sputnik DAO settles disputed damage through two council approvals. The first vote leaves funds escrowed; the second creates borrower and DAO credits, followed by separately authorized withdrawals. The browser frontend uses Meteor Web for real signatures and exposes booking progress, individual votes, final execution receipts and a balanced principal ledger. Judges can verify both completed flows and a mobile-width reservation through read-only public RPC without our wallets. The prototype demonstrates coordination around physical equipment without claiming that evidence hashes prove physical truth.

## Remaining before submission

- [ ] Review the immutable source candidate and any subsequent changes before publication. The older `submission-ready` tag is not the current candidate.

- [x] Owner authorized publication; repository visibility changed to public and anonymous access returned HTTP 200. The rules require public access by **14 November 2026, 23:59 UTC / 15 November, 05:29 IST**, and through judging.
- [x] Lead name, email and team size (`1`) received privately; the owner-created mainnet payout account was verified by a finalized mainnet RPC read. Details remain outside Git.
- [ ] Human reviews the [post draft and attachment plan](DEMO-POST-DRAFT.md), then publishes a public X post mentioning NEAR HACKATHON, `@NEARProtocol` and `#NEARHackathon`, with the video or screenshots attached. Save that public post URL; the API's `demoUrl` means the social post, not the hosted app.
- [ ] Recheck the live rules and verify this repository has not already been submitted.
- [ ] Obtain the human's explicit contact-notice consent and approval of the complete, final application payload. Only then submit once. No placeholder application JSON is prepared here.
- [ ] Keep the hosted demo available through 18 November, ideally 25 November.

The current official rules permit testnet-only projects and require baseline/reuse disclosure and a license. Public source is ready; the human X demo post and final application approval remain pending. See [official HACKATHON.md](https://nearhackathon.com/HACKATHON.md), rechecked 14 November. No additional integration or mainnet deployment is required for this Social Money implementation; the payout account must be mainnet. Recheck the live rules immediately before submitting. The final reports passed 54 checks across three runs; public archive throttling can still make a future read UNVERIFIED.

## Final application handling

The contact notice to review verbatim is: “I agree that the organizers may use
these details to review our submission and contact us about this hackathon.”
The human agreed to this notice on 14 November 2026. Do not invent names, email,
team-size category or a payout account. Keep personal application data out of Git.

Show the complete final payload for human review before sending. Generate one
request ID and reuse it for permitted retries. Use only the official fields:
`demoUrl` is the X post, while `website` is a honeypot and must not be populated.
Save the organizer's confirmation; a mistaken saved submission uses the
[request-changes page](https://nearhackathon.com/request-changes), not another
application. The owner must verify repository access while signed out after
publication. The animated tour is not a published X post or attached video.

## 13 November judge handoff

[Recorded outcomes](https://commonkit-testnet.vercel.app/recorded.html) stay readable without RPC or JavaScript. [Submission media](submission-media/README.md) is ready for owner review and attachment. An independent tester is being arranged; use the [five-minute test sheet](INDEPENDENT-TEST.md) and record actual findings before claiming user validation.

Latest handoff audit: [14 November](SUBMISSION-CHECK-2026-11-14.md). The source candidate is tagged `submission-candidate-2026-11-13` and its CI passed; previous tags remain unchanged. Today's fresh RPC recheck passed 54/54 checks. Publication is complete. The human X post and final application remain pending.

## Publication completed

The owner authorized making the repository public after creating the payout wallet. Public access was verified on 14 November. CI on code/media commit `ec644bd` passed: https://github.com/MUTHUKUMARAN-K-1/commonkit/actions/runs/43626040024. The later publication commit updates documentation only. The immutable `hackathon-submission-2026-11-14` tag identifies the published handoff; no earlier tag is moved. Final application still awaits the X post URL and exact-payload approval.
