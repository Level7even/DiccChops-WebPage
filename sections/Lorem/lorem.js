
window.addEventListener('DOMContentLoaded', function () {
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
