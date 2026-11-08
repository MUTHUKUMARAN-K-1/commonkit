# CommonKit: three-minute demo script

Record one fresh cycle through the public demo in Chrome and Meteor Web. Allow 10–15 minutes to capture wallet prompts and confirmations, then trim idle waiting into this three-minute cut. Keep the first-vote escrow state and second-vote result visible. Do not present edited timing as instant execution.

## Before recording

- Open https://commonkit-testnet.muthukumarank.chatgpt.site and unlock Meteor privately. Never record the unlock password, seed phrase, key import screen or developer credentials.
- Use the operator's three imported **testnet** wallets: borrower, custodian/council 2, and council 1. Both council accounts are controlled by the demo operator; say so.
- Use the labeled [pickup](../app/public/evidence/pickup.txt), [return](../app/public/evidence/return.txt), [damage](../app/public/evidence/damage.txt) and [decision](../app/public/evidence/decision.txt) fixtures. These simulate evidence, not physical events.
- Reserve a new booking with pickup a few minutes ahead. Note its actual booking ID and the two new proposal IDs. Existing proof is booking #4 / settlement #6 / treasury #7; do not reuse those IDs for a new transaction.
- Keep the wallet, booking progress, council section and accounting readable. Select the same booking after any account change if necessary. The borrower attaches 0.111 testnet NEAR; each proposal attaches a separate 0.01 NEAR DAO bond, plus gas.

## Narration and shots

| Time | Show / do | Say |
| --- | --- | --- |
| 0:00–0:15 | CommonKit title, camera kit, three wallet roles | “Campus clubs share equipment, but deposits and damage disputes often depend on one organizer. CommonKit gives the borrower, custodian and community council clear roles.” |
| 0:15–0:35 | Borrower: reserve; Meteor's 0.111 NEAR approval; new Reserved booking | “The borrower reserves the camera. This testnet deposit includes a usage fee, a refundable bond and a clearly disclosed storage charge.” |
| 0:35–0:55 | Custodian account; pickup evidence; Confirm pickup and final receipt | “The custodian confirms handover. The account's permissions come from the contract. Evidence stays on the device; its fingerprint goes on-chain.” |
| 0:55–1:10 | Borrower account; return evidence; Request return | “The borrower requests a return. They cannot approve their own inspection.” |
| 1:10–1:30 | Custodian: damage evidence and Report damage; Council review; escrow 0.011 | “We simulate a damage dispute. The custodian can flag damage but cannot take the bond. The principal remains in escrow.” |
| 1:30–1:50 | Decision evidence; Propose a library change → 0.003 damage; new settlement proposal | “A council member proposes retaining 0.003 NEAR for damage. The proposal shows the exact booking, target and amount.” |
| 1:50–2:10 | First council wallet approves; 1/2; booking disputed; escrow unchanged | “One vote records support. It does not settle the booking or release funds.” |
| 2:10–2:30 | Other council wallet approves same proposal; 2/2; Closed; 0.007 / 0.004 | “The second account approves the same decision. Sputnik calls the library, which creates 0.007 borrower credit and 0.004 DAO credit. The UI verifies actual settlement.” |
| 2:30–2:50 | Treasury proposal and two votes, then borrower Withdraw available credit | “Credits are not transfers. The treasury needs its own two-vote withdrawal; the borrower signs their own withdrawal.” |
| 2:50–3:00 | Zero escrow/credits/pending, balanced ledger, receipt links | “Every step has a real testnet receipt. This is a prototype with both council accounts operated by us; independent council ownership is the next governance step.” |

For a normal return, the custodian selects **Accept return** instead of reporting damage; the borrower gets the full bond and the DAO gets the fee. This recording follows the dispute branch so the council's role is visible.

## If a wallet step stalls

Click once, allow the popup, and inspect the existing Meteor window. Wait for the site to confirm final execution. If cancelling, cancel the unsigned request in Meteor; do not approve a leftover duplicate popup. If a hash exists, inspect its receipt and contract state before retrying. Account changes use Disconnect → Connect Meteor → Meteor Web → choose the other account.

## Judge verification without the operator wallets

Open [Verify the flow](https://commonkit-testnet.muthukumarank.chatgpt.site/verify.html). Show the 27 fresh checks, expand the actual borrower/DAO transfers, and download the report. This rechecks the recorded booking #4 rehearsal; it does not create a new booking or verify a newly recorded cycle automatically. The first-vote balance snapshots remain explicitly historical. The same checks run with `npm run verify:testnet`.

## Short fallback when live signing is unavailable

Use a **recorded-state walkthrough**, explicitly labeled as such: booking #4 → proposal #6 with two approvals → [the saved one-vote snapshot](testnet/meteor-polished-single-vote.json) → final allocation and [eleven verified receipts](testnet/meteor-polished-receipts.txt). Show the [rehearsal report](testnet/METEOR-POLISHED-REHEARSAL.md). Do not describe this fallback as a new live run.

The final video and public demo post must be recorded/reviewed and published by the human. This file is a script, not a submitted video or post.
