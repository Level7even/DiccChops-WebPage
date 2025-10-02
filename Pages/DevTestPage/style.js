// Dynamically load the header component into #header
window.addEventListener('DOMContentLoaded', function () {
  const headerContainer = document.getElementById('header');
  fetch('/Components/Header/Header.html')
    .then(res => res.text())
    .then(html => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      // Find the header element (could be <header> or .site-header)
      const loadedHeader = tempDiv.querySelector('header, .site-header');
      if (loadedHeader) loadedHeader.id = 'header';
      headerContainer.outerHTML = tempDiv.innerHTML;
      setTimeout(() => {
        const nav = document.querySelector('.main-nav');
        if (nav) nav.remove();
      }, 0);
    })
    .catch(() => {
      headerContainer.style.display = 'none';
    });
});

// Hide header on scroll down, show on scroll up
window.addEventListener('DOMContentLoaded', function () {
  let lastScrollY = window.scrollY;
  let ticking = false;
  function onScroll() {
    const header = document.getElementById('header');
    if (!header) return;
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > lastScrollY && window.scrollY > 80) {
          header.classList.add('header-hidden');
        } else {
          header.classList.remove('header-hidden');
        }
        lastScrollY = window.scrollY;
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll);
});

// Utility to load HTML fragments into a container by selector and file path
function loadHTMLFragment(containerSelector, filePath) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  fetch(filePath)
    .then(res => res.text())
    .then(html => {
      // Remove <link> tags to avoid duplicate CSS loads
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      // Optionally, move <link> tags to <head> if needed
      tempDiv.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        if (!document.head.querySelector(`link[href='${link.href}']`)) {
          document.head.appendChild(link.cloneNode());
        }
        link.remove();
      });
      container.innerHTML = tempDiv.innerHTML;
    });
}

// Utility to load HTML fragments into a container by selector and file path (QuickFeed style)
function loadSection(containerSelector, sectionPath) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  // Clear previous content and set styles to ensure growth
  container.innerHTML = '';
  container.style.minHeight = 'unset';
  container.style.height = 'auto';
  container.style.overflow = 'visible';
  container.style.display = 'block';
  container.style.boxSizing = 'border-box';
  fetch(sectionPath)
    .then(res => res.text())
    .then(html => {
      const sectionDiv = document.createElement('div');
      sectionDiv.className = 'main-section-cube';
      sectionDiv.style.minHeight = 'unset';
      sectionDiv.style.height = 'auto';
      sectionDiv.style.overflow = 'visible';
      sectionDiv.style.display = 'block';
      
      sectionDiv.innerHTML = html;
      container.appendChild(sectionDiv);
    })
    .catch(() => {
      const sectionDiv = document.createElement('div');
      sectionDiv.className = 'main-section-cube';
      sectionDiv.innerHTML = `<div style='color:#ff0080'>Failed to load ${sectionPath}</div>`;
      container.appendChild(sectionDiv);
    });
}

// Load About section in DevTestPage (QuickFeed style)
window.addEventListener('DOMContentLoaded', function () {
  const PageHtml = document.querySelector('.PageHtml');
  if (PageHtml) {
    PageHtml.innerHTML = '';
    PageHtml.style.minHeight = 'unset';
    PageHtml.style.height = 'auto';
    PageHtml.style.overflow = 'visible';
    PageHtml.style.display = 'block';
    PageHtml.style.boxSizing = 'border-box';
    loadSection('.PageHtml', '../../sections/Lorem/lorem.html');
  }
});

