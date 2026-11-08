# CommonKit testnet threat model

The original local application is a simulation using the same Rust state machine as the contract. The current `app/` frontend uses real Meteor signatures, a deployed NEAR testnet contract and Sputnik DAO. See `testnet/METEOR-POLISHED-REHEARSAL.md` for the verified disputed-borrowing flow. All assets in this demonstration are testnet-only; no mainnet safety is claimed.

## Authority and trust

- An existing Sputnik DAO controls membership, equipment registration, custodian changes and dispute decisions. CommonKit is not a new multisig. Its frontend submits Sputnik FunctionCall proposals and votes through the browser wallet, verifies a two-of-two council policy and checks final receipts. Both demo council accounts are controlled by the same operator; account-level threshold enforcement is not independent human governance.
- Only an admitted borrower can reserve. The current custodian acknowledges pickup and return. Borrower and custodian cannot be the same account for a reservation.
- A condition hash binds the record being acknowledged. It cannot prove physical possession or truth. A colluding borrower and custodian can lie; the DAO remains the trusted dispute authority.
- A custodian can dispute a return but cannot take the bond. Only the DAO can assign damages, bounded by the bond. Damages and fees credit the DAO; subsequent repair payments use its existing treasury process.
- A missing custodian can block an inspected return. Anyone can escalate an overdue checkout after 24 hours; resolving the escrow still requires the DAO. We do not claim permissionless resolution of physical disputes.

## Money and concurrency

- Amounts use integer microNEAR (1 unit = 10^18 yoctoNEAR). The contract rejects deposits that do not exactly equal the reservation quote plus the disclosed storage charge. No floating point accounting.
- Overlapping active reservations are rejected; adjacent intervals are allowed. Each record has one terminal settlement. The current custodian cannot change while any reservation remains active.
- Pull withdrawals move credits into a pending nonce before sending. A private callback finalizes the payment or restores the credit. Duplicate callbacks have no effect. A missing callback leaves a pending balance; it must not be blindly retried.
- Conservation: deposited principal = active escrow + available credits + pending withdrawals + confirmed withdrawals.
- Admission and list sizes are bounded for this first implementation. Fixed storage charges are retained separately from escrow principal; the contract needs an initially funded storage balance. Storage economics and gas profiling need further sandbox verification before real-value deployment.

## Ownership and second track

This first slice implements custodian authority, not an NEP-171 NFT. The NFT milestone must make ownership changes invoke the same no-active-bookings guard, revoke stale authority, handle transfer-call rollback, and test concurrent payout/transfer behavior. Until then we do not claim NFT compliance or that CommonKit qualifies for the NFT prize.

## Before live funds

Real DAO proposals, wallet signing, testnet settlement and withdrawals have been demonstrated. The deployed Wasm hash and public evidence are recorded in `VALIDATION.json`. Before real-value use, still run sandbox receipt/callback failure tests, profile storage bounds and gas, establish independently controlled council accounts and a conflict-of-interest process, and review upgrade/recovery strategy. Core/local tests exercise failed-transfer credit restoration, but this is not a claim that every asynchronous failure was reproduced on public testnet.
