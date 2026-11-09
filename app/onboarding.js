import './onboarding.css';

const preferenceKey = 'commonkit.onboarding.v1';

// This guide only explains recorded flows. It never connects or signs for a wallet.
export function initOnboarding() {
  const guide = document.getElementById('getting-started');
  const choices = [...guide.querySelectorAll('[data-explore-flow]')];
  const panels = [...guide.querySelectorAll('[data-explore-panel]')];
  try { guide.open = localStorage.getItem(preferenceKey) !== 'collapsed'; } catch { guide.open = true; }
  guide.addEventListener('toggle', () => {
    try { localStorage.setItem(preferenceKey, guide.open ? 'open' : 'collapsed'); } catch { /* Browsing works without storage. */ }
  });
  for (const choice of choices) choice.addEventListener('click', () => {
    for (const button of choices) button.setAttribute('aria-pressed', String(button === choice));
    for (const panel of panels) panel.hidden = panel.dataset.explorePanel !== choice.dataset.exploreFlow;
  });
  document.getElementById('onboarding-browse').addEventListener('click', () => {
    guide.open = false;
    const equipmentSearch = document.getElementById('equipment-search');
    equipmentSearch.focus({preventScroll: true});
    equipmentSearch.scrollIntoView({block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  });
}
