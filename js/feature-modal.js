// Shared feature-detail modal, built once and reused by index.html (feature
// cards) and evaluation.html (radar/consensus click-to-expand). Reads from
// RAIM_FEATURES (features-data.js), which must be loaded first.

(function () {
  "use strict";

  const featuresById = {};
  RAIM_FEATURES.features.forEach((f) => { featuresById[f.id] = f; });
  const pillarsByNum = {};
  RAIM_FEATURES.pillars.forEach((p) => { pillarsByNum[p.num] = p; });

  const overlay = document.createElement("div");
  overlay.className = "popup feature-modal";
  overlay.innerHTML = `
    <div class="popup-content">
      <span class="close-button" role="button" aria-label="Close" tabindex="0">&times;</span>
      <div class="feature-modal-meta"></div>
      <h2 class="feature-modal-title"></h2>
      <p class="feature-modal-brief"></p>
      <p class="feature-modal-description"></p>
    </div>
  `;
  document.body.appendChild(overlay);

  const titleEl = overlay.querySelector(".feature-modal-title");
  const metaEl = overlay.querySelector(".feature-modal-meta");
  const briefEl = overlay.querySelector(".feature-modal-brief");
  const descEl = overlay.querySelector(".feature-modal-description");

  function open(featureId) {
    const feature = featuresById[featureId];
    if (!feature) return;
    const pillar = pillarsByNum[feature.pillar];

    titleEl.textContent = feature.name;
    metaEl.innerHTML = `
      <span class="feature-modal-badge">Feature ${feature.id}</span>
      <span class="feature-modal-badge">Pillar ${feature.pillar}: ${pillar ? pillar.name : ""}</span>
      <span class="feature-modal-badge">${feature.facet}</span>
    `;
    briefEl.textContent = feature.brief;
    descEl.innerHTML = feature.description;

    overlay.style.display = "block";
    requestAnimationFrame(() => overlay.classList.add("active"));
  }

  function close() {
    overlay.classList.remove("active");
    setTimeout(() => { overlay.style.display = "none"; }, 300);
  }

  overlay.querySelector(".close-button").addEventListener("click", close);
  overlay.querySelector(".close-button").addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") close();
  });
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && overlay.classList.contains("active")) close();
  });

  window.openFeatureModal = open;
  window.closeFeatureModal = close;
})();