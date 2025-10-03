
// Load header component and initialize header-related JS after it's loaded

document.addEventListener('DOMContentLoaded', function () {
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

        // Sidebar tab toggle logic
  const header = document.querySelector('.header-container');
  const tab = document.querySelector('.sidebar-tab');
  if (header && tab) {
    tab.addEventListener('click', () => {
      header.classList.toggle('collapsed');
    });
  }
    });

    // Initialize other page features
    updateCountdown();
    setInterval(updateCountdown, 1000);
    setTimeout(typeWriter, 1000);
    setTimeout(updateProgress, 2000);
    setTimeout(animateOnScroll, 1500);
    handleCTAClick();
    // Load starfield background
    const starsContainer = document.getElementById('stars-component') || document.body;
    fetch('/Components/Stars/Stars.html')
      .then(res => res.text())
      .then(html => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        document.querySelectorAll('.stars, .stars2, .stars3, .stars-bg').forEach(e => e.remove());
        Array.from(tempDiv.children).forEach(child => starsContainer.appendChild(child));
      });

});