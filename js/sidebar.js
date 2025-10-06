function loadSidebar() {
  // Load sidebar.html content dynamically
  fetch('./components/sidebar.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('sidebar').innerHTML = html;

      // Load feed into feed-container
      loadFeed();

      // Load logo into logo-container
      fetch('./components/logo.html')
        .then(res => res.text())
        .then(logoHtml => {
          document.getElementById('logo-container').innerHTML = logoHtml;
        })
        .catch(err => console.error('Logo failed to load:', err));

      // Load buttons into sidebar-buttons
      fetch('./components/sidebarbuttons.html')
        .then(res => res.text())
        .then(buttonsHtml => {
          document.getElementById('sidebar-buttons').innerHTML = buttonsHtml;

          // Add click listeners to buttons
          const buttons = document.querySelectorAll('.sidebar-btn');
          buttons.forEach(btn => {
            btn.addEventListener('click', () => {
              const page = btn.dataset.page || btn.textContent.toLowerCase().replace(/\s+/g, '');
              let path = `./pages/${page}.html`;
              if (page.includes('/')) {
                path = `./${page}.html`;
              }
              fetch(path)
                .then(res => res.text())
                .then(html => {
                  document.getElementById('remaining-area').innerHTML = html;
                  // Load the corresponding JS if it exists
                  const script = document.createElement('script');
                  script.src = `./${page}.js`;
                  document.body.appendChild(script);
                })
                .catch(err => console.error(`${page} page failed to load:`, err));
            });
          });
        })
        .catch(err => console.error('Buttons failed to load:', err));

      // Load default page
      const defaultPage = 'estimatedlaunchday';
      fetch(`./pages/${defaultPage}.html`)
        .then(res => res.text())
        .then(html => {
          document.getElementById('remaining-area').innerHTML = html;
          const script = document.createElement('script');
          script.src = `./js/${defaultPage}.js`;
          document.body.appendChild(script);
        })
        .catch(err => console.error(`Default page ${defaultPage} failed to load:`, err));
    })
    .catch(err => console.error('Sidebar failed to load:', err));
}

function loadFeed() {
  // Load feedcard.html content dynamically
  fetch('./components/feedcard.html')
    .then(res => res.text())
    .then(html => {
      document.getElementById('feed-container').innerHTML = html;

      // Update time and version after loading
      updateFeed();
    })
    .catch(err => console.error('Feed card failed to load:', err));
}

function updateFeed() {
  // Update time every second
  const updateTime = () => {
    const now = new Date();
    const timeElement = document.getElementById('feedTime');
    if (timeElement) timeElement.textContent = now.toLocaleTimeString();
  };
  updateTime();
  setInterval(updateTime, 1000);

  // Set version
  const versionElement = document.getElementById('feedVersion');
  if (versionElement) versionElement.textContent = window.APP_VERSION || '1.0.0';

  // Update title based on screen size
  const titleElement = document.getElementById('feedtitle');
  const updateTitle = () => {
    if (titleElement) {
      titleElement.textContent = window.innerWidth < 768 ? 'DIcc' : 'DiccChops';
    }
  };
  updateTitle();
  window.addEventListener('resize', updateTitle);
}