// Main entry point for the webpage
window.addEventListener('DOMContentLoaded', async () => {
  // Dynamically import sidebar script
  const sidebarScript = document.createElement('script');
  sidebarScript.src = './js/sidebar.js';
  sidebarScript.onload = () => {
    if (typeof loadSidebar === 'function') loadSidebar();
  };
  document.body.appendChild(sidebarScript); // ✅ Fixed: correct variable name

});
  