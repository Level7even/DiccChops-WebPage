// --- Audio Settings Logic using Web Audio API GainNode (per sound) ---
(function() {
  // Only run if the settings section is present
  function initAudioSettings() {
    // --- User Settings with IP as ID ---
    let userId = null;
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        userId = data.ip;
        loadAudioSettings();
      });
    function getSettingsKey() {
      return userId ? `Users-Settings-${userId}` : 'Users-Settings-unknown';
    }
    function saveUserSettings(settings) {
      if (!userId) return;
      localStorage.setItem(getSettingsKey(), JSON.stringify(settings));
    }
    function loadUserSettings() {
      if (!userId) return null;
      const raw = localStorage.getItem(getSettingsKey());
      if (raw) return JSON.parse(raw);
      return null;
    }
    // --- GainNodes ---
    const audioCtx = window.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    window.audioCtx = audioCtx;
    const gainNodes = {
      click: audioCtx.createGain(),
      whoosh: audioCtx.createGain(),
      drop: audioCtx.createGain()
    };
    gainNodes.click.gain.value = 0.5;
    gainNodes.whoosh.gain.value = 0.5;
    gainNodes.drop.gain.value = 0.5;
    gainNodes.click.connect(audioCtx.destination);
    gainNodes.whoosh.connect(audioCtx.destination);
    gainNodes.drop.connect(audioCtx.destination);
    window.gainNodes = gainNodes;
    let isMuted = false;
    function setVolume(type, vol) {
      if (gainNodes[type]) gainNodes[type].gain.value = isMuted ? 0 : vol;
      const settings = loadUserSettings() || { click: 0.5, whoosh: 0.5, drop: 0.5, mute: false };
      settings[type] = vol;
      saveUserSettings(settings);
    }
    function setMute(mute) {
      isMuted = mute;
      Object.keys(gainNodes).forEach(type => {
        gainNodes[type].gain.value = mute ? 0 : (loadUserSettings()?.[type] || 0.5);
      });
      const settings = loadUserSettings() || { click: 0.5, whoosh: 0.5, drop: 0.5, mute: false };
      settings.mute = mute;
      saveUserSettings(settings);
      const btn = document.getElementById('audio-mute-toggle');
      if (btn) btn.innerHTML = mute ? '<i class="fa fa-volume-mute"></i> Unmute' : '<i class="fa fa-volume-mute"></i> Mute';
    }
    window.loadAudioSettings = function() {
      const settings = loadUserSettings();
      const sliders = {
        click: document.getElementById('audio-volume-click'),
        whoosh: document.getElementById('audio-volume-whoosh'),
        drop: document.getElementById('audio-volume-drop')
      };
      const values = {
        click: document.getElementById('audio-volume-value-click'),
        whoosh: document.getElementById('audio-volume-value-whoosh'),
        drop: document.getElementById('audio-volume-value-drop')
      };
      ['click','whoosh','drop'].forEach(type => {
        if (settings && sliders[type]) {
          sliders[type].value = settings[type];
          setVolume(type, parseFloat(settings[type]));
          if (values[type]) values[type].textContent = Math.round(settings[type] * 100) + '%';
        } else if (sliders[type]) {
          sliders[type].value = 0.5;
          setVolume(type, 0.5);
          if (values[type]) values[type].textContent = '50%';
        }
      });
      setMute(settings ? settings.mute : false);
    }
    document.addEventListener('input', function(e) {
      if (e.target && e.target.id && e.target.id.startsWith('audio-volume-')) {
        const type = e.target.id.replace('audio-volume-','');
        const vol = parseFloat(e.target.value);
        setVolume(type, vol);
        const valueSpan = document.getElementById('audio-volume-value-' + type);
        if (valueSpan) valueSpan.textContent = Math.round(vol * 100) + '%';
        setMute(false);
      }
    });
    document.addEventListener('click', function(e) {
      if (e.target && (e.target.id === 'audio-mute-toggle' || e.target.closest('#audio-mute-toggle'))) {
        setMute(!isMuted);
      }
    });
  }
  // Only initialize if the settings section is present
  const observer = new MutationObserver(() => {
    if (document.getElementById('audio-volume-click')) {
      initAudioSettings();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
