# Vercel deployment

**Deployed on 8 November; updated and rehearsed on 9 November 2026.** Production: https://commonkit-testnet.vercel.app. The owner authorized public deployment while keeping GitHub private. Vercel reported the production release ready and assigned this alias.

The polished UI and `/judge.html` tour are included. The tour loaded publicly and completed playback in the in-app browser; the 9 November release also fixes the playback note after seeking or replaying. **Both fresh Vercel-origin Meteor cycles completed:** normal return #10 (8 transactions / 21 checks) and dispute #11 (11 transactions / 27 checks). Both payouts are verified and the final principal ledger has zero escrow, credit and pending transfers. The owner handled Meteor Connect/Approve prompts after popup automation stalled. See [the complete receipt evidence](testnet/vercel/README.md).

Rehearsed deployment: `dpl_7C6wEoq78K1NJLNWQJPp8n71oCmH`, source commit `73211f673389c21d564af37a13ab3916ca709ec1` ([deployment inspection](https://vercel.com/muthukumaran-k-1s-projects/commonkit-testnet/7C6wEoq78K1NJLNWQJPp8n71oCmH), team access required). The earlier 8 November release was `dpl_3rxRQ9yWhRbCXSnsEtsmZL6JFVgf`. Later documentation/evidence commits may create equivalent frontend deployments; the rehearsal metadata pins the actual release tested.

## Import settings

1. In Vercel, import `MUTHUKUMARAN-K-1/commonkit` using an account allowed to access this private repository.
2. Choose the **repository root** as Root Directory. `package.json` and `vercel.json` live there; do not choose `app/` or the excluded local `hosting/` checkout.
3. Use the settings below. No contract key, wallet secret, API token or environment variable belongs in this frontend build.

| Setting | Value |
| --- | --- |
| Framework | Vite |
| Node.js | 24.x (package engines / `.nvmrc`) |
| Install command | `npm ci` |
| Build command | `npm run build:vercel` |
| Output directory | `dist` |
| Environment variables | None |
| Production branch | `main` |

`vercel.json` defines the build and output settings and disables caching of the public deployment identifiers. The frontend uses `app/public/deployment.json`, public testnet RPC, and Meteor/NEAR Connect. There is no backend or serverless signing function. `npm start` runs the old local simulator and is not a Vercel start command.

## Local verification

```sh
npm ci
npm test
npm run build:vercel
npm run preview
```

Open http://127.0.0.1:4318, `/judge.html`, `/verify.html`, `/demo-guide.html`, `/deployment.json` and `/evidence/pickup.txt`. The build check requires all demo assets, a testnet configuration and absence of private-key values/development-wallet code in the static output. Production writes still require the user's browser wallet.

`.vercelignore` allows only frontend build inputs for CLI uploads, excluding `.testnet`, local artifacts, research, screenshots, contract sources and the separate Sites checkout. The GitHub repository still contains contract sources and public validation evidence for review. No secret is required on Vercel.

## Public-origin validation and limits

- The public URL loaded live library and DAO state, connected all three Meteor testnet identities, and completed both signed borrowing outcomes.
- Both council votes, separate treasury withdrawals and borrower withdrawals were verified through finalized public receipts. The first-vote checkpoints were saved before the second votes.
- Public verification and the 60-second tour select Vercel bookings #10/#11. Browser and CLI use the same manifests; original #4/#5 cases remain archived.
- These runs used desktop Chrome with manual wallet approvals. They do not establish physical-phone signing, a real equipment pilot or a fresh cancellation scenario.
- Keep the demo accessible without a Vercel team login. Repository visibility remains private until the owner separately authorizes publication.
- Never deploy a development signer or enable `VITE_DEV_WALLET` on a hosted service.

References: [Vercel configuration](https://vercel.com/docs/project-configuration/vercel-json), [upload exclusions](https://vercel.com/docs/deployments/vercel-ignore), [Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
