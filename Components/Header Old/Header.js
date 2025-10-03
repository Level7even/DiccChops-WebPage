// Example: Header-specific JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Remove nav.main-nav if on MainPage
  if (document.body.getAttribute('data-mainpage') === 'true') {
    var nav = document.querySelector('.main-nav');
    if (nav) nav.remove();
  }

  // Dropdown toggle for Quick Scroll
  const quickScrollToggle = document.querySelector('.quick-scroll-toggle');
  const quickScrollMenu = document.querySelector('.quick-scroll-menu');
  if (quickScrollToggle && quickScrollMenu) {
    quickScrollToggle.addEventListener('click', function(e) {
      e.preventDefault();
      quickScrollMenu.style.display = quickScrollMenu.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', function(e) {
      if (!quickScrollToggle.contains(e.target) && !quickScrollMenu.contains(e.target)) {
        quickScrollMenu.style.display = 'none';
      }
    });
  }
});

// Expose a function to remove nav.main-nav if on MainPage
window.removeHeaderNav = function() {
  if (document.body.getAttribute('data-mainpage') === 'true') {
    var nav = document.querySelector('.main-nav');
    if (nav) nav.remove();
  }
};

// Version update logic
window.addEventListener('DOMContentLoaded', () => {
  const versionEl = document.getElementById('version-text');
  if (versionEl && window.DICCCHOPS_VERSION) {
    versionEl.textContent = ` ${window.DICCCHOPS_VERSION}`;
  }
});
