import { DICCCHOPS_VERSION, DICCCHOPS_AD_TEXT, DICCCHOPS_AD_LINK, DICCCHOPS_AD_LINK_TEXT } from '/Info.js';

// Dynamically load multiple HTMLs into #section-component
const sectionFiles = [
  '/Components/Section/Section.html',
  '/sections/About/about.html',
  '/sections/Lorem/lorem.html',
  '/sections/Newsletter/newsletter.html',
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
          // Remove any existing overlays
          let overlay = document.getElementById('enlarged-container');
          if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'enlarged-container';
            document.body.appendChild(overlay);
          }
          overlay.innerHTML = '';
          overlay.style.display = 'flex';
          overlay.style.position = 'fixed';
          overlay.style.top = '0';
          overlay.style.left = '0';
          overlay.style.width = '100vw';
          overlay.style.height = '100vh';
          overlay.style.background = 'rgba(20,20,40,0.98)';
          overlay.style.zIndex = '10010';
          overlay.style.alignItems = 'center';
          overlay.style.justifyContent = 'center';
          overlay.style.overflow = 'auto';
          overlay.style.padding = '0';
          overlay.style.margin = '0';
          overlay.style.right = '0';
          overlay.style.bottom = '0';

          // Clone the section's HTML
          const mainSection = wrapper.querySelector('.main-section, .main-section-cube, .section-content');
          const content = document.createElement('div');
          content.className = 'enlarged-html-content';
          if (mainSection) {
            content.innerHTML = mainSection.outerHTML;
            content.style.margin = '0 auto';
            content.style.display = 'flex';
            content.style.flexDirection = 'column';
            content.style.alignItems = 'center';
            content.style.justifyContent = 'center';
            content.style.maxWidth = '900px';
            content.style.width = '100%';
            content.style.background = 'rgba(24,28,43,0.98)';
            content.style.borderRadius = '16px';
            content.style.boxShadow = '0 4px 32px rgba(0,255,255,0.10)';
            content.style.padding = '32px 20px';
          } else {
            content.innerHTML = wrapper.innerHTML;
          }
          overlay.appendChild(content);

          overlay.addEventListener('click', function closeOverlay(ev) {
            if (ev.target === overlay) {
              overlay.style.display = 'none';
              overlay.innerHTML = '';
              document.body.classList.remove('section-enlarged-active');
              overlay.removeEventListener('click', closeOverlay);
            }
          });
          document.body.classList.add('section-enlarged-active');
          // ESC to close
          function escHandler(e) {
            if (e.key === 'Escape') {
              overlay.style.display = 'none';
              overlay.innerHTML = '';
              document.body.classList.remove('section-enlarged-active');
              document.removeEventListener('keydown', escHandler);
            }
          }
          document.addEventListener('keydown', escHandler);
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
