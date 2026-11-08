# CommonKit v0.1 threat model

This is an original implementation started after competitor review on 7 November 2026. The local application is a simulation using the same Rust state machine as the contract. It creates no chain receipts and handles no real funds.

## Authority and trust

- An existing Sputnik DAO controls membership, equipment registration, custodian changes and dispute decisions. CommonKit is not a new multisig. The adapter constructs existing Sputnik FunctionCall proposals; DAO voting remains in Sputnik/Trezu.
- Only an admitted borrower can reserve. The current custodian acknowledges pickup and return. Borrower and custodian cannot be the same account for a reservation.
- A condition hash binds the record being acknowledged. It cannot prove physical possession or truth. A colluding borrower and custodian can lie; the DAO remains the trusted dispute authority.
- A custodian can dispute a return but cannot take the bond. Only the DAO can assign damages, bounded by the bond. Damages and fees credit the DAO; subsequent repair payments use its existing treasury process.
- A missing custodian can block an inspected return. Anyone can escalate an overdue checkout after 24 hours; resolving the escrow still requires the DAO. We do not claim permissionless resolution of physical disputes.

## Money and concurrency

- Amounts use integer microNEAR (1 unit = 10^18 yoctoNEAR). The contract rejects deposits that do not exactly equal the reservation quote plus the disclosed storage charge. No floating point accounting.
- Overlapping active reservations are rejected; adjacent intervals are allowed. Each record has one terminal settlement. The current custodian cannot change while any reservation remains active.
- Pull withdrawals move credits into a pending nonce before sending. A private callback finalizes the payment or restores the credit. Duplicate callbacks have no effect. A missing callback leaves a pending balance; it must not be blindly retried.
- Conservation: deposited principal = active escrow + available credits + pending withdrawals + confirmed withdrawals.
- Admission and list sizes are bounded for this first implementation. Fixed storage charges are retained separately from escrow principal; the contract needs an initially funded storage balance. Storage economics and gas profiling need sandbox verification before public deployment.

## Ownership and second track

This first slice implements custodian authority, not an NEP-171 NFT. The NFT milestone must make ownership changes invoke the same no-active-bookings guard, revoke stale authority, handle transfer-call rollback, and test concurrent payout/transfer behavior. Until then we do not claim NFT compliance or that CommonKit qualifies for the NFT prize.

## Before live funds

Run sandbox receipt/callback tests; verify a real DAO proposal and wallet flow; test storage bounds and gas; publish the deployed Wasm hash; record pickup, inspected return, dispute and failed-transfer recovery. No mainnet deployment is included in v0.1.
