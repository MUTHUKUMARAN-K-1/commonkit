# CommonKit judge Q&A

Prepared 15 November 2026 for the submitted testnet prototype. Answers describe implemented behavior and recorded evidence, not promised production guarantees. Start with the [60-second dispute-first walkthrough](JUDGE-WALKTHROUGH.md).

## What is the problem and who needs this?

“A campus club can share a camera, but a damaged return raises a harder question: who gets the deposit? CommonKit records the borrowing terms, separates custody from the damage decision, and makes the resulting payments inspectable.”

Campus clubs and small equipment-sharing communities are the intended audience. They are not claimed customers. [Product and scope](../README.md#why-commonkit).

## What is your strongest demonstration?

“In booking #11, one council vote left 0.011 NEAR locked. Two votes approved 0.003 NEAR damage and created 0.007 borrower credit plus 0.004 DAO credit, including the usage fee. Separate withdrawals then paid both parties. We can show the decision and the payments without asking you to connect a wallet.”

Show the [recorded vote transition](https://commonkit-testnet.vercel.app/recorded.html#first-vote), then the [actual transfer checks](https://commonkit-testnet.vercel.app/verify.html?flow=dispute). Intermediate balance snapshots are historical. The first-vote receipt is separately checked for absence of a settlement call.

## Why use NEAR rather than a spreadsheet or ordinary database?

“A database can manage bookings. Here, the disputed money is held by a contract, the existing Sputnik DAO authorizes its allocation, and public receipts let someone outside the operator's website inspect execution. NEAR supplies account identities, contract calls and asynchronous payment receipts; Meteor supplies the user's signatures.”

This does not make damage assessment objective or remove trust in the council. It makes the authorized decision and money movement observable. [Architecture](../README.md#architecture).

## Does a successful DAO vote mean the borrower has been paid?

“No. Approval, successful contract settlement, available credit and successful payment are different states. The second settlement vote creates credits. The borrower withdraws their credit; the DAO needs a separate treasury proposal and two approvals to withdraw its credit.”

The verifier checks connected child receipts, exact transfer amounts and successful callbacks. An outer transaction success or gas refund cannot stand in for the principal payout. Withdrawals consume an account's available credit; booking allocation is checked separately. [Verification details](VERIFICATION.md#dao-dispute-booking-11).

## What happens when nothing is damaged?

“The custodian accepts the return. In completed booking #10, the borrower withdrew the full 0.010 NEAR bond and the DAO withdrew its 0.001 usage fee. No damage-settlement vote was required; the DAO fee withdrawal still used its treasury approval process.”

Show [normal return #10](https://commonkit-testnet.vercel.app/recorded.html#normal). It is a different booking from the disputed example.

## Can the custodian take the bond or approve their own borrowing?

“The custodian can report damage but cannot allocate the bond through that action. The configured DAO resolves disputes, with damages bounded by the bond. The same account cannot be both borrower and custodian for a reservation.”

Account separation does not establish separate people. The demo's custodian is also one of its council accounts, and one operator controls both council accounts. Production would need independent operators and a conflict-of-interest policy. [Threat model](THREAT-MODEL.md#authority-and-trust).

## Does the evidence hash prove the camera was damaged?

“No. It lets us match a file to the recorded fingerprint. It cannot prove physical possession, condition or truth. Our pickup, return, damage and decision files are explicitly synthetic fixtures. The council remains responsible for the judgment.”

The [case file](https://commonkit-testnet.vercel.app/verify.html?flow=dispute#case-file) distinguishes the original damage report from the final decision. [Evidence boundaries](VERIFICATION.md#boundaries-of-the-evidence).

## Who controls membership, code and governance?

“The configured Sputnik DAO controls admission, asset registration, custodian changes and dispute decisions through the library's methods. The public verifier checks the library's pinned code hash, absence of library access keys and the expected current two-account council policy. The published 14 November report passed those checks.”

That is a dated observation, not a guarantee about today's state. Use fresh checks for current claims. The reviewed library source exposes no upgrade method, but this does not establish that the entire Sputnik factory/DAO dependency graph is immutable or fully audited. Upgrade/recovery strategy and dependency authority require further review before real funds. Do not claim that the frontend operator can freely replace the keyless library, or that every component is beyond governance control. [Dated report](../app/public/media/verification-2026-11-14.json) · [Contract source](../contract/src/lib.rs) · [Verifier scope](VERIFICATION.md).

## What if the custodian disappears, the council stops voting, or a transfer fails?

“Anyone can escalate an overdue checkout after 24 hours, but the DAO is still needed to resolve the escrow. A missing custodian or inactive or colluding council can block fair settlement; this prototype does not offer permissionless arbitration.”

For money transfer failure, a bound private callback restores credit so it can be retried. If the callback never arrives, the amount can remain pending; it must not be blindly withdrawn twice. Targeted sandbox tests exercise failed transfers, restoration and callback replay, but are not a complete audit. [Threat model](THREAT-MODEL.md) · [Failure tests](CONTRACT-FAILURE-TESTS.md).

## Why does booking cost 0.111 NEAR when the bond is only 0.010?

“The prototype attaches 0.100 NEAR retained storage, a 0.010 refundable bond and a 0.001 usage fee. Only the bond is fully returned in a clean return. Gas and separate DAO proposal bonds are additional.”

This fixed storage charge is a prototype limitation, not validated production pricing. Storage profiling, capacity and economics need work before a real-value pilot. Current capacity is 32 assets, 64 admitted members and 256 lifetime bookings without archival. [Price and ledger](../README.md#follow-the-money) · [Scope](../README.md#scope-and-trust).

## Can I try it without your accounts? What happens if RPC fails?

“You can explore both completed outcomes and inspect payment links without a wallet. Fresh browser or CLI verification uses public read-only RPC. A fresh signed booking requires an admitted member and their own wallet; council actions require council authority.”

The [recorded page](https://commonkit-testnet.vercel.app/recorded.html) works without JavaScript or RPC and stays labeled historical. The fresh verifier reports UNVERIFIED for missing evidence; it does not turn cached results into a current pass. Explorer pages and fresh verification still depend on external services. These RPC checks are not a light-client proof or an audit. [Visitor paths](ONBOARDING.md) · [Verification](VERIFICATION.md).

## Has anyone outside the builder tested it? Does mobile work?

“The independent first-visit trial is planned; no completed participant feedback is recorded yet. We have real Meteor testnet transactions from operator rehearsals. Booking #13 was initiated from a 390 × 844 desktop Chrome layout with later desktop confirmation. It is a reservation proof, not a physical-phone test or another completed return.”

Do not turn a planned friend test, automated check or hypothetical answer into a testimonial. If feedback arrives later, state its actual date, prior exposure and relationship to the builder. [Pending test sheet](INDEPENDENT-TEST.md) · [Mobile evidence](testnet/mobile-booking-2026-11-12/README.md).

## Why this project, and what comes next?

“Our focus is the complete damage-dispute path for shared equipment: who can report, who can decide, what stays locked, and whether both payouts actually execute. Judges can inspect a completed clean return and disputed return through one public evidence path.”

Do not claim the broad idea, two-vote pattern or name is unique. Identify this entry as **CommonKit — camera borrowing and DAO damage disputes**, by **MUTHUKUMARAN-K-1/commonkit**. Social Money is the primary case; Real-World Money and Open Innovation are additional submitted tracks.

Next: collect genuine first-visit feedback, then arrange a consented equipment-sharing pilot with separate people controlling the roles. Address storage economics, authority/recovery review and conflict-of-interest handling before real funds. These are next steps, not implemented features or completed adoption.
