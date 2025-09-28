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
    if (!section.classList.contains("expanded")) {
      collapseAll();
      section.classList.add("expanded");
      document.body.classList.add("no-scroll");
      section.scrollTop = 0;
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

// Helper: collapse all
function collapseAll() {
  document.querySelectorAll(".section.expanded").forEach(s => s.classList.remove("expanded"));
  document.body.classList.remove("no-scroll");
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
