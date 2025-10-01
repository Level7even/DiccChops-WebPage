// Load header component dynamically
window.addEventListener('DOMContentLoaded', function () {
  const headerContainer = document.getElementById('header');
  fetch('/Components/Header/Header.html')
    .then(res => res.text())
    .then(html => {
      // Replace headerContainer with loaded HTML
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

  // Typing animation for subtitle
  const texts = [
    "Your fast updates, all in one place.",
    "Stay tuned for real-time news!",
    "Community and feeds coming soon!",
    "Dicc",
    "Chops",
    "Level 7even Studios!"
  ];
  let textIndex = 0;
  let charIndex = 0;
  const typingElement = document.querySelector('.typing-text');
  function type() {
    if (charIndex < texts[textIndex].length) {
      typingElement.textContent = texts[textIndex].substring(0, charIndex + 1);
      charIndex++;
      setTimeout(type, 100);
    } else {
      setTimeout(() => {
        charIndex = 0;
        textIndex = (textIndex + 1) % texts.length;
        typingElement.textContent = '';
        setTimeout(type, 500);
      }, 2000);
    }
  }
  type();

  // Animate feature cards on scroll
  const cards = document.querySelectorAll('.feature-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fadeInUp 0.6s ease forwards';
      }
    });
  });
  cards.forEach(card => observer.observe(card));

  // Add CSS animations dynamically
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);

  // Hide header on scroll down, show on scroll up
  let lastScrollY = window.scrollY;
  let ticking = false;
  const header = document.getElementById('header');
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > lastScrollY && window.scrollY > 80) {
          header.style.transform = 'translateY(-120%)';
          header.style.transition = 'transform 0.4s cubic-bezier(.4,0,.2,1)';
        } else {
          header.style.transform = 'translateY(0)';
          header.style.transition = 'transform 0.4s cubic-bezier(.4,0,.2,1)';
        }
        lastScrollY = window.scrollY;
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener('scroll', onScroll);

  // Dynamically load section components from /sections/ into .sections-container
  function loadSections(sectionList) {
    const container = document.querySelector('.sections-container');
    if (!container) return;
    sectionList.forEach(section => {
      fetch(`/sections/${section}`)
        .then(res => res.text())
        .then(html => {
          const sectionDiv = document.createElement('div');
          sectionDiv.className = 'main-section-cube';
          sectionDiv.innerHTML = html;
          container.appendChild(sectionDiv);
        })
        .catch(() => {
          const sectionDiv = document.createElement('div');
          sectionDiv.className = 'main-section-cube';
          sectionDiv.innerHTML = `<div style='color:#ff0080'>Failed to load ${section}</div>`;
          container.appendChild(sectionDiv);
        });
    });
  }
  // Load sections with correct relative paths
  loadSections(['About/about.html', 'Lorem/lorem.html', 'Contact/contact.html', 'Newsletter/newsletter.html']);

  // Section enlarge on click (centered grow effect)
  document.addEventListener('click', function (e) {
    const section = e.target.closest('.main-section-cube');
    if (!section) return;
    e.preventDefault();
    e.stopPropagation();
    const enlargedContainer = document.getElementById('enlarged-container');
    const sectionsContainer = document.querySelector('.sections-container');
    if (!section.classList.contains('enlarged')) {
      // Store original parent and next sibling for restoration
      section._originalParent = section.parentNode;
      section._originalNext = section.nextSibling;
      // Animate scale up in place
      section.classList.add('enlarging');
      section.style.zIndex = '10000';
      section.style.transition = 'transform 0.6s cubic-bezier(.4,0,.2,1), box-shadow 0.6s cubic-bezier(.4,0,.2,1)';
      section.style.transform = 'scale(1.04)';
      setTimeout(() => {
        section.style.transform = 'scale(1.12)';
        setTimeout(() => {
          // Move to enlarged container
          enlargedContainer.appendChild(section);
          section.style.transition = '';
          section.style.transform = '';
          section.classList.add('enlarged');
          section.classList.remove('enlarging');
          section.style.zIndex = '';
          document.body.classList.add('enlarged-section');
          document.body.classList.add('no-scroll');
          document.querySelectorAll('.main-section-cube.enlarged').forEach(s => { if(s!==section) s.classList.remove('enlarged'); });
          // Remove any existing close button and esc hint before injecting (cleanup for re-enlarging)
          const oldBtn = section.querySelector('.close-section-btn');
          if (oldBtn) oldBtn.remove();
          const oldHint = section.querySelector('.esc-hint');
          if (oldHint) oldHint.remove();
          // Add enlarged section header with close button on right and ESC hint on left
          if (!section.querySelector('.enlarged-header')) {
            const headerDiv = document.createElement('div');
            headerDiv.className = 'enlarged-header';
            headerDiv.innerHTML = `
              <span class="esc-hint">ESC to close</span>
              <button class="enlarged-close-btn" aria-label="Close">&times;</button>
            `;
            // Close button click handler
            const closeBtn = headerDiv.querySelector('.enlarged-close-btn');
            closeBtn.onclick = function(ev) {
              ev.stopPropagation();
              closeEnlargedSection(section);
            };
            section.prepend(headerDiv);
            // Also wire up any .close-section-btn to close the section
            const legacyCloseBtn = section.querySelector('.close-section-btn');
            if (legacyCloseBtn) {
              legacyCloseBtn.onclick = function(ev) {
                ev.stopPropagation();
                closeEnlargedSection(section);
              };
            }
          }
          // Hide all header elements after expand
          document.querySelectorAll('#header, .site-header, header').forEach(h => h.style.display = 'none');
        }, 400);
      }, 100);
    }
    // Do not allow click to close when already enlarged
    // (No else block here, so nothing happens on click if already enlarged)
  }, true);

  // Allow ESC to unenlarge section
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.body.classList.remove('enlarged-section');
      document.body.classList.remove('no-scroll'); // Allow body scroll again
      document.querySelectorAll('#header, .site-header, header').forEach(h => h.style.display = '');
      document.querySelectorAll('.main-section-cube.enlarged').forEach(s => {
        closeEnlargedSection(s);
      });
    }
  });

  // Helper to close an enlarged section with animation and cleanup
  function closeEnlargedSection(section) {
    document.body.classList.remove('enlarged-section');
    document.body.classList.remove('no-scroll');
    document.querySelectorAll('#header, .site-header, header').forEach(h => h.style.display = '');
    section.classList.add('shrinking');
    section.classList.remove('enlarged');
    section.classList.remove('enlarging');
    section.style.transition = 'transform 0.3s cubic-bezier(.4,0,.2,1), box-shadow 0.3s cubic-bezier(.4,0,.2,1)';
    section.style.transform = 'scale(0.96)';
    // Remove the enlarged header
    const enlargedHeader = section.querySelector('.enlarged-header');
    if (enlargedHeader) enlargedHeader.remove();
    setTimeout(() => {
      section.style.transform = 'scale(0.88)';
      setTimeout(() => {
        section.style.transition = '';
        section.style.transform = '';
        section.style.zIndex = '';
        section.classList.remove('shrinking');
        // Move back to original parent
        if (section._originalParent) {
          if (section._originalNext && section._originalNext.parentNode === section._originalParent) {
            section._originalParent.insertBefore(section, section._originalNext);
          } else {
            section._originalParent.appendChild(section);
          }
          delete section._originalParent;
          delete section._originalNext;
        }
      }, 200);
    }, 40);
  }

  // Set z-index for header to ensure correct stacking order
  const headerEl = document.getElementById('header');
  if (headerEl) {
    headerEl.style.zIndex = '1000'; 
    headerEl.style.position = 'relative';
  }

});
