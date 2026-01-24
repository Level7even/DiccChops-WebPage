// Dynamically load HTML components into the main page
async function loadComponent(selector, url) {
  const el = document.querySelector(selector);
  if (!el) return;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load ' + url);
    const html = await res.text();
    el.innerHTML = html;
  } catch (err) {
    el.innerHTML = '<div style="color:#e63946;">Failed to load component: ' + url + '</div>';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadComponent('#services', 'components/ServicesSection.html');
  loadComponent('#contract-types', 'components/ContractTypesSection.html');
  loadComponent('#session-availability', 'components/SessionAvailabilitySection.html');
  loadComponent('#engagement-tiers', 'components/EngagementTiersSection.html');
  loadComponent('#api-integration', 'components/ApiIntegrationSection.html').then(() => {
    if (window.initArcApiSection) window.initArcApiSection();
  });
  loadComponent('#disclaimer', 'components/DisclaimerSection.html');
});
