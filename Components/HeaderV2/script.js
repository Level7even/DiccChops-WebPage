// Dynamically load Brand and Button components into the header
window.addEventListener('DOMContentLoaded', () => {
  // Load Brand
  fetch('/Components/Brand/Brand.html')
    .then(res => res.text())
    .then(html => {
      document.querySelector('.brand').innerHTML = html;
    });
  // Load Button
  fetch('/Components/Header V2/Comps/Buttons/HB.html')
    .then(res => res.text())
    .then(html => {
      document.querySelector('.button').innerHTML = html;
    });
});