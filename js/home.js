// home.js - Handles interactions for the home page
document.addEventListener('DOMContentLoaded', () => {
  const ctaBtn = document.querySelector('.cta-btn');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      alert('Welcome! Let\'s get started with DiccChops.');
      // Could navigate to another page or perform an action
    });
  }
});
