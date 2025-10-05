// settings.js - Handles settings form interactions
document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.settings-form');
  const themeSelect = document.getElementById('theme');
  const notificationsCheckbox = document.getElementById('notifications');
  const languageSelect = document.getElementById('language');

  // Load saved settings
  const loadSettings = () => {
    const settings = JSON.parse(localStorage.getItem('diccChopsSettings')) || {};
    if (themeSelect) themeSelect.value = settings.theme || 'Dark';
    if (notificationsCheckbox) notificationsCheckbox.checked = settings.notifications !== false;
    if (languageSelect) languageSelect.value = settings.language || 'English';
  };

  // Save settings
  const saveSettings = () => {
    const settings = {
      theme: themeSelect.value,
      notifications: notificationsCheckbox.checked,
      language: languageSelect.value
    };
    localStorage.setItem('diccChopsSettings', JSON.stringify(settings));
    alert('Settings saved!');
  };

  loadSettings();

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      saveSettings();
    });
  }
});
