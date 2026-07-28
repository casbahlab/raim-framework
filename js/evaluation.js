// RAIM Evaluation page — interactive radar + consensus explorer.
// Vanilla JS + inline SVG, no external chart library required.

(function () {
  "use strict";

  const DATA = RAIM_DATA;
  const SVG_NS = "http://www.w3.org/2000/svg";

  // Feature names rendered into table HTML are clickable buttons; a single
  // delegated listener opens the shared feature-modal (feature-modal.js)
  // regardless of how many times a table is re-rendered.
  function featureLink(id, label) {
    return `<button type="button" class="feature-link" data-feature="${id}">${label}</button>`;
  }
  document.addEventListener("click", (e) => {
    const link = e.target.closest(".feature-link");
    if (link) window.openFeatureModal(link.dataset.feature);
  });

  const GROUP_META = {
    AI:      { label: "AI / Technology", varName: "--series-ai",      shape: "circle" },
    Artists: { label: "Artists / Creators", varName: "--series-artists", shape: "square" },
    Ethics:  { label: "Ethics",           varName: "--series-ethics",  shape: "triangle" },
    Law:     { label: "Law",              varName: "--series-law",     shape: "diamond" },
  };

  const TIER_META = {
    good:     { varName: "--status-good",     label: "Consensus (reached / strengthened / maintained)" },
    warning:  { varName: "--status-warning",  label: "Converging" },
    serious:  { varName: "--status-serious",  label: "Stable / diverged" },
    critical: { varName: "--status-critical", label: "Consensus lost" },
  };

  const STATUS_ORDER = [
    "Consensus Reached", "Strengthened", "Maintained",
    "Converging", "Stable/Diverged", "Consensus Lost",
  ];

  function cssVar(name) {
    const scope = document.querySelector(".viz-root") || document.documentElement;
    return getComputedStyle(scope).getPropertyValue(name).trim();
  }

  function el(tag, attrs, parent) {
    const e = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function wrapLabel(text, maxChars) {
    const words = text.split(" ");
    const lines = [];
    let cur = "";
    words.forEach((w) => {
      const trial = cur ? cur + " " + w : w;
      if (trial.length > maxChars && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = trial;
      }
    });
    if (cur) lines.push(cur);
    return lines;
  }

  // ---------------------------------------------------------------------
  // Tooltip (shared)
  // ---------------------------------------------------------------------
  const tooltip = document.createElement("div");
  tooltip.className = "viz-tooltip";
  document.body.appendChild(tooltip);

  function showTooltip(x, y, html) {
    tooltip.innerHTML = html;
    tooltip.style.left = x + 14 + "px";
    tooltip.style.top = y + 14 + "px";
    tooltip.classList.add("is-visible");
  }
  function hideTooltip() {
    tooltip.classList.remove("is-visible");
  }

  // ---------------------------------------------------------------------
  // Radar chart
  // ---------------------------------------------------------------------
  const radarState = {
    pillarKey: DATA.pillars[0].key,
    activeGroups: new Set(DATA.groups),
  };

  function renderPillarTabs() {
    const wrap = document.getElementById("pillar-tabs");
    wrap.innerHTML = "";
    DATA.pillars.forEach((p) => {
      const btn = document.createElement("button");
      btn.className = "pillar-tab" + (p.key === radarState.pillarKey ? " active" : "");
      btn.type = "button";
      btn.textContent = `${p.num}. ${p.name}`;
      btn.addEventListener("click", () => {
        radarState.pillarKey = p.key;
        renderPillarTabs();
        renderRadar();
        renderRadarTable();
      });
      wrap.appendChild(btn);
    });
  }

  function renderGroupLegend() {
    const wrap = document.getElementById("radar-legend");
    wrap.innerHTML = "";
    DATA.groups.forEach((g) => {
      const meta = GROUP_META[g];
      const item = document.createElement("div");
      item.className = "legend-item" + (radarState.activeGroups.has(g) ? "" : " is-off");
      item.innerHTML = `
        <span class="legend-swatch">${shapeSvg(meta.shape, cssVar(meta.varName))}</span>
        <span class="legend-name">${meta.label}</span>
        <span class="legend-count">n=${DATA.headline.groupSizes[g]}</span>
      `;
      item.addEventListener("click", () => {
        if (radarState.activeGroups.has(g)) {
          if (radarState.activeGroups.size === 1) return; // keep at least one visible
          radarState.activeGroups.delete(g);
        } else {
          radarState.activeGroups.add(g);
        }
        renderGroupLegend();
        renderRadar();
      });
      wrap.appendChild(item);
    });
    const hint = document.createElement("div");
    hint.className = "legend-hint";
    hint.textContent = "Click a group to show/hide it. Shape + color both identify each group. Click a feature's marker or axis label to read its full description.";
    wrap.appendChild(hint);
  }

  function shapeSvg(shape, color) {
    const s = 14;
    const c = s / 2;
    switch (shape) {
      case "square":
        return `<svg width="${s}" height="${s}"><rect x="1" y="1" width="${s - 2}" height="${s - 2}" fill="${color}" rx="2"/></svg>`;
      case "triangle":
        return `<svg width="${s}" height="${s}"><polygon points="${c},1 ${s - 1},${s - 1} 1,${s - 1}" fill="${color}"/></svg>`;
      case "diamond":
        return `<svg width="${s}" height="${s}"><polygon points="${c},0 ${s},${c} ${c},${s} 0,${c}" fill="${color}"/></svg>`;
      default:
        return `<svg width="${s}" height="${s}"><circle cx="${c}" cy="${c}" r="${c - 1}" fill="${color}"/></svg>`;
    }
  }

  function drawShape(parent, shape, cx, cy, r, color, extraAttrs) {
    const attrs = Object.assign({ fill: color }, extraAttrs || {});
    if (shape === "square") {
      const side = r * 1.6;
      return el("rect", Object.assign({ x: cx - side / 2, y: cy - side / 2, width: side, height: side, rx: 1.5 }, attrs), parent);
    }
    if (shape === "triangle") {
      const h = r * 1.8;
      return el("polygon", Object.assign({ points: `${cx},${cy - h * 0.62} ${cx + h * 0.58},${cy + h * 0.42} ${cx - h * 0.58},${cy + h * 0.42}` }, attrs), parent);
    }
    if (shape === "diamond") {
      const h = r * 1.7;
      return el("polygon", Object.assign({ points: `${cx},${cy - h / 2} ${cx + h / 2},${cy} ${cx},${cy + h / 2} ${cx - h / 2},${cy}` }, attrs), parent);
    }
    return el("circle", Object.assign({ cx, cy, r }, attrs), parent);
  }

  function renderRadar() {
    const container = document.getElementById("radar-chart");
    container.innerHTML = "";

    const pillarData = DATA.importance[radarState.pillarKey];
    const featureIds = Object.keys(pillarData);
    const n = featureIds.length;

    const size = 560;
    const cx = size / 2;
    const cy = size / 2;
    const R = size * 0.32;
    const labelR = R + 34;

    const svg = el("svg", { viewBox: `0 0 ${size} ${size}`, role: "img", "aria-label": `Radar chart of feature importance for ${radarState.pillarKey}` }, container);

    const angleFor = (i) => -Math.PI / 2 + i * (2 * Math.PI / n);
    const pointAt = (angle, radius) => ({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });

    // grid rings (1..5), ring at 3 styled as the neutral line
    for (let t = 1; t <= 5; t++) {
      const ringR = (t / 5) * R;
      const pts = featureIds.map((_, i) => pointAt(angleFor(i), ringR));
      const d = pts.map((p) => `${p.x},${p.y}`).join(" ");
      el("polygon", {
        points: d,
        class: t === 3 ? "radar-neutral" : "radar-grid",
      }, svg);
    }

    // spokes
    featureIds.forEach((_, i) => {
      const p = pointAt(angleFor(i), R);
      el("line", { x1: cx, y1: cy, x2: p.x, y2: p.y, class: "radar-spoke" }, svg);
    });

    // tick labels (on the vertical axis only, to avoid clutter)
    [1, 2, 3, 4, 5].forEach((t) => {
      const ringR = (t / 5) * R;
      el("text", { x: cx + 4, y: cy - ringR + 3, class: "radar-tick-label" }, svg).textContent = t;
    });

    // axis labels
    featureIds.forEach((fid, i) => {
      const angle = angleFor(i);
      const p = pointAt(angle, labelR);
      const cosA = Math.cos(angle);
      const anchor = Math.abs(cosA) < 0.15 ? "middle" : cosA > 0 ? "start" : "end";
      const lines = wrapLabel(pillarData[fid].name, 16);
      const text = el("text", {
        x: p.x, y: p.y, class: "radar-axis-label is-clickable", "text-anchor": anchor,
        tabindex: "0", role: "button", "aria-label": `${pillarData[fid].name} — view full description`,
      }, svg);
      text.setAttribute("data-feature", fid);
      const openDescription = () => window.openFeatureModal(fid);
      text.addEventListener("click", openDescription);
      text.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDescription(); }
      });
      lines.forEach((line, li) => {
        const tspan = document.createElementNS(SVG_NS, "tspan");
        tspan.setAttribute("x", p.x);
        tspan.setAttribute("dy", li === 0 ? (lines.length > 1 ? "-0.3em" : "0.32em") : "1.1em");
        tspan.textContent = line;
        text.appendChild(tspan);
      });
      // small feature id caption under the label
      const idTspan = document.createElementNS(SVG_NS, "tspan");
      idTspan.setAttribute("x", p.x);
      idTspan.setAttribute("dy", "1.2em");
      idTspan.setAttribute("class", "radar-tick-label");
      idTspan.textContent = fid;
      text.appendChild(idTspan);
    });

    // polygons per group
    const polyGroup = el("g", {}, svg);
    const vertexGroup = el("g", {}, svg);

    DATA.groups.forEach((g) => {
      const active = radarState.activeGroups.has(g);
      const color = cssVar(GROUP_META[g].varName);
      const pts = featureIds.map((fid, i) => {
        const stat = pillarData[fid].groups[g];
        const r = (stat.mean / 5) * R;
        return Object.assign(pointAt(angleFor(i), r), { fid, stat });
      });

      if (active) {
        el("polygon", {
          points: pts.map((p) => `${p.x},${p.y}`).join(" "),
          class: "radar-poly",
          fill: color,
          stroke: color,
          "data-group": g,
        }, polyGroup);
      }

      pts.forEach((p) => {
        if (!active) return;
        const vertex = drawShape(vertexGroup, GROUP_META[g].shape, p.x, p.y, 4.5, color, { class: "radar-vertex", "data-group": g });
        vertex.addEventListener("click", () => window.openFeatureModal(p.fid));
        vertex.addEventListener("mouseenter", (ev) => {
          svg.querySelectorAll(".radar-poly, .radar-vertex").forEach((node) => {
            if (node.getAttribute("data-group") !== g) node.classList.add("is-dimmed");
          });
          showTooltip(ev.pageX, ev.pageY, `
            <div class="tt-title">${pillarData[p.fid].name} — ${GROUP_META[g].label}</div>
            <div class="tt-row"><span>Mean importance</span><span>${p.stat.mean.toFixed(2)} / 5</span></div>
            <div class="tt-row"><span>Std. dev.</span><span>${p.stat.std.toFixed(2)}</span></div>
          `);
        });
        vertex.addEventListener("mousemove", (ev) => showTooltip(ev.pageX, ev.pageY, tooltip.innerHTML));
        vertex.addEventListener("mouseleave", () => {
          svg.querySelectorAll(".radar-poly, .radar-vertex").forEach((node) => node.classList.remove("is-dimmed"));
          hideTooltip();
        });
      });
    });
  }

  function renderRadarTable() {
    const wrap = document.getElementById("radar-table-wrap");
    const pillarData = DATA.importance[radarState.pillarKey];
    const featureIds = Object.keys(pillarData);
    let html = `<table class="data-table"><thead><tr><th>Feature</th>${DATA.groups.map((g) => `<th>${GROUP_META[g].label}</th>`).join("")}</tr></thead><tbody>`;
    featureIds.forEach((fid) => {
      const f = pillarData[fid];
      html += `<tr><td>${featureLink(fid, `${fid} — ${f.name}`)}</td>${DATA.groups.map((g) => `<td class="num">${f.groups[g].mean.toFixed(2)} ± ${f.groups[g].std.toFixed(2)}</td>`).join("")}</tr>`;
    });
    html += "</tbody></table>";
    wrap.innerHTML = html;
  }

  // ---------------------------------------------------------------------
  // Stat tiles
  // ---------------------------------------------------------------------
  function renderStatTiles() {
    const h = DATA.headline;
    const tiles = [
      { value: `${h.nStage1} → ${h.nStage2}`, label: "Panellists, Stage 1 → Stage 2", sub: "4 stakeholder groups × 4 participants in Stage 2" },
      { value: h.nFeatures, label: "Candidate features assessed", sub: `across ${DATA.pillars.length} Trustworthy AI pillars` },
      { value: `${h.kendallsW.stage1.toFixed(2)} → ${h.kendallsW.stage2.toFixed(2)}`, label: "Kendall's W (agreement)", sub: "higher = stronger cross-panel agreement" },
      { value: `${h.consensusRate.stage1}/${h.nFeatures} → ${h.consensusRate.stage2}/${h.nFeatures}`, label: "Features at consensus (IQR ≤ 1)", sub: "Stage 1 vs. Stage 2" },
    ];
    const wrap = document.getElementById("stat-tiles");
    wrap.innerHTML = tiles.map((t) => `
      <div class="stat-tile">
        <div class="stat-value">${t.value}</div>
        <div class="stat-label">${t.label}</div>
        <div class="stat-sub">${t.sub}</div>
      </div>
    `).join("");
  }

  // ---------------------------------------------------------------------
  // Consensus explorer (Stage 1 -> Stage 2)
  // ---------------------------------------------------------------------
  const consensusState = {
    pillar: "all",
    query: "",
    activeStatuses: new Set(STATUS_ORDER),
    view: "chart",
  };

  function tierColor(tier) {
    return cssVar(TIER_META[tier].varName);
  }

  function filteredConsensus() {
    return DATA.consensus.filter((f) => {
      if (consensusState.pillar !== "all" && String(f.pillar) !== consensusState.pillar) return false;
      if (!consensusState.activeStatuses.has(f.status)) return false;
      if (consensusState.query) {
        const q = consensusState.query.toLowerCase();
        if (!f.name.toLowerCase().includes(q) && !f.id.includes(q)) return false;
      }
      return true;
    });
  }

  function renderConsensusControls() {
    const pillarSelect = document.getElementById("consensus-pillar-filter");
    pillarSelect.innerHTML = `<option value="all">All pillars</option>` +
      DATA.pillars.map((p) => `<option value="${p.num}">Pillar ${p.num}: ${p.name}</option>`).join("");
    pillarSelect.addEventListener("change", (e) => {
      consensusState.pillar = e.target.value;
      renderConsensusBody();
    });

    const search = document.getElementById("consensus-search");
    search.addEventListener("input", (e) => {
      consensusState.query = e.target.value.trim();
      renderConsensusBody();
    });

    document.getElementById("consensus-view-toggle").addEventListener("click", (e) => {
      consensusState.view = consensusState.view === "chart" ? "table" : "chart";
      e.target.textContent = consensusState.view === "chart" ? "View as table" : "View as chart";
      renderConsensusBody();
    });
  }

  function renderStatusSummary() {
    const counts = DATA.headline.statusCounts;
    const total = DATA.headline.nFeatures;
    const bar = document.getElementById("status-summary-bar");
    bar.innerHTML = STATUS_ORDER.map((status) => {
      const n = counts[status] || 0;
      const tier = statusTier(status);
      const pct = (n / total) * 100;
      return `<div class="seg" data-status="${status}" style="width:${pct}%; background:${tierColor(tier)}" title="${status}: ${n}"></div>`;
    }).join("");

    bar.querySelectorAll(".seg").forEach((seg) => {
      seg.addEventListener("mouseenter", (ev) => {
        const status = seg.getAttribute("data-status");
        showTooltip(ev.pageX, ev.pageY, `<div class="tt-title">${status}</div><div class="tt-row"><span>Features</span><span>${counts[status]} / ${total}</span></div>`);
      });
      seg.addEventListener("mousemove", (ev) => showTooltip(ev.pageX, ev.pageY, tooltip.innerHTML));
      seg.addEventListener("mouseleave", hideTooltip);
      seg.addEventListener("click", () => {
        const status = seg.getAttribute("data-status");
        if (consensusState.activeStatuses.has(status) && consensusState.activeStatuses.size === 1) return;
        if (consensusState.activeStatuses.has(status)) consensusState.activeStatuses.delete(status);
        else consensusState.activeStatuses.add(status);
        renderStatusLegend();
        renderConsensusBody();
      });
    });
  }

  function statusTier(status) {
    for (const f of DATA.consensus) if (f.status === status) return f.tier;
    // fallback map mirrors build_evaluation_data.py STATUS_TIER
    return { "Consensus Reached": "good", "Strengthened": "good", "Maintained": "good", "Converging": "warning", "Stable/Diverged": "serious", "Consensus Lost": "critical" }[status];
  }

  function renderStatusLegend() {
    const counts = DATA.headline.statusCounts;
    const wrap = document.getElementById("status-legend");
    wrap.innerHTML = STATUS_ORDER.map((status) => {
      const tier = statusTier(status);
      const off = consensusState.activeStatuses.has(status) ? "" : " is-off";
      return `<span class="item${off}" data-status="${status}">
        <span class="status-dot" style="background:${tierColor(tier)}"></span>${status} (${counts[status] || 0})
      </span>`;
    }).join("");
    wrap.querySelectorAll(".item").forEach((item) => {
      item.addEventListener("click", () => {
        const status = item.getAttribute("data-status");
        if (consensusState.activeStatuses.has(status) && consensusState.activeStatuses.size === 1) return;
        if (consensusState.activeStatuses.has(status)) consensusState.activeStatuses.delete(status);
        else consensusState.activeStatuses.add(status);
        renderStatusLegend();
        renderConsensusBody();
      });
    });
  }

  function renderConsensusBody() {
    const items = filteredConsensus().slice().sort((a, b) => a.pillar - b.pillar || a.id.localeCompare(b.id, undefined, { numeric: true }));
    document.getElementById("consensus-count").textContent = `${items.length} of ${DATA.headline.nFeatures} features shown`;

    if (consensusState.view === "table") {
      renderConsensusTable(items);
    } else {
      renderSlopeChart(items);
    }
  }

  function renderSlopeChart(items) {
    const wrap = document.getElementById("consensus-viz");
    wrap.innerHTML = "";
    document.getElementById("consensus-table-wrap").innerHTML = "";

    if (!items.length) {
      wrap.innerHTML = `<p class="text-muted">No features match the current filters.</p>`;
      return;
    }

    const rowH = 24;
    const topPad = 30;
    const leftPad = 190;
    const rightPad = 30;
    const chartW = 560;
    const width = leftPad + chartW + rightPad;
    const height = topPad + items.length * rowH + 10;

    const container = document.createElement("div");
    container.className = "slope-chart-wrap";
    const svg = el("svg", { viewBox: `0 0 ${width} ${height}`, width: "100%", height: height, role: "img", "aria-label": "Stage 1 to Stage 2 median importance change" }, container);

    const xFor = (v) => leftPad + ((v - 1) / 4) * chartW;

    // gridlines + axis labels (1..5)
    for (let v = 1; v <= 5; v++) {
      const x = xFor(v);
      el("line", { x1: x, y1: topPad - 12, x2: x, y2: height - 6, class: "slope-grid" }, svg);
      el("text", { x, y: topPad - 18, class: "slope-axis-label", "text-anchor": "middle" }, svg).textContent = v;
    }

    items.forEach((f, i) => {
      const y = topPad + i * rowH + rowH / 2;
      const color = tierColor(f.tier);
      const x1 = xFor(f.s1Median);
      const x2 = xFor(f.s2Median);

      const rowLabel = el("text", {
        x: leftPad - 12, y: y + 4, class: "slope-row-label is-clickable", "text-anchor": "end",
        tabindex: "0", role: "button", "aria-label": `${f.name} — view full description`,
      }, svg);
      rowLabel.textContent = `${f.id} ${f.name}`.length > 30 ? `${f.id} ${f.name}`.slice(0, 28) + "…" : `${f.id} ${f.name}`;
      const openDescription = () => window.openFeatureModal(f.id);
      rowLabel.addEventListener("click", openDescription);
      rowLabel.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDescription(); }
      });

      el("line", { x1, y1: y, x2, y2: y, class: "slope-line", stroke: color }, svg);

      const dot1 = el("circle", { cx: x1, cy: y, r: 5, fill: "var(--surface-1)", stroke: color, "stroke-width": 2, class: "slope-dot" }, svg);
      const dot2 = el("circle", { cx: x2, cy: y, r: 5, fill: color, class: "slope-dot" }, svg);

      [[dot1, "Stage 1", f.s1Median, f.s1IQR], [dot2, "Stage 2", f.s2Median, f.s2IQR]].forEach(([dot, stage, median, iqr]) => {
        dot.addEventListener("click", openDescription);
        dot.addEventListener("mouseenter", (ev) => {
          showTooltip(ev.pageX, ev.pageY, `
            <div class="tt-title">${f.id} — ${f.name}</div>
            <div class="tt-row"><span>${stage} median</span><span>${median.toFixed(2)}</span></div>
            <div class="tt-row"><span>${stage} IQR</span><span>${iqr.toFixed(2)}</span></div>
            <div class="tt-row"><span>Status</span><span>${f.status}</span></div>
          `);
        });
        dot.addEventListener("mousemove", (ev) => showTooltip(ev.pageX, ev.pageY, tooltip.innerHTML));
        dot.addEventListener("mouseleave", hideTooltip);
      });
    });

    container.appendChild(svg);
    wrap.appendChild(container);

    const legend = document.createElement("div");
    legend.className = "legend-hint";
    legend.textContent = "Hollow dot = Stage 1 median · Filled dot = Stage 2 median · line color = consensus outcome. Click a feature name or dot to read its full description.";
    wrap.appendChild(legend);
  }

  function renderConsensusTable(items) {
    document.getElementById("consensus-viz").innerHTML = "";
    const wrap = document.getElementById("consensus-table-wrap");
    let html = `<table class="data-table"><thead><tr>
      <th>Feature</th><th>Pillar</th><th>S1 median (IQR)</th><th>S2 median (IQR)</th><th>Outcome</th>
    </tr></thead><tbody>`;
    items.forEach((f) => {
      const pillarName = DATA.pillars.find((p) => p.num === f.pillar).name;
      html += `<tr>
        <td>${featureLink(f.id, `${f.id} — ${f.name}`)}</td>
        <td>${f.pillar}. ${pillarName}</td>
        <td class="num">${f.s1Median.toFixed(2)} (${f.s1IQR.toFixed(2)})</td>
        <td class="num">${f.s2Median.toFixed(2)} (${f.s2IQR.toFixed(2)})</td>
        <td><span class="status-dot" style="background:${tierColor(f.tier)}; display:inline-block; margin-right:6px;"></span>${f.status}</td>
      </tr>`;
    });
    html += "</tbody></table>";
    wrap.innerHTML = html;
  }

  // ---------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    renderStatTiles();
    renderPillarTabs();
    renderGroupLegend();
    renderRadar();
    renderRadarTable();

    renderConsensusControls();
    renderStatusSummary();
    renderStatusLegend();
    renderConsensusBody();

    document.getElementById("radar-table-toggle").addEventListener("click", (e) => {
      const wrap = document.getElementById("radar-table-wrap");
      const showing = wrap.style.display !== "none";
      wrap.style.display = showing ? "none" : "block";
      e.target.textContent = showing ? "View as table" : "Hide table";
    });
  });
})();
