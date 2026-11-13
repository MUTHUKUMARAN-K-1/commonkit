# CommonKit judge handoff — 13 November 2026

**Prepared, not submitted. Repository remains private.** The owner confirmed
CommonKit is their only entry and no X post/application has been published.
The owner is arranging an independent first-time tester; results are pending.

## Improvements delivered

- `/recorded.html`: a static, dated camera story with both completed outcomes,
  separate borrower/DAO payout links, all 19 transaction links, one-vote and
  two-vote checkpoints, provenance and explicit trust limits.
- No JavaScript or RPC requests are needed to read that page. It is generated
  from the existing manifests and snapshots by `npm run build:recorded` (also
  part of every production build). Historical results never replace fresh checks.
- The library's two onboarding outcomes and the tour lead to recorded proof.
  The live verifier offers the same route when RPC is unavailable. Its fonts are
  now self-hosted. Transaction logic, wallet signing and contract behavior are unchanged.
- The 60-second tour foregrounds the camera, distinct roles, normal refund,
  disputed allocation and fee returning to the community treasury.
- `/film.html`: captioned player, transcript summary and MP4 download for the
  existing 75-second film. The master is reused unchanged, with its original
  10 November capture dates and #10/#11 evidence. It is separate from the
  interactive 60-second tour and does not show mobile reservation #13.
- [Post draft](DEMO-POST-DRAFT.md), [media handoff](submission-media/README.md),
  [tester sheet](INDEPENDENT-TEST.md), README and submission guide updated.

## Validation

- All 94 JavaScript tests pass, including refusal to substitute historical data
  for missing RPC evidence and receipt/withdrawal failure cases.
- Local production build and Vercel build pass the 81-file artifact check.
  The CLI upload allowlist includes the new recorded-page generator.
- Desktop 1440 × 1000 and responsive 390 × 844 checks inspect both recorded
  outcomes without JavaScript and with all external requests blocked. Amounts,
  dated disclosures, expandable 8/11 transaction lists and local evidence links work.
- Simulated RPC failure for both flows produces incomplete verification. Only
  the local manifest-consistency check passes; no chain check does. The recorded
  route remains accessible. This is a controlled outage test, not an uptime claim.
- All six tour chapters and reduced-motion layouts are checked at both widths.
- Film metadata/playback works at both widths: 75 seconds, 1920 × 1080, 30 fps,
  H.264/AAC, 48 kHz stereo. Full local decode reports no errors. Encoded frame
  montage and narration/transcript records were reviewed; no new human listening
  review is claimed. Caption timings come from the source narration.
- No new wallet signatures, contract deployment or fresh chain proof run was
  required. The latest dated full proof results remain the November 12 reports.
- [Browser evidence and screenshots](testnet/judge-handoff-2026-11-13/README.md).

Film SHA-256:
`41da4be3762c11ed6073deb0b8fc37b78a64f0d75d0e793e26ca2f3a449936c1`.

Production deployment: `dpl_iXeHZRWFCQubLiniwsuQUFodupiS`,
https://commonkit-testnet-cdry8kg53-muthukumaran-k-1s-projects.vercel.app,
aliased to https://commonkit-testnet.vercel.app.

## Human handoff still required

1. Independent tester completes the five-minute tasks; record actual findings.
2. Owner supplies lead name, email, team-size category and mainnet payout account.
3. Owner reviews source and explicitly authorizes repository publication.
4. Human watches the film and publishes the X post with attached media; provide
   the public post URL. Hosting the film does not publish an X post.
5. Obtain contact-notice consent and approval of the exact final application.
   No payload with invented values has been created and no application sent.

Official rules rechecked 13 November:
https://nearhackathon.com/HACKATHON.md. Public source and submission deadline:
**14 November, 23:59 UTC / 15 November, 05:29 IST**. Testnet remains eligible;
the prize payout identity is separately required on mainnet. Keep the demo up
through 18 November, ideally 25 November. Recheck the rules before submitting.
