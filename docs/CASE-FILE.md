# Public borrowing case files

Open the [dispute case](https://commonkit-testnet.vercel.app/verify.html?flow=dispute#case-file)
or the [normal return case](https://commonkit-testnet.vercel.app/verify.html?flow=normal#case-file).
The case file is part of the existing wallet-free verifier. It presents the recorded
Vercel rehearsals, not a new transaction-signing screen.

## What to inspect

For dispute booking #11, compare four files: pickup, return, the original damage
report and the council decision. Each card names the actor, links its transaction
and exposes the expected SHA-256 fingerprint. The original damage hash is read
from the `dispute` transaction claim. The final booking's `dispute_hash` holds the
decision hash after settlement; substituting it for the damage report would lose
the original claim.

Follow settlement proposal #16 through its first and second votes. The first-vote
checkpoint records the locked 0.011 testnet NEAR principal. The second executes
allocation of 0.007 borrower credit and 0.004 DAO credit. Treasury proposal #17
has its own approval sequence; actual payment checks establish the DAO and
borrower withdrawals. A saved checkpoint is labeled historical, and live receipt
statuses come only from the shared verification engine.

Normal booking #10 has pickup and return files, custodian acceptance, treasury
proposal #15 and the full 0.010 testnet NEAR bond refund. It has no damage report
or dispute settlement vote.

## File matching

Published fixtures are fetched from this site's static assets and hashed before
their text is displayed as matching evidence. To compare a file on your device,
choose it in the relevant evidence card. Its exact raw bytes are hashed locally
with Web Crypto. No selected filename, content or computed fingerprint is sent
to an endpoint or persisted by this feature. Files over 25 MiB are rejected.

A match establishes only equality with the published fingerprint. It does not
prove physical custody, equipment condition or the correctness of a council
decision. The existing synthetic fixtures were reused during the rehearsals;
they retain their original booking #1 (dispute) or #5 (normal) text. They are intentionally unchanged so
their bytes still match the recorded transaction arguments. Both demo council
accounts were controlled by the same operator.

## Implementation and validation

- [Case model](../app/public/verification/case-model.js): maps each recorded stage
  to its own fingerprint and receipt, validates claim consistency and hashes bytes.
- [Case UI](../app/public/verification/case-file.js): renders fixture text safely,
  handles local selection and displays fresh check statuses separately.
- [Regression tests](../scripts/case-file.test.mjs): real published fixtures,
  changed bytes, original-versus-decision evidence, cross-booking and divergent
  claims, allocation bounds, binary bytes and file size validation.

The verifier still runs 21 normal and 27 dispute checks. File matches are not
added to those counts. Contracts, accounting, wallet signatures and DAO authority
are unchanged.
