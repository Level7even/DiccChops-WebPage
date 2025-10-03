// Removed import { DICCCHOPS_VERSION, DICCCHOPS_AD_TEXT, DICCCHOPS_AD_LINK, DICCCHOPS_AD_LINK_TEXT } from '/Info.js';
// Use window.DICCCHOPS_VERSION, window.DICCCHOPS_AD_TEXT, etc. instead throughout this file.

// Dynamically load multiple HTMLs into #section-component
const sectionFiles = [
  '/sections/About/about.html',
  '/sections/Lorem/lorem.html',
  '/sections/Newsletter/newsletter.html',
  '/sections/Contact/contact.html'
  
];

async function loadSections() {
  const container = document.getElementById('section-component');
  if (!container) return;
  container.innerHTML = '';
  for (let idx = 0; idx < sectionFiles.length; idx++) {
    const file = sectionFiles[idx];
    const res = await fetch(file);
    const html = await res.text();
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
      overlay.style.height = '100vh';
      overlay.style.background = 'rgba(20,20,40,0.98)';
      overlay.style.zIndex = '10010';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.overflow = 'auto';
      overlay.style.padding = '0'; // Remove bottom padding so overlay fits viewport
      overlay.style.margin = '0';
      overlay.style.right = '0';
      overlay.style.bottom = '0';
      overlay.style.alignSelf = 'flex-start';

      // Clone the section's HTML
      const mainSection = wrapper.querySelector('.main-section, .main-section-cube, .section-content');
      const content = document.createElement('div');
      content.className = 'enlarged-html-content';
      content.style.maxWidth = '80%';
      content.style.width = '100%';
      content.style.margin = '0'; // Remove auto margin to prevent vertical centering
      content.style.display = 'flex';
      content.style.flexDirection = 'column';
      content.style.alignItems = 'center';
      //content.style.justifyContent = 'flex-start';
      content.style.background = 'rgba(24,28,43,0.98)';
      content.style.borderRadius = '16px';
      content.style.boxShadow = '0 4px 32px rgba(0,255,255,0.10)';
      content.style.padding = '32px 32px 32px 32px'; // Uniform padding, no extra bottom
      content.style.alignSelf = 'flex-start'; // Ensure content starts at the top

      // Add close button to overlay (not inside content)
      const closeBtn = document.createElement('button');
      closeBtn.className = 'enlarged-close-btn';
      closeBtn.innerHTML = '&times;';
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.addEventListener('click', function(ev) {
        overlay.style.display = 'none';
        overlay.innerHTML = '';
        document.body.classList.remove('section-enlarged-active');
      });
      overlay.appendChild(closeBtn);

      if (mainSection) {
        content.innerHTML = mainSection.outerHTML;
      } else {
        content.innerHTML = wrapper.innerHTML;
      }
      overlay.appendChild(content);

      // Scroll overlay content to top when opened
      setTimeout(() => {
        content.scrollTop = 0;
        overlay.scrollTop = 0;
      }, 0);

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
  }
}

document.addEventListener('DOMContentLoaded', function () {
   fetch('/Components/HeaderV2/HeaderV2.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('header').innerHTML = html;
      // After header loads, load the Brand into .brand
      const brandDiv = document.querySelector('.brand');
      if (brandDiv) {
        fetch('/Components/HeaderV2/Comps/Brand/Brand.html')
          .then(res => res.text())
          .then(brandHtml => {
            brandDiv.innerHTML = brandHtml;
          });
      }
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
        adCard.querySelector('.cta-text').textContent = window.DICCCHOPS_VERSION;
        adCard.querySelector('p').innerHTML = `${window.DICCCHOPS_AD_TEXT} <a href="${window.DICCCHOPS_AD_LINK}" class="ad-link">${window.DICCCHOPS_AD_LINK_TEXT}</a>`;
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

      // Sidebar tab toggle logic
  const header = document.querySelector('.header-container');
  const tab = document.querySelector('.sidebar-tab');
  if (header && tab) {
    tab.addEventListener('click', () => {
      header.classList.toggle('collapsed');
    });
  }
});

// ESC to close enlarged section
window.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    document.querySelectorAll('.section-wrapper.enlarged').forEach(el => el.classList.remove('enlarged'));
    document.body.classList.remove('section-enlarged-active');
  }
});
