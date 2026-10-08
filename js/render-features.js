// Renders the overview diagram, pillar jump-links and per-pillar feature card
// decks on index.html from RAIM_FEATURES (features-data.js). Clicking a card
// or overview chip opens its full description via feature-modal.js's
// openFeatureModal().

(function () {
  "use strict";

  function padFeatureId(id) {
    const [pillar, num] = id.split("-");
    return `${pillar}-${num.padStart(2, "0")}`;
  }

  function renderJumpLinks() {
    const wrap = document.getElementById("pillar-jump-links");
    if (!wrap) return;
    wrap.innerHTML = RAIM_FEATURES.pillars.map((p) => `
      <li class="list-inline-item mb-2">
        <a class="btn btn-outline-primary" href="#features-${p.num}">${p.name}</a>
      </li>
    `).join("");
  }

  function renderOverview() {
    const overview = document.getElementById("raim-overview");
    if (!overview) return;

    overview.querySelector(".raim-overview-count").textContent = RAIM_FEATURES.features.length;
    const list = overview.querySelector(".raim-overview-pillars");
    list.innerHTML = RAIM_FEATURES.pillars.map((p) => {
      const features = RAIM_FEATURES.features.filter((f) => f.pillar === p.num);
      return `
        <li class="raim-overview-pillar" data-pillar="${p.num}">
          <div class="raim-overview-label">
            <span class="raim-overview-num" aria-hidden="true">${p.num}</span>
            <div>
              <a class="raim-overview-name" href="#features-${p.num}">${p.name}</a>
              <small>${features.length} features</small>
            </div>
          </div>
          <ul class="raim-overview-chips" role="list">
            ${features.map((f) => `
              <li><button type="button" class="raim-chip" data-feature-id="${f.id}">${f.name}</button></li>
            `).join("")}
          </ul>
        </li>
      `;
    }).join("");

    list.querySelectorAll(".raim-chip").forEach((chip) => {
      chip.addEventListener("click", () => window.openFeatureModal(chip.dataset.featureId));
    });
  }

  function renderPillarSection(pillar) {
    const section = document.getElementById(`features-${pillar.num}`);
    if (!section) return;

    section.querySelector(".pillar-heading").textContent = `Pillar ${pillar.num}: ${pillar.name}`;
    section.querySelector(".pillar-intro").innerHTML = pillar.intro;

    const deck = section.querySelector(".card-deck");
    const features = RAIM_FEATURES.features.filter((f) => f.pillar === pillar.num);

    deck.innerHTML = features.map((f) => `
      <div class="card" tabindex="0" role="button" aria-label="${f.name} — view details" data-feature-id="${f.id}">
        <img class="card-img-top" src="${pillar.image}">
        <div class="card-body">
          <h5 class="card-title">${f.name}</h5>
          <p class="card-text">${f.brief}</p>
        </div>
        <div class="card-footer d-flex w-100 justify-content-between">
          <small class="text-muted">Feature ${padFeatureId(f.id)}</small>
          <small class="text-muted">${f.facet}</small>
        </div>
      </div>
    `).join("");

    deck.querySelectorAll(".card").forEach((card) => {
      const open = () => window.openFeatureModal(card.dataset.featureId);
      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });
  }

  renderOverview();
  renderJumpLinks();
  RAIM_FEATURES.pillars.forEach(renderPillarSection);
})();