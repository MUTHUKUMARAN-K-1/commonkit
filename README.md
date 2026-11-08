# CommonKit

A community equipment library: reserve a camera or projector, escrow a refundable bond, record pickup and return, and settle disputes through an existing DAO.

**Status: v0.1 local prototype, 7 November 2026.** Original Rust implementation, local web interface, and compiled draft NEAR contract. No public deployment, wallet signing, real payments, or NFT compliance is claimed. Primary intended track: Social Money. NFTs are a later target, conditional on implementing ownership controls.

## Run locally

Requires Rust/Cargo (built with Rust 1.99.1) and Node.js 22 or newer. No npm packages are needed to run the application or API tests.

```sh
cargo build -p commonkit-core --locked
npm start
```

Open http://127.0.0.1:4317. The server binds to loopback. All data is in memory and resets when the process stops. Actor buttons and account selectors simulate roles; they do not authenticate users. Evidence hashes in the demo are deterministic samples.

## Try the complete flow

1. Reserve the camera. Try a conflicting booking; it must be rejected.
2. Move the demo clock to pickup time, then confirm pickup as the custodian.
3. Request return as the borrower. Try borrower self-approval; it must be rejected.
4. Accept as custodian. The bond credits the borrower; the usage fee credits the DAO.
5. Simulate a withdrawal failure. Credit is restored. Retry and simulate success.
6. Make another booking, pick up, report damage, and settle as the DAO. Damages cannot exceed the bond.

The example DAO account and all assets are local fixtures. Reputation counts custodian-accepted returns; it is not proof of honesty and is not yet used for tiered borrowing privileges.

## Validate

```sh
cargo test -p commonkit-core --locked
npm test
npm run test:api
```

Observed: **14 Rust lifecycle tests, 3 DAO adapter tests, and the HTTP integration scenario passed**. The integration scenario covers reservation, overlap rejection, pickup, return authorization, settlement, failed withdrawal recovery, retry, origin rejection, and the HTML response.

Optional browser check (start the server separately):

```sh
npm install
npx playwright install chromium
npm run test:browser
```

The browser suite is supplied but **not validated in this environment**: local Chromium could not create its process socket (`Operation not permitted`), and the separate cloud browser could not reach the local server. No responsive-layout or screenshot pass is claimed. `CHROMIUM_PATH` can select an already installed Chromium binary.

## Draft NEAR contract

```sh
rustup target add wasm32-unknown-unknown
RUSTFLAGS='--cfg near' cargo build -p commonkit-contract --target wasm32-unknown-unknown --release --locked
```

The included `artifacts/commonkit_contract.wasm` compiled successfully. Compilation does not establish deployability or receipt-level correctness; NEAR sandbox execution, gas and storage profiling remain required. The contract shares the tested Rust state machine. It uses predecessor authorization and native NEAR transfers with private callbacks. There is no deployment script that creates fabricated receipts.

Amounts use integer microNEAR: one unit is 10^18 yoctoNEAR. A reservation requires exactly fee + bond + **100,000 microNEAR (0.1 NEAR) storage charge**. The storage charge is retained outside the principal ledger and is not refunded on cancellation. The local simulation excludes that charge. Storage fees are provisional until measured, and deployment needs an initially funded account.

An existing Sputnik DAO is the configured authority. `scripts/dao.mjs` constructs FunctionCall proposals and can read a testnet DAO policy. It does not submit proposals, vote, or sign. A real DAO and wallet round trip has not been executed.

## Boundaries and next milestones

- At most 32 assets, 64 currently admitted members and 256 lifetime booking records; no archival yet.
- A custodian acknowledges physical pickup/return. Hashes bind records, not physical truth. DAO votes decide contested damages.
- An overdue booking can escalate after 24 hours, but an inactive DAO can still leave funds unresolved.
- Custodian changes are blocked while any booking for that asset remains active, including future bookings.
- Implement wallet signing and sandbox receipt tests first; then deploy to testnet and verify the full lifecycle with independent accounts.
- Add equipment NFTs only with transfer guards, stale-authority revocation and transfer-call rollback tests. NFT ownership must not be presented as legal title to physical equipment.
- Mainnet is a later proof milestone, not an automatic judging advantage.

See `docs/THREAT-MODEL.md` for authority and accounting assumptions. Competitor findings and the track decision are provided in the accompanying review report.
