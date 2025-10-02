// Dynamically load the Stars component into the page
export function loadStars(target = document.body) {
  fetch('/Components/Stars/Stars.html')
    .then(res => res.text())
    .then(html => {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      // Remove any existing stars to avoid duplicates
      document.querySelectorAll('.stars, .stars2, .stars3, .stars-bg').forEach(e => e.remove());
      // Add stars to the target (usually body)
      Array.from(temp.children).forEach(child => target.appendChild(child));
    })
    .catch(err => {
      // Fallback: create stars manually if fetch fails
      if (!document.querySelector('.stars')) {
        const bg = document.createElement('div');
        bg.className = 'stars-bg';
        bg.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:-2;background:#000;';
        target.appendChild(bg);
        ['stars','stars2','stars3'].forEach(cls => {
          const d = document.createElement('div');
          d.className = cls;
          target.appendChild(d);
        });
      }
    });
  // Add the CSS if not already present
  if (!document.querySelector('link[href$="/Components/Stars/Stars.css"]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/Components/Stars/Stars.css';
    document.head.appendChild(link);
  }
}
// If you want to auto-load on page load, uncomment below:
// window.addEventListener('DOMContentLoaded', () => loadStars());
