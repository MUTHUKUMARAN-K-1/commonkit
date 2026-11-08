# DAO and browser-wallet validation

## Public demo with Meteor Web

Live URL: https://commonkit-testnet.muthukumarank.chatgpt.site

[Demo instructions](https://commonkit-testnet.muthukumarank.chatgpt.site/demo-guide.html) cover wallet roles, account switching, borrowing, disputes and withdrawals. All three authorized testnet development accounts were imported into Meteor Web in Chrome, with the wallet password entered privately by the user.

Booking #3 completed through the public site using Meteor: reserve → pickup → request return → dispute → settlement proposal #4 → two council votes → Closed. The first vote left 0.011 NEAR escrowed with no credits. The second credited 0.007 NEAR to the borrower and 0.004 NEAR to the DAO. Treasury proposal #5 received both votes and transferred the DAO credit; the borrower also withdrew. All 11 transactions were confirmed using final testnet RPC outcomes and checked for receipt failures. No CLI signing was used for this cycle.

Evidence: `meteor-single-vote.json`, `meteor-settled.json`, `meteor-final.json`, `meteor-receipts.txt`, `meteor-reserve-review.jpg`, `meteor-final.jpg`, and `frontend-deployment.json`. The cumulative ledger across all three bookings is 0.033 NEAR deposited and withdrawn, with zero escrow, credits or pending transfers. Normal return was previously tested with the dedicated local browser wallet; the Meteor run exercised the disputed return path.

The production archive was scanned for the local test keys and development key endpoint; neither is included. Eight JavaScript tests and the production build passed. The public source checkout is `hosting/`, and only its static `dist/` output is deployed. The application stores public transaction metadata, not wallet private keys.

The active deployment is a real Sputnik DAO with a two-account council. Both approvals are required (`RoleWeight`, quorum 2, threshold 2). The CommonKit contract's authority is the DAO account; individual council members cannot directly execute privileged library methods. The fresh library was deployed without an access key.

- Library: `library.ckdao-mw7e25at.testnet`
- DAO: `ckdao-mw7e25at.sputnikv2.testnet`
- Council 1: `commonkit-mw7dph80.testnet`
- Council 2 / custodian: `custodian.commonkit-mw7dph80.testnet`
- Borrower: `borrower.commonkit-mw7dph80.testnet`

These are development accounts controlled by this local test setup. The demonstration establishes on-chain threshold enforcement, not independent human governance. Production governance would require independently controlled council wallets and an appropriate conflict-of-interest policy.

## Running the app

`npm run dev` runs the standard browser-wallet frontend.

`npm run dev:wallet` runs the explicitly opt-in local development wallet at http://127.0.0.1:4320. Select Development wallet, choose an account, inspect each transaction, and approve or reject it. Keys are read from ignored `.testnet/accounts.json`, delivered only to the loopback wallet origin, and held in browser memory; they are not stored in browser storage. Signing occurs in the browser with real testnet RPC submissions. Only public transaction metadata is persisted. The earlier `browser-*.json` evidence uses this dedicated local wallet; `meteor-*.json` records the later third-party wallet test.

The key endpoint rejects GET, missing Origin and foreign Origin requests. It does not exist in the production preview server. The wallet module is excluded from production builds. Never deploy the development server publicly or use these keys for mainnet. Stop the dev server when finished.

## Voting

Council members submit proposals through the administration forms. The UI reads the actual proposal bond (0.01 NEAR), shows the exact target/method/arguments and records each vote. One vote leaves a proposal `InProgress`. The second vote calls CommonKit from the DAO. Proposal approval is checked alongside the resulting library state and execution receipts.

Membership and registration bootstrap: `npm run setup:dao`. Deployment: `npm run deploy:dao`. The legacy single-controller script refuses to overwrite an active DAO configuration.

## Evidence

- `dao-deployment.json`: actual factory creation and library deployment receipts, plus policy.
- `dao-bootstrap.json`: membership/registration proposals and both council votes.
- `browser-single-vote.json`: booking still Disputed, one approval, 0.011 NEAR escrowed, zero credits.
- `browser-settled.json`: booking Closed, 0.003 NEAR damage, 0.007 borrower credit and 0.004 DAO credit.
- `dao-authorization-negative.json`: direct borrower resolution rejected without changing state.
- `dev-wallet-boundary.json`: rejected unauthorized endpoint request patterns.
- `browser-final.json`: passing final assertions for both borrowing cycles and all withdrawals. Both bookings are Closed; 0.022 NEAR principal deposited and withdrawn; escrow, credits and pending transfers are zero. Retained storage charges and gas are outside this principal ledger.
- `browser-receipts.txt`: all 16 browser-signed transaction hashes, including proposal submission, individual council votes and withdrawals.
- `browser-final.jpg`: captured browser state after final withdrawal.

Evidence files under `evidence/` are explicitly labeled test fixtures. They exercise hashing and binding; no physical pickup, damage or return is claimed.

## Meteor browser-wallet evidence and frontend polish

The later public-site Meteor Web run is recorded in `meteor-single-vote.json`, `meteor-settled.json`, `meteor-final.json`, and `meteor-receipts.txt`. It used 11 real browser-signed transactions for booking #3, including both settlement votes, both treasury withdrawal votes and the borrower withdrawal. The cumulative principal ledger reached 0.033 NEAR deposited and withdrawn, with zero escrow, available credits and pending transfers. The normal-return flow in booking #2 used the earlier dedicated local browser wallet.

The subsequent hackathon frontend polish adds on-chain wallet roles, booking stages and next-actor guidance, individual council vote status, and historical settlement allocations distinct from current account credits. `polish-review-*.jpg` captures desktop and responsive review. This UI review reads existing testnet history; it does not claim another signing cycle. All 15 DAO, wallet receipt and presentation regression tests run with `npm test`.
