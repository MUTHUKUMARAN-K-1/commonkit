# Hackathon submission preparation

This is a preparation checklist, not an application submission. No X post or application has been sent.

## Prepared project facts

- Project: **CommonKit**.
- Selected track: **Social Money**, confirmed by the owner.
- Repository: https://github.com/MUTHUKUMARAN-K-1/commonkit — **private at the owner's request**.
- Live product: https://commonkit-testnet.vercel.app.
- Demo: [60-second illustrated judge tour](https://commonkit-testnet.vercel.app/judge.html), [tour script and evidence map](JUDGE-WALKTHROUGH.md), and [three-minute recording script](DEMO-SCRIPT.md). A published demo video/social post remains to be made.
- License: [MIT](../LICENSE), chosen by the owner.
- Baseline: imported `baseline-v0.1` snapshot; current development changes identified by the README baseline-to-main compare link. `submission-ready` is an older intermediate tag, not the final submission. Commits are dated when created, not backdated.
- Public verification: [48 checks across both flows, without a wallet](https://commonkit-testnet.vercel.app/verify.html), also `npm run verify:testnet`; [scope and limitations](VERIFICATION.md).
- Proof: [normal return](testnet/METEOR-NORMAL-RETURN-REHEARSAL.md) (8 transactions / 21 checks) and [DAO dispute](testnet/METEOR-POLISHED-REHEARSAL.md) (11 transactions / 27 checks), with one-vote/two-vote snapshots. Later [cobalt UI rehearsals](testnet/cobalt/README.md) cover 4 separate desktop/responsive cycles, 38 transactions and 96 checks. Do not add these overlapping proof categories together.
- Vercel: publicly deployed; fresh Meteor cycles on the new origin remain pending. Release status and tests are tracked in [VERCEL.md](VERCEL.md).

## Project description draft

CommonKit is a community equipment library on NEAR testnet. Members reserve shared equipment with a refundable bond, a separate custodian records handover and inspection, and a Sputnik DAO settles disputed damage through two council approvals. The first vote leaves funds escrowed; the second creates borrower and DAO credits, followed by separately authorized withdrawals. The browser frontend uses Meteor Web for real signatures and exposes booking progress, individual votes, final execution receipts and a balanced principal ledger. The prototype demonstrates coordination around physical equipment without claiming that evidence hashes prove physical truth.

## Remaining before submission

- [ ] Freeze a new immutable submission tag after the final docs, deployment and public-origin tests. The older tag does not include all current proof or UI.

- [ ] Owner authorizes changing the repository from private to public. Do not change visibility automatically. The rules require public access by **14 November 2026, 23:59 UTC / 15 November, 05:29 IST**, and through judging.
- [ ] Confirm team lead name, contact email, team size and the team's **mainnet** payout account. Do not substitute any testnet demo account.
- [ ] Human records/reviews the demo and publishes a public X post mentioning NEAR HACKATHON, `@NEARProtocol` and `#NEARHackathon`, with the video or screenshots attached. Save that public post URL; the API's `demoUrl` means the social post, not the hosted app.
- [ ] Recheck the live rules and verify this repository has not already been submitted.
- [ ] Obtain the human's explicit contact-notice consent and approval of the complete, final application payload. Only then submit once. No placeholder application JSON is prepared here.
- [ ] Keep the hosted demo available through 18 November, ideally 25 November.

The current official rules permit testnet-only projects and require baseline/reuse disclosure and a license. The private preparation repository is not yet eligible for submission as-is. See [official HACKATHON.md](https://nearhackathon.com/HACKATHON.md) and the [reference copy read on 8 November](hackathon-submission-rules-2026-11-08.md). Recheck dates before submitting.
