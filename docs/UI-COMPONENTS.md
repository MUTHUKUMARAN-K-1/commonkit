# CommonKit component sources

The production UI remains vanilla JavaScript, CSS and Vite. No React migration was introduced.

## Reused packages

| Package | Version | Use |
| --- | --- | --- |
| Motion | 14.10.1 | `motion/mini` animates route panels and native dialog entry using browser animation APIs |
| NumberFlow | 0.6.2 | Vanilla custom element animates equipment/member integer counts; financial values remain exact strings |
| Fontsource DM Sans | 5.3.0 | Self-hosted Latin body/control typography, weights 400–700 |
| Fontsource Instrument Serif | 5.3.0 | Self-hosted Latin italic display typography |

Package licenses and notices remain in the installed packages and are recorded in the lockfile dependency metadata. Motion and NumberFlow use MIT licenses; font license texts are copied into `app/public/licenses/` for distribution with the font assets.

## Design references and independent implementations

- [Animated Tabs by Julien Thibeaut / Motion Primitives on 21st.dev](https://21st.dev/@ibelick/components/animated-tabs): selected-state movement and restrained active navigation. CommonKit implements its own semantic route links and CSS states; no React component source was copied.
- [Transition Panel](https://21st.dev/@ibelick/components/transition-panel): staged booking review. CommonKit uses its own native form, immutable review values and Motion entry transition.
- [Morphing Dialog](https://21st.dev/@ibelick/components/morphing-dialog): focused equipment detail. CommonKit uses native `<dialog>` with Escape/focus behavior and a mobile bottom-sheet layout, rather than copying the React implementation.
- [Designeer resources](https://designeer.xyz/resources): discovery of NumberFlow and self-hosted typography resources.
- [Motion JavaScript](https://motion.dev/docs/quick-start) and [NumberFlow vanilla](https://number-flow.barvian.me/vanilla): actual library integration references.

MotionSites could not be loaded during research. No MotionSites source is included or claimed.

The camera illustration was generated for CommonKit's accepted design preview and is reused locally with an illustrative-image label. It is not evidence of an actual asset's condition. No remote stock photograph is loaded.

## Behavior

The follow-up polish uses Lucide for navigation, search, wallet and vote icons, with 18px SVG boxes and a 1.5 stroke. Its license is distributed in `app/public/licenses/lucide.txt`; the exact package version is pinned in `package.json` and the lockfile. The design method is credited to Unslop by Damir Sokolovsky (CC BY 4.0) in [the audit and report](UNSLOP-AUDIT.md).

Animation honors reduced motion. Route and dialog movement use short opacity/transform transitions. Balances, attached deposits and receipt values are never animated through intermediate numeric amounts. Native dialogs close before invoking Meteor's connector so they cannot cover the wallet chooser.
