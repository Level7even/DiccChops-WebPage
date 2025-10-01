// --- Theme Color Logic ---
(function() {
  const colorVars = {
    'color-bg': '--color-bg-dark',
    'color-accent': '--color-accent',
    'color-gold': '--color-gold',
    'color-brand': '--color-brand'
  };
  const defaultColors = {
    'color-bg': '#0a0a23',
    'color-accent': '#7feaf9',
    'color-gold': '#FFD700',
    'color-brand': '#CFFAFF'
  };
  function applyThemeColors(colors) {
    for (const id in colorVars) {
      const val = colors[id] || defaultColors[id];
      document.documentElement.style.setProperty(colorVars[id], val);
    }
    // Also update background gradient
    document.body.style.background = `linear-gradient(135deg, ${colors['color-bg'] || defaultColors['color-bg']} 0%, var(--color-bg-mid) 100%)`;
  }
  function saveThemeColors(colors) {
    localStorage.setItem('themeColors', JSON.stringify(colors));
  }
  function loadThemeColors() {
    const raw = localStorage.getItem('themeColors');
    if (raw) return JSON.parse(raw);
    return { ...defaultColors };
  }
  function resetThemeColors() {
    localStorage.removeItem('themeColors');
    applyThemeColors(defaultColors);
    for (const id in colorVars) {
      const input = document.getElementById(id);
      if (input) input.value = defaultColors[id];
    }
  }
  document.addEventListener('DOMContentLoaded', function() {
    // Set initial values
    const saved = loadThemeColors();
    for (const id in colorVars) {
      const input = document.getElementById(id);
      if (input) {
        input.value = saved[id] || defaultColors[id];
        input.addEventListener('input', function() {
          const colors = loadThemeColors();
          colors[id] = input.value;
          applyThemeColors(colors);
          saveThemeColors(colors);
        });
      }
    }
    applyThemeColors(saved);
    // Reset button
    const resetBtn = document.getElementById('reset-theme-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        resetThemeColors();
        saveThemeColors(defaultColors);
      });
    }
  });
})();