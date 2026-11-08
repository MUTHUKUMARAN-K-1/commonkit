# CommonKit design preview

An interactive, responsive design study for the equipment library, booking journey and council decision cards. This folder is separate from the production app.

Open `showcase.html` through a local HTTP server to compare the 1440px desktop and 390px mobile designs. The current preview is at `http://127.0.0.1:4324/showcase.html`.

To restart the preview later, run this from the repository root and leave the terminal open:

```powershell
python -m http.server 4324 --bind 127.0.0.1 --directory designs/commonkit-next
```

Then open the preview URL above. This serves only the design folder on your own computer.

Direct screens:

- `index.html#library`: search/filter equipment and open the reservation review drawer.
- `index.html#bookings`: switch preview roles, advance sample booking stages, compare normal/disputed returns and try a local evidence fingerprint.
- `index.html#council`: preview the second council approval, then separately confirm sample execution. A treasury withdrawal has its own two-vote sequence.

## Interaction and motion

Original HTML/CSS/JavaScript implementation, using native CSS transitions and the Web Animations API. These patterns are informed by the requested quality of 21st.dev components and the [Motion JavaScript design patterns](https://motion.dev/docs/quick-start), but no third-party component source was copied or dependency installed. DM Sans and Instrument Serif fonts load through Google Fonts; fallback fonts remain usable offline.

The interface uses short panel fades, selected-navigation transitions, equipment hover movement, an advancing booking timeline, and a vote-progress transition. The CSS respects `prefers-reduced-motion`. Native dialog supplies modal focus containment and Escape closing; closing restores the previous trigger.

## Data and boundaries

All in-preview state is simulated and resets on reload. It does not connect a wallet, submit a proposal, sign a transaction, or publish a file. Real public proof is available through the explicitly labeled Live proof links.

The camera fee (.001 NEAR), refundable bond (.01 NEAR), retained storage (.1 NEAR), normal return and dispute allocation examples mirror CommonKit's recorded testnet scenarios. Timeline controls deliberately show alternative sample stages rather than claiming those historical bookings are currently open. A selected evidence file is hashed locally and never uploaded.

`assets/camera.png` is an AI-generated illustrative studio photograph, not evidence of the actual community asset or its physical condition. Generated for this preview; no external stock photography was used.

The production integration and live Meteor rehearsals are complete in `app/`; see [validation evidence](../../docs/testnet/cobalt/README.md). This folder remains the original simulated design study. Publication of the new production UI remains pending.
