// Dynamically load the HeaderV2 component into #header
window.addEventListener('DOMContentLoaded', function () {
  fetch('/Components/HeaderV2/HeaderV2.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('header').innerHTML = html;
      // After header loads, load the Brand into .brand
      const brandDiv = document.querySelector('.brand');
      if (brandDiv) {
        fetch('/Components/HeaderV2/Comps/Brand/Brand.html')
          .then(res => res.text())
          .then(brandHtml => {
            brandDiv.innerHTML = brandHtml;
          });
      }
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
