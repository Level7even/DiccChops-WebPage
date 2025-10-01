// Audio Settings Logic for Settings section
(function() {
  // IDs of your UI sound audio elements
  const soundIds = ['clickSound', 'whooshSound', 'dropSound'];
  function getUiSounds() {
    return soundIds.map(id => document.getElementById(id)).filter(Boolean);
  }
  function setVolume(vol) {
    getUiSounds().forEach(audio => { audio.volume = vol; });
    localStorage.setItem('uiVolume', vol);
  }
  function setMute(mute) {
    getUiSounds().forEach(audio => { audio.muted = mute; });
    localStorage.setItem('uiMute', mute);
    const btn = document.getElementById('audio-mute-toggle');
    if (btn) {
      btn.classList.toggle('muted', mute);
      btn.setAttribute('aria-pressed', mute ? 'true' : 'false');
      btn.innerHTML = mute ? '<i class="fa fa-volume-mute"></i> Muted' : '<i class="fa fa-volume-mute"></i> Mute';
    }
  }
  function loadAudioSettings() {
    const vol = localStorage.getItem('uiVolume');
    const mute = localStorage.getItem('uiMute') === 'true';
    const volSlider = document.getElementById('audio-volume');
    const volValue = document.getElementById('audio-volume-value');
    if (volSlider && vol !== null) {
      volSlider.value = vol;
      setVolume(parseFloat(vol));
      if (volValue) volValue.textContent = Math.round(vol * 100) + '%';
    }
    setMute(mute);
  }
  document.addEventListener('input', function(e) {
    if (e.target && e.target.id === 'audio-volume') {
      const vol = parseFloat(e.target.value);
      setVolume(vol);
      const volValue = document.getElementById('audio-volume-value');
      if (volValue) volValue.textContent = Math.round(vol * 100) + '%';
      setMute(false);
    }
  });
  document.addEventListener('click', function(e) {
    if (e.target && (e.target.id === 'audio-mute-toggle' || e.target.closest('#audio-mute-toggle'))) {
      const sounds = getUiSounds();
      const isMuted = sounds.length && sounds[0].muted;
      setMute(!isMuted);
    }
  });
  document.addEventListener('DOMContentLoaded', loadAudioSettings);
})();
