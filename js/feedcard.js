function updateFeedCard() {
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

  // Set title based on screen size
  const titleElement = document.getElementById('feedtitle');
  const updateTitle = () => {
    if (titleElement) {
      titleElement.textContent = window.innerWidth < 768 ? 'DIcc' : 'DiccChops';
    }
  };
  updateTitle();
  window.addEventListener('resize', updateTitle);
}
