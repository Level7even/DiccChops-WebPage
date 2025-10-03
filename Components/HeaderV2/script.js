// Dynamically load Brand and Button components into the header
window.addEventListener('DOMContentLoaded', () => {
  // Load Brand
  fetch('/Components/HeaderV2/Comps/Brand/Brand.html')
    .then(res => res.text())
    .then(html => {
      document.querySelector('.brand').innerHTML = html;
    });
  // Load Button
  fetch('/Components/HeaderV2/Comps/Buttons/HB.html')
    .then(res => res.text())
    .then(html => {
      document.querySelector('.button').innerHTML = html;
    });

  // Sidebar tab toggle logic
  const header = document.querySelector('.header-container');
  const tab = document.querySelector('.sidebar-tab');
  if (header && tab) {
    tab.addEventListener('click', () => {
      header.classList.toggle('collapsed');
    });
  }
});