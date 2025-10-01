// --- Global Audio Engine (audioCtx, gainNodes) ---
window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
window.gainNodes = {
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

// Load external HTML into sections
document.querySelectorAll(".section").forEach(section => {
  const file = section.getAttribute("data-file");
  const sectionContent = section.querySelector(".section-content");

  if (file) {
    // Show loading indicator
    sectionContent.innerHTML = "<div class='section-loading'>Loading...</div>";

    fetch(file)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.text();
      })
      .then(html => {
        sectionContent.innerHTML = html;
        // Force repaint after loading content
        document.body.classList.add('force-repaint');
        setTimeout(() => document.body.classList.remove('force-repaint'), 50);
        window.scrollBy(0, 1);
        window.scrollBy(0, -1);
        // Add close button
        const closeBtn = document.createElement("button");
        closeBtn.innerHTML = "&times;";
        closeBtn.className = "close-button";
        section.appendChild(closeBtn);

        closeBtn.addEventListener("click", e => {
          e.stopPropagation();
          collapseAll();
        });
      })
      .catch(error => {
        sectionContent.innerHTML = "<p>Failed to load content. Please try again later.</p>";
      });
  }

  section.addEventListener("click", function (e) {
    if (e.target.closest("nav.main-nav")) return;
    const wasExpanded = section.classList.contains("expanded");
    if (!wasExpanded) {
      lastScrollY = window.scrollY;
      collapseAll();
      section.classList.add("expanded");
      document.body.classList.add("no-scroll");
      section.scrollTop = 0;
      playWhoosh();
    }
    e.stopPropagation();
  });
});

// Show and expand the correct section by id
function showSection(target) {
  const section = document.getElementById(target);
  if (section) {
    collapseAll();
    section.classList.add('expanded');
    document.body.classList.add('no-scroll');
    section.scrollTop = 0;
    playWhoosh();
    section.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// Helper: toggle expand
function toggleExpand(section) {
  const isExpanded = section.classList.contains("expanded");
  collapseAll();
  if (!isExpanded) {
    section.classList.add("expanded");
    document.body.classList.add("no-scroll");
    section.scrollTop = 0;
  }
}

// Drop sound for section collapse
const dropSoundUrl = '../../sounds/Drop.wav';
let dropBuffer = null;
fetch(dropSoundUrl)
  .then(res => res.arrayBuffer())
  .then(data => audioCtx.decodeAudioData(data))
  .then(buffer => { dropBuffer = buffer; });

function playDrop() {
  if (!dropBuffer) return;
  const source = audioCtx.createBufferSource();
  source.buffer = dropBuffer;
  source.connect(gainNodes.drop);
  source.start(0, 0, 1 - 0);
}

// Helper: collapse all (with drop sound)
function collapseAll() {
  const expandedSections = document.querySelectorAll('.section.expanded');
  if (expandedSections.length > 0) {
    expandedSections.forEach(s => s.classList.remove('expanded'));
    document.body.classList.remove('no-scroll');
    playDrop();
  } else {
    document.body.classList.remove('no-scroll');
  }
  // Only force repaint (no CSS reload)
  document.body.classList.add('force-repaint');
  setTimeout(() => document.body.classList.remove('force-repaint'), 50);
  window.scrollBy(0, 1);
  window.scrollBy(0, -1);
  // Restore scroll position
  if (typeof lastScrollY === 'number') {
    window.scrollTo({ top: lastScrollY, behavior: 'auto' });
  }
}

// Collapse on ESC
window.addEventListener("keydown", e => {
  if (e.key === "Escape") collapseAll();
});

// Collapse on outside click
window.addEventListener("mousedown", e => {
  const expanded = document.querySelector(".section.expanded");
  if (expanded && !expanded.contains(e.target) && !e.target.closest("nav.main-nav")) {
    collapseAll();
  }
});

// Play a segment of click.wav when a nav link is clicked
const clickSoundUrl = '../../sounds/Click.wav';
let clickBuffer = null;
fetch(clickSoundUrl)
  .then(res => res.arrayBuffer())
  .then(data => audioCtx.decodeAudioData(data))
  .then(buffer => { clickBuffer = buffer; });

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('nav.main-nav a').forEach(link => {
    link.addEventListener('click', () => {
      if (!clickBuffer) return;
      const source = audioCtx.createBufferSource();
      source.buffer = clickBuffer;
      source.connect(gainNodes.click);
      source.start(0, 0.6, 1.0 - 0.6);
    });
  });
});

// Whoosh sound for section expand
const whooshSoundUrl = '../../sounds/Whoosh.wav';
let whooshBuffer = null;
fetch(whooshSoundUrl)
  .then(res => res.arrayBuffer())
  .then(data => audioCtx.decodeAudioData(data))
  .then(buffer => { whooshBuffer = buffer; });

function playWhoosh() {
  if (!whooshBuffer) return;
  const source = audioCtx.createBufferSource();
  source.buffer = whooshBuffer;
  source.connect(gainNodes.whoosh);
  source.start(0, 2.5, 3 - 2.5);
}

// Patch section expand logic to play whoosh
const origCollapseAll = collapseAll;
function collapseAllWithWhoosh() {
  origCollapseAll();
}
window.collapseAll = collapseAllWithWhoosh;

// Patch section click to play whoosh on expand
const sectionEls = document.querySelectorAll('.section');
sectionEls.forEach(section => {
  section.addEventListener('click', function (e) {
    if (e.target.closest('nav.main-nav')) return;
    if (!section.classList.contains('expanded')) {
      playWhoosh();
    }
  }, true);
});

// Render test graph for GraphTest section if present
function renderGraphTest() {
  const canvas = document.getElementById('btcChart');
  if (canvas && window.Chart) {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = [12, 19, 3, 5, 2, 3, 9];
    new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Test Data',
          data: data,
          borderColor: '#7feaf9',
          backgroundColor: 'rgba(127,234,249,0.1)',
          fill: true,
          tension: 0.2
        }]
      },
      options: {
        responsive: false,
        plugins: { legend: { display: true } },
        scales: { x: { display: true }, y: { display: true } }
      }
    });
  }
}

// After section content is loaded, check for GraphTest and render chart
const origSectionLoader = document.querySelectorAll('.section');
document.querySelectorAll('.section').forEach(section => {
  const observer = new MutationObserver(() => {
    if (section.classList.contains('GraphTest')) {
      // Wait for Chart.js to load if needed
      if (window.Chart) {
        renderGraphTest();
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = renderGraphTest;
        document.body.appendChild(script);
      }
    }
  });
  observer.observe(section, { childList: true, subtree: true });
});

// --- User Settings with IP as ID ---
let userId = null;
fetch('https://api.ipify.org?format=json')
  .then(res => res.json())
  .then(data => {
    userId = data.ip;
    console.log('User IP:', userId);
    // After IP is loaded, load audio settings for this user
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

// --- Fix for repaint/hover/focus issues after closing expanded section ---
(function() {
  const observer = new MutationObserver(() => {
    const expanded = document.querySelector('.section.expanded');
    if (!expanded) {
      // Remove focus from any element
      if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
      // Force repaint by toggling a class
      document.body.classList.add('force-repaint');
      setTimeout(() => document.body.classList.remove('force-repaint'), 50);
      // Nudge scroll to force browser repaint
      window.scrollBy(0, 1);
      window.scrollBy(0, -1);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();

// Load header component
fetch('../../Components/Header/Header.html')
  .then(res => res.text())
  .then(html => { document.getElementById('header').outerHTML = html; });
