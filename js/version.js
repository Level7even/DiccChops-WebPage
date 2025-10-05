// Global version info
const APP_VERSION = "v1.3.2";

// Automatically inject version into any element with [data-version]
window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-version]').forEach(el => {
    el.textContent = APP_VERSION;
  });
});
