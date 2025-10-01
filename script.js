// Load external HTML into sections
document.querySelectorAll(".section").forEach(section => {
  const file = section.getAttribute("data-file");
  const sectionContent = section.querySelector(".section-content");

  if (file) {
    fetch(file)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.text();
      })
      .then(html => {
        sectionContent.innerHTML = html;

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
        console.error(`Failed to load content for ${file}:`, error);
        sectionContent.innerHTML = "<p>Failed to load content. Please try again later.</p>";
      });
  }

  section.addEventListener("click", function (e) {
    if (e.target.closest("nav.main-nav")) return;
    const wasExpanded = section.classList.contains("expanded");
    if (!wasExpanded) {
      collapseAll();
      section.classList.add("expanded");
      document.body.classList.add("no-scroll");
      section.scrollTop = 0;
      playWhoosh();
    }
    e.stopPropagation();
  });
});

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
const dropSoundUrl = './sounds/Drop.wav';
let dropBuffer = null;
fetch(dropSoundUrl)
  .then(res => res.arrayBuffer())
  .then(data => audioCtx.decodeAudioData(data))
  .then(buffer => { dropBuffer = buffer; });

function playDrop() {
  if (!dropBuffer) return;
  const source = audioCtx.createBufferSource();
  source.buffer = dropBuffer;
  source.connect(audioCtx.destination);
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
const clickSoundUrl = './sounds/Click.wav';
let clickBuffer = null;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
      source.connect(audioCtx.destination);
      // Play from 0.03s to 1.0s
      source.start(0, 0.6, 1.0 - 0.6);
    });
  });
});

// Whoosh sound for section expand
const whooshSoundUrl = './sounds/Whoosh.wav';
let whooshBuffer = null;
fetch(whooshSoundUrl)
  .then(res => res.arrayBuffer())
  .then(data => audioCtx.decodeAudioData(data))
  .then(buffer => { whooshBuffer = buffer; });

function playWhoosh() {
  if (!whooshBuffer) return;
  const source = audioCtx.createBufferSource();
  source.buffer = whooshBuffer;
  source.connect(audioCtx.destination);
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
