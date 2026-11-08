# Meteor normal-return rehearsal

Completed 2026-11-08T09:31:39.579Z on the [public demo](https://commonkit-testnet.muthukumarank.chatgpt.site) with Meteor Web in Chrome. Booking **#5** closed normally with zero damage; treasury proposal **#8** executed after both distinct council accounts approved. All eight transactions and their connected execution receipts were independently checked against finalized public NEAR testnet RPC.

## Outcome

- Borrower received the full **0.01 NEAR** bond through a successful library transfer and callback (nonce 8).
- DAO received the **0.001 NEAR** usage fee through a successful library transfer and callback (nonce 9).
- The first council vote did not call the library withdrawal; the second vote did.
- Borrower reputation increased by one. Pickup and return hashes match the retained evidence fixtures.
- Final whole-library principal: **0.055 NEAR deposited = 0.055 NEAR withdrawn**. Escrow, available credits and pending transfers are all zero. Storage, gas and proposal bonds are excluded from this principal ledger.

## Final transaction receipts

| Step | Signed action | Final transaction |
| --- | --- | --- |
| 1 | Reserve with fee, bond and storage | [7vmbrjMUj2ALpTcPAKATTRPiwS6oexsKWU83Z3HLJFwG](https://testnet.nearblocks.io/txns/7vmbrjMUj2ALpTcPAKATTRPiwS6oexsKWU83Z3HLJFwG) |
| 2 | Custodian confirms pickup | [GqJ7Kqh3rfDaoXAgYvwpyAaTrVieLE2Mrh9ctviznRBe](https://testnet.nearblocks.io/txns/GqJ7Kqh3rfDaoXAgYvwpyAaTrVieLE2Mrh9ctviznRBe) |
| 3 | Borrower requests return | [HZg56gqEYXFfo27UGhDxoDWbj2iQ2vsaqmZyM5jSrG9v](https://testnet.nearblocks.io/txns/HZg56gqEYXFfo27UGhDxoDWbj2iQ2vsaqmZyM5jSrG9v) |
| 4 | Custodian accepts return | [Fiep9HDKNkua58T4xpfiFVgL51iceBiA9SqdcnWrPvyC](https://testnet.nearblocks.io/txns/Fiep9HDKNkua58T4xpfiFVgL51iceBiA9SqdcnWrPvyC) |
| 5 | Borrower withdraws full bond | [9YFmF7Mhwf8LuFXA2e95FWh15txDRFe7mnondpnTcFCs](https://testnet.nearblocks.io/txns/9YFmF7Mhwf8LuFXA2e95FWh15txDRFe7mnondpnTcFCs) |
| 6 | Propose DAO fee withdrawal | [6vtHjhBJBgPCnjZfxWoXYcwdtcM9WfQZ7UtNZNfQ6cRP](https://testnet.nearblocks.io/txns/6vtHjhBJBgPCnjZfxWoXYcwdtcM9WfQZ7UtNZNfQ6cRP) |
| 7 | First council approval | [B3bV4FCrMUrNEeSRijM8yntEXw4b6fjWDEiVGzvfMH2g](https://testnet.nearblocks.io/txns/B3bV4FCrMUrNEeSRijM8yntEXw4b6fjWDEiVGzvfMH2g) |
| 8 | Second council approval and DAO payment | [4XC191VBi46anQQNoDyXHQ3PSvcjncoFv9PLNkhGWpj7](https://testnet.nearblocks.io/txns/4XC191VBi46anQQNoDyXHQ3PSvcjncoFv9PLNkhGWpj7) |

Every receipt check binds the exact signer, receiver, method, arguments, attached deposit and return value. The saved report contains the connected receipt graph, verifies successful descendant outcomes, and matches each exact principal transfer to its callback dependency. A successful top-level transaction or an Approved proposal alone is insufficient proof of payment.

## Captured checkpoints

- [After normal settlement](meteor-normal-settled.json), finalized block 276756748: borrower credit 10,000 microNEAR, DAO credit 1,000; no escrow or pending transfers.
- [After one council vote](meteor-normal-single-vote.json), finalized block 276757496: proposal InProgress with one approval, borrower paid, DAO credit still 1,000 microNEAR.
- [Final receipt report](meteor-normal-final.json), finalized block 276757706: proposal Approved with two named voters, all eight transactions verified, zero outstanding principal.
- [Baseline before booking](meteor-normal-baseline.json), [transaction hash list](meteor-normal-receipts.json), and [final browser screenshot](meteor-normal-final.jpg).

## Recheck without a wallet

From the repository root, after installing dependencies:

```powershell
node scripts/capture-meteor-normal.mjs final
npm run verify:testnet
```

The first command reads public RPC only and verifies this exact normal-return run; it overwrites meteor-normal-final.json with a fresh report. It intentionally asserts the recorded final balances and reputation, so a later borrowing cycle can make those current-state assertions fail without invalidating historical transaction receipts. The settled and single-vote files are historical captures; do not rerun those capture stages after advancing the flow. The second command independently verifies the existing eleven-transaction dispute run (booking #4); it passed all 27 checks again after this normal-return run.

## Rehearsal boundaries

Testnet only. Both council accounts are controlled by the same demo operator, so two distinct on-chain signers do not demonstrate independent human governance. The pickup and return files are synthetic test fixtures, not proof of physical equipment custody. No private keys or wallet passwords are included in these reports. All eight writes used Meteor; RPC was used only to inspect and verify.

The initial reserve request became stale while its Meteor popup was locked and subsequently showed a wallet publishing error. No new booking or receipt was confirmed in the app; finalized state was checked before retrying with a fresh pickup time. The successful reserve popup closed before its approval click was observed by automation; its exact signed transaction and final booking were independently verified. The remaining seven approvals were reviewed and signed through Meteor UI.

This normal-return evidence is separate from the [dispute rehearsal](METEOR-POLISHED-REHEARSAL.md) and the [19 targeted sandbox failure tests](../CONTRACT-FAILURE-TESTS.md). The deployed frontend and production contract were not changed by this rehearsal.
