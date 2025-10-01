// Quick Scroll Dropdown toggle and close logic
// (Add more nav-specific JS as needed)
document.addEventListener('DOMContentLoaded', function() {
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
