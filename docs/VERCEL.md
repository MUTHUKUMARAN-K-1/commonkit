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

## 12 November: public mobile reservation evidence

The public verifier now includes booking #13's 390 × 844 review screenshot,
public capture metadata and a six-check live reservation verifier. The tour's
reservation chapter links to it; the completed normal/dispute cases remain #10/#11.
Deep link: https://commonkit-testnet.vercel.app/verify.html#mobile-proof.

Deployment: `dpl_2iNGeugCBczysRsUU8bo8VHKH2mt`,
https://commonkit-testnet-js5j9esmk-muthukumaran-k-1s-projects.vercel.app,
aliased to https://commonkit-testnet.vercel.app.
The static build passed its 74-file production check. No wallet signer or keys
were added. See [public-page checks](testnet/mobile-booking-2026-11-12/public-pages/README.md).

## 12 November: final submission documentation check

The corrected demo guide is deployed as `dpl_Df1fBt5YyHuPEo4njNakRRnLJMr2`,
https://commonkit-testnet-abouiecln-muthukumaran-k-1s-projects.vercel.app,
aliased to the public demo. Application transaction code and its built JS/CSS
bundles are unchanged. The guide points to completed bookings #10/#11 and the
separate #13 mobile reservation, and explains that other active bookings can
leave nonzero escrow. [Final readiness review](SUBMISSION-CHECK-2026-11-12.md).

The final audit then found unavailable historical receipts on the free archive.
The verifier now shares a paced archive queue across proof panels while keeping
current-state reads independent and preserving UNVERIFIED on failure. This
follow-up is deployed as `dpl_FSLtFjLL8oW3mmuFnhM8AswaC6Gk`,
https://commonkit-testnet-44n52etzr-muthukumaran-k-1s-projects.vercel.app,
with the same public alias. The main app's wallet behavior is unchanged.

A one-second start gap still left the last dispute receipt unavailable. The final
conservative gap is 6.5 seconds; this is a courtesy pacing setting, not a claimed
provider quota. Current deployment: `dpl_Bch9VUbK8kDdJSKFzLmCr5zFu1BZ`,
https://commonkit-testnet-5d758plf4-muthukumaran-k-1s-projects.vercel.app.
The public alias remains https://commonkit-testnet.vercel.app. Provider outages
can still produce UNVERIFIED; the verifier never substitutes cached successes.

## 13 November: resilient judge reading path and media

Production `dpl_iXeHZRWFCQubLiniwsuQUFodupiS`, immutable URL
https://commonkit-testnet-cdry8kg53-muthukumaran-k-1s-projects.vercel.app,
aliased to https://commonkit-testnet.vercel.app.

Adds `/recorded.html` (dated outcomes without JavaScript/RPC), `/film.html`
(captioned 75-second existing product film), updated onboarding/tour links and
a recorded-evidence route from the live verifier. Both local and Vercel builds
pass the 81-file artifact check. Production browser checks cover 1440/390 widths,
blocked external network, explicit UNVERIFIED chain checks and media playback.
[Validation evidence](testnet/judge-handoff-2026-11-13/README.md).
No new wallet signatures were performed. GitHub remains private.

## 14 November: final pitch and real-app walkthrough

Production deployment `dpl_GaTMntwKKZ8uiT28QFrFD1gDLKTi`:
https://commonkit-testnet-cuu2urrp6-muthukumaran-k-1s-projects.vercel.app,
aliased to https://commonkit-testnet.vercel.app.

`/film.html` now serves the final 114.73-second portrait film with English
captions, chapter seeking, narration text and download. The library and judge
tour link to it. The dated 54-check report is published beside the media.
The 60-second interactive tour and wallet/contract behavior are unchanged.
The first upload failed with an API connection reset; the retry succeeded.
Both local and Vercel builds completed; local production check passed 87 files,
and all 94 JavaScript tests passed. Browser evidence is retained in
[testnet/final-film-2026-11-14](testnet/final-film-2026-11-14/README.md).
GitHub remains private; no X post or application was sent.

The final mobile-link follow-up is `dpl_4GsVXkmmaeMdWtxkUmnegrg3EU6M`,
https://commonkit-testnet-ohlcwhsqk-muthukumaran-k-1s-projects.vercel.app,
confirmed Ready and aliased to the public origin. The hero-side film link was
hidden by the existing mobile layout; the onboarding guide now exposes the film
at both widths. A CLI status connection reset did not interrupt this deployment;
`vercel inspect` confirmed completion.
