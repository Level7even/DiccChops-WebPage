// Dynamically load the HeaderV2 component into #header
window.addEventListener('DOMContentLoaded', function () {
  fetch('/Components/HeaderV2/HeaderV2.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('header').innerHTML = html;
    });
});
