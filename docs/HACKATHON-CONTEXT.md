# Hackathon context used for the demo polish

Reviewed on 8 November 2026: https://nearhackathon.com/, https://nearhackathon.com/HACKATHON.md and `../PREV CHAT/HACKATHON.md`. The live Markdown matched the local copy after trimming surrounding whitespace. The fetched copy is `hackathon-live-2026-11-08.md`; recheck the live version before submission.

CommonKit appears to fit **Social Money** especially well: it uses Sputnik DAO for a community equipment library, including shared custody, refundable bonds and collective dispute decisions. This is a design rationale, not a submitted track selection. Its own NEAR contract and testnet-only deployment are permitted by Q-010 and Q-011; unrelated integrations are not necessary for eligibility.

The demo should make one complete action-to-result story visible: an admitted member reserves equipment, the custodian records pickup, the borrower requests return, and the council settles a dispute through two independent account votes. The first vote must visibly leave the booking locked; the second produces credits; withdrawal then moves those credits. The interface must keep these outcomes distinct and must not claim independent human governance when one demo operator controls both council accounts.

The frontend polish emphasizes connected identity and role, the current booking stage and next actor, and each council vote. Its default read-only view should let a judge inspect the completed public testnet flow without needing the operator's private keys. Live signing remains a wallet action.

The organizers require a public project repository, reproducible README and a public human-published demo post. The current hosted frontend source repository is not a substitute for publishing the full contract/application repository. The archived starting build also needs a clear baseline and development-diff description before submission. This frontend task does not publish that repository, choose a license, post on X, or submit the project.

The current deadline is **15 November 2026 at 5:29 AM IST** (14 November, 23:59 UTC). The guidance asks teams to keep hosted demos available through 18 November, ideally 25 November. No submission has been sent by this work.
