# Vercel deployment preparation

**Prepared, not deployed to Vercel.** The current live demo remains https://commonkit-testnet.muthukumarank.chatgpt.site. The owner requested configuration only for Vercel.

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

Open http://127.0.0.1:4318, `/demo-guide.html`, `/deployment.json` and `/evidence/pickup.txt`. The build check requires all demo assets, a testnet configuration and absence of private-key values/development-wallet code in the static output. Production writes still require the user's browser wallet.

`.vercelignore` allows only frontend build inputs for CLI uploads, excluding `.testnet`, local artifacts, research, screenshots, contract sources and the separate Sites checkout. The GitHub repository still contains contract sources and public validation evidence for review. No secret is required on Vercel.

## After an authorized future deployment

- Confirm the resulting URL loads live library and DAO state.
- Open the guide and fixture links, including direct URL loads.
- Connect Meteor on the **new Vercel origin**; a connection to the existing Sites origin does not automatically authorize the new origin. Verify account and contract IDs in every wallet prompt.
- Test cancellation and one complete authorized testnet transaction before using the new URL in the recorded demo.
- Check Vercel's deployment access controls: judges must be able to open the selected demo URL without a team login. Keep source/log exposure private; website access and repository visibility are different settings.
- Keep the existing working demo available until the new origin is verified. Do not deploy a development server or enable `VITE_DEV_WALLET` on a hosted service.

References: [Vercel configuration](https://vercel.com/docs/project-configuration/vercel-json), [upload exclusions](https://vercel.com/docs/deployments/vercel-ignore), [Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
