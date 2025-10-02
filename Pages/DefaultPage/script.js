import { DICCCHOPS_VERSION, DICCCHOPS_AD_TEXT, DICCCHOPS_AD_LINK, DICCCHOPS_AD_LINK_TEXT } from '/Info.js';

// Dynamically load multiple HTMLs into #section-component
const sectionFiles = [
  '/Components/Section/Section.html',
  '/sections/About/about.html',
  
  '/sections/Lorem/lorem.html',


  
  '/sections/Contact/contact.html'
  
];

function loadSections() {
  const container = document.getElementById('section-component');
  if (!container) return;
  container.innerHTML = '';
  sectionFiles.forEach((file, idx) => {
    fetch(file)
      .then(res => res.text())
      .then(html => {
        const wrapper = document.createElement('div');
        wrapper.className = 'section-wrapper';
        wrapper.innerHTML = html;
        wrapper.dataset.sectionIdx = idx;
        wrapper.addEventListener('click', function (e) {
          if (!wrapper.classList.contains('enlarged')) {
            document.querySelectorAll('.section-wrapper.enlarged').forEach(el => el.classList.remove('enlarged'));
            wrapper.classList.add('enlarged');
            document.body.classList.add('section-enlarged-active');
            // Trap focus and scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
        container.appendChild(wrapper);
      });
  });
}

window.addEventListener('DOMContentLoaded', function () {
  // Dynamically load the Header component
  fetch('/Components/Header/Header.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('header').innerHTML = html;
    });

  loadSections();

  // Load AdCard component
  fetch('/Components/AdCard/AdCard.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('adcard-component').innerHTML = html;
      // Update ad section with version and info from Info.js
      const adCard = document.querySelector('.ad-card');
      if (adCard) {
        adCard.querySelector('.cta-text').textContent = DICCCHOPS_VERSION;
        adCard.querySelector('p').innerHTML = `${DICCCHOPS_AD_TEXT} <a href="${DICCCHOPS_AD_LINK}" class="ad-link">${DICCCHOPS_AD_LINK_TEXT}</a>`;
      }
    });

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

// ESC to close enlarged section
window.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.section-wrapper.enlarged').forEach(el => el.classList.remove('enlarged'));
    document.body.classList.remove('section-enlarged-active');
  }
});
