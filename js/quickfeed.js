// Quick Feed JavaScript
// This script automatically generates sections based on folders in QuickFeedPages.
// To add a new section, create a new folder in QuickFeedPages with an index.html and optional info.json for title.

// Run immediately since loaded dynamically
initQuickFeed();

function initQuickFeed() {
  const gridContainer = document.getElementById('grid-container');
  if (!gridContainer) return; // Wait if not loaded yet

  const fullscreenOverlay = document.getElementById('fullscreen-overlay');
  const fullscreenContent = document.getElementById('fullscreen-content');
  const closeBtn = document.getElementById('close-btn');

  // List of folders (in a real server, this would be fetched dynamically)
  const folders = ['news', 'updates', 'tips', 'features', 'announcements', 'tutorials', 'changelog'];

  folders.forEach(folder => {
    const title = folder.charAt(0).toUpperCase() + folder.slice(1);

    const section = document.createElement('div');
    section.className = 'section';
    section.innerHTML = `
      <h2>${title}</h2>
      <p>Click to view content</p>
    `;

    let hoverTimeout;
    section.addEventListener('mouseenter', () => {
      hoverTimeout = setTimeout(() => {
        section.classList.add('preview');
      }, 2000);
    });
    section.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimeout);
      section.classList.remove('preview');
    });

    section.addEventListener('click', () => {
      openFullscreen(folder);
    });

    gridContainer.appendChild(section);

    // Try to fetch title from info.json
    fetch(`./QuickFeedPages/${folder}/info.json`)
      .then(res => res.json())
      .then(data => {
        if (data.title) {
          section.querySelector('h2').textContent = data.title;
        }
      })
      .catch(err => {
        // Keep default title
        console.error(`Failed to load info for ${folder}:`, err);
      });
  });

  function openFullscreen(folder) {
    fullscreenContent.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    fullscreenOverlay.classList.remove('hidden');

    // Fetch content from folder's index.html
    fetch(`./QuickFeedPages/${folder}/index.html`)
      .then(res => res.text())
      .then(html => {
        fullscreenContent.innerHTML = html;
      })
      .catch(err => {
        console.error(`Failed to load content for ${folder}:`, err);
        fullscreenContent.innerHTML = `<h1>Error</h1><p>Failed to load content for ${folder}.</p>`;
      });
  }

  function closeFullscreen() {
    fullscreenOverlay.classList.add('hidden');
  }

  closeBtn.addEventListener('click', closeFullscreen);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeFullscreen();
    }
  });
}
