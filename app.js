/* sitemath — UI wiring. All handlers attached here (CSP forbids inline script). */
(function () {
  'use strict';

  const E = Engine;
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const LS_PROJECTS = 'sitemath.projects.v1';
  const LS_CURRENT = 'sitemath.current.v1';
  const LS_THEME = 'sitemath.theme';

  /* ---------------- state ---------------- */

  function defaultLayers() {
    return {
      putty: { coeffId: 'putty_birla', coats: 2, on: true },
      primer: { coeffId: 'primer_interior', coats: 1, on: true },
      topcoat: { coeffId: 'paint_tractor', coats: 2, on: true }
    };
  }

  function newProject(name) {
    return {
      name,
      unit: 'm',
      door: { w: 0.9, h: 2.1 },
      win: { w: 1.2, h: 1.2 },
      rooms: [{ id: 'r1', name: 'Room 1', L: 4, W: 3, H: 2.75, doors: 1, windows: 1, ceiling: false }],
      preset: 'fresh',
      layers: defaultLayers(),
      overrides: {},
      tile: { source: 'direct', areaM2: 12, sizeId: 'tile_600x600', customL: 600, customW: 600, lay: 'straight', wastage: null, perBox: 4 }
    };
  }

  let projects = {};
  let currentName = '';
  let state = null;

  function load() {
    try { projects = JSON.parse(localStorage.getItem(LS_PROJECTS)) || {}; } catch { projects = {}; }
    currentName = localStorage.getItem(LS_CURRENT) || '';
    if (!currentName || !projects[currentName]) {
      currentName = Object.keys(projects)[0] || 'My project';
      if (!projects[currentName]) projects[currentName] = newProject(currentName);
    }
    state = projects[currentName];
  }

  function save() {
    projects[currentName] = state;
    try {
      localStorage.setItem(LS_PROJECTS, JSON.stringify(projects));
      localStorage.setItem(LS_CURRENT, currentName);
    } catch { /* storage full/blocked — session continues in memory */ }
  }

  /* ---------------- derived values ---------------- */

  function openingsFor(room) {
    return [
      { w: state.door.w, h: state.door.h, count: room.doors || 0 },
      { w: state.win.w, h: state.win.h, count: room.windows || 0 }
    ];
  }

  function projectAreas() {
    let netWall = 0, ceiling = 0;
    for (const room of state.rooms) {
      const a = E.roomAreas({ L: room.L, W: room.W, H: room.H, unit: state.unit, ceiling: room.ceiling, openings: openingsFor(room) });
      netWall = E.round2(netWall + a.netWall);
      ceiling = E.round2(ceiling + a.ceiling);
    }
    return { netWall, ceiling, total: E.round2(netWall + ceiling) };
  }

  function coeffById(id) { return E.getCoeff(id); }

  function effBandM2(coeff) {
    const eff = E.effectiveBand(coeff, state.overrides);
    const pseudo = { id: coeff.id, band: eff.band, coats_basis: coeff.coats_basis };
    return { m2: E.bandToM2PerCoat(pseudo), overridden: eff.overridden, band: eff.band };
  }

  function layerQty(key) {
    const cfg = state.layers[key];
    if (!cfg.on) return null;
    const coeff = coeffById(cfg.coeffId);
    const eff = effBandM2(coeff);
    const area = projectAreas().total;
    if (key === 'putty') {
      return { unit: 'kg', range: E.puttyKg(area, eff.m2), coeff, overridden: eff.overridden };
    }
    return { unit: 'L', range: E.litresBand(area, cfg.coats, eff.m2), coeff, overridden: eff.overridden };
  }

  function packsFor(unit) {
    return coeffById(unit === 'kg' ? 'pack_putty' : 'pack_emulsion').packs;
  }

  function fmtPacks(fill, unit) {
    const parts = Object.entries(fill)
      .map(([size, n]) => [Number(size), n])
      .sort((a, b) => b[0] - a[0])
      .map(([size, n]) => `${n} × ${size} ${unit}`);
    if (!parts.length) return '—';
    const total = Object.entries(fill).reduce((s, [size, n]) => s + Number(size) * n, 0);
    return `${parts.join(' + ')} (${total} ${unit})`;
  }

  function tileInputs() {
    const t = state.tile;
    let dims;
    if (t.sizeId === 'custom') dims = [t.customL || 600, t.customW || 600];
    else dims = coeffById(t.sizeId).dims_mm;
    const wastageDefault = coeffById(t.lay === 'diagonal' ? 'tile_wastage_diagonal' : 'tile_wastage_straight').band.min;
    const wastage = (t.wastage === null || t.wastage === undefined || t.wastage === '') ? wastageDefault : Number(t.wastage);
    return { dims, wastage, wastageDefault };
  }

  function tileResult() {
    const t = state.tile;
    const { dims, wastage } = tileInputs();
    let tiles, areaM2;
    if (t.source === 'direct') {
      areaM2 = Number(t.areaM2) || 0;
      if (areaM2 <= 0) return null;
      tiles = E.tileCountFromArea(areaM2, dims[0], dims[1], wastage);
    } else {
      const room = state.rooms.find((r) => r.id === t.source);
      if (!room) return null;
      const f = state.unit === 'ft' ? 0.3048 : 1;
      const Lmm = Math.round(room.L * f * 1000), Wmm = Math.round(room.W * f * 1000);
      areaM2 = E.round2((Lmm / 1000) * (Wmm / 1000));
      tiles = E.tileCount(Lmm, Wmm, dims[0], dims[1], wastage);
    }
    const bx = E.boxes(tiles, Math.max(1, Math.round(t.perBox) || 1));
    return { tiles, areaM2, dims, wastage, ...bx };
  }

  /* ---------------- rendering ---------------- */

  function chipHtml(coeff, overridden) {
    const cls = overridden ? 'chip yours' : (coeff.beta ? 'chip beta' : 'chip');
    const tag = overridden ? 'your value' : (coeff.beta ? 'beta' : 'cited');
    return `<button class="${cls}" type="button" data-src="${coeff.id}"><span class="dot"></span>${tag} · ${bandLabel(coeff)}</button>`;
  }

  function bandLabel(coeff) {
    const eff = E.effectiveBand(coeff, state.overrides).band;
    const u = { sqft_per_L: 'sq.ft/L', m2_per_kg: 'm²/kg', percent: '%', mm: 'mm' }[eff.unit] || eff.unit;
    if (eff.min === eff.max) return `${eff.min} ${u}`;
    return `${eff.min}–${eff.max} ${u}`;
  }

  function renderProjectControls() {
    const sel = $('#projectSelect');
    sel.innerHTML = '';
    for (const name of Object.keys(projects)) {
      const o = document.createElement('option');
      o.value = name; o.textContent = name; o.selected = name === currentName;
      sel.appendChild(o);
    }
    $$('input[name="unit"]').forEach((r) => { r.checked = r.value === state.unit; });
    $('#doorW').value = state.door.w; $('#doorH').value = state.door.h;
    $('#winW').value = state.win.w; $('#winH').value = state.win.h;
    $$('input[name="preset"]').forEach((r) => { r.checked = r.value === state.preset; });
  }

  function renderRooms() {
    const wrap = $('#roomList');
    wrap.innerHTML = '';
    const u = state.unit;
    state.rooms.forEach((room) => {
      const a = E.roomAreas({ L: room.L, W: room.W, H: room.H, unit: u, ceiling: room.ceiling, openings: openingsFor(room) });
      const row = document.createElement('div');
      row.className = 'room-row';
      row.innerHTML = `
        <div><label for="rn-${room.id}">Room</label><input id="rn-${room.id}" type="text" value="${escapeHtml(room.name)}" data-room="${room.id}" data-k="name"></div>
        <div><label for="rl-${room.id}">L (${u})</label><input id="rl-${room.id}" type="number" step="0.01" min="0" value="${room.L}" data-room="${room.id}" data-k="L"></div>
        <div><label for="rw-${room.id}">W (${u})</label><input id="rw-${room.id}" type="number" step="0.01" min="0" value="${room.W}" data-room="${room.id}" data-k="W"></div>
        <div><label for="rh-${room.id}">H (${u})</label><input id="rh-${room.id}" type="number" step="0.01" min="0" value="${room.H}" data-room="${room.id}" data-k="H"></div>
        <div><label for="rd-${room.id}">Doors</label><input id="rd-${room.id}" type="number" step="1" min="0" value="${room.doors}" data-room="${room.id}" data-k="doors"></div>
        <div><label for="rwi-${room.id}">Windows</label><input id="rwi-${room.id}" type="number" step="1" min="0" value="${room.windows}" data-room="${room.id}" data-k="windows"></div>
        <div class="ceil"><input id="rc-${room.id}" type="checkbox" ${room.ceiling ? 'checked' : ''} data-room="${room.id}" data-k="ceiling"><label for="rc-${room.id}" class="m0">+ ceiling</label></div>
        <div class="room-actions">
          <span class="num room-net">net <strong>${a.netWall.toFixed(2)}</strong>${room.ceiling ? ` + ceil ${a.ceiling.toFixed(2)}` : ''} m²</span>
          <button class="small danger" type="button" data-del-room="${room.id}" aria-label="Remove ${escapeHtml(room.name)}">✕</button>
        </div>`;
      wrap.appendChild(row);
    });
    const t = projectAreas();
    $('#netAreaReadout').textContent = `${t.total.toFixed(2)} m² · ${E.toSqFt(t.total).toFixed(2)} sq ft`;
    $('#netAreaSub').textContent =
      `Walls ${t.netWall.toFixed(2)} m² after deductions${t.ceiling ? ` + ceilings ${t.ceiling.toFixed(2)} m²` : ''}. ` +
      'Deductions subtract from wall area only — never the ceiling. Conversion: 1 m² = 10.7639 sq ft.';
  }

  const LAYER_META = {
    putty: { label: 'Putty', options: ['putty_birla'] },
    primer: { label: 'Primer', options: ['primer_interior', 'primer_exterior'] },
    topcoat: {
      label: 'Topcoat',
      options: ['paint_tractor', 'paint_apcolite', 'paint_royale', 'paint_bison_glow', 'paint_dulux_global', 'paint_apex', 'paint_weathercoat']
    }
  };

  function renderLayers() {
    const tb = $('#layerTable tbody');
    tb.innerHTML = '';
    for (const key of ['putty', 'primer', 'topcoat']) {
      const meta = LAYER_META[key];
      const cfg = state.layers[key];
      const coeff = coeffById(cfg.coeffId);
      const q = layerQty(key);
      const opts = meta.options.map((id) => {
        const c = coeffById(id);
        return `<option value="${id}" ${id === cfg.coeffId ? 'selected' : ''}>${escapeHtml(c.label)}${c.beta ? ' [beta band]' : ''}</option>`;
      }).join('');
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><label class="layer-on">
          <input type="checkbox" data-layer-on="${key}" ${cfg.on ? 'checked' : ''}> ${meta.label}</label></td>
        <td>
          <select data-layer-coeff="${key}" aria-label="${meta.label} product class" ${cfg.on ? '' : 'disabled'}>${opts}</select>
          <div class="mt4">${chipHtml(coeff, q ? q.overridden : E.effectiveBand(coeff, state.overrides).overridden)}</div>
        </td>
        <td>${key === 'putty'
          ? '<span class="num room-net">per coverage basis</span>'
          : `<input type="number" step="1" min="1" max="5" value="${cfg.coats}" data-layer-coats="${key}" class="w45" aria-label="${meta.label} coats" ${cfg.on ? '' : 'disabled'}>`}</td>
        <td class="qty">${q ? `<span class="range num">${q.range.min.toFixed(2)} – <strong>${q.range.max.toFixed(2)}</strong> ${q.unit}</span>` : '<span class="muted">off</span>'}</td>`;
      tb.appendChild(tr);
    }
  }

  function renderShopping() {
    const tb = $('#shopTable tbody');
    tb.innerHTML = '';
    for (const key of ['putty', 'primer', 'topcoat']) {
      const q = layerQty(key);
      if (!q) continue;
      const packs = packsFor(q.unit);
      const fill = E.packFill(q.range.max, packs);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${LAYER_META[key].label} — ${escapeHtml(q.coeff.label)}${q.overridden ? ' <span class="badge-yours">your value</span>' : (q.coeff.beta ? ' <span class="badge-beta">beta</span>' : '')}</td>
        <td class="qty num">${q.range.min.toFixed(2)} ${q.unit}</td>
        <td class="qty num">${q.range.max.toFixed(2)} ${q.unit}</td>
        <td class="qty"><span class="buy num">${fmtPacks(fill, q.unit)}</span></td>`;
      tb.appendChild(tr);
    }
    const tr2 = document.createElement('tr');
    const t = tileResult();
    if (t) {
      tr2.innerHTML = `
        <td>Tiles — ${t.dims[0]} × ${t.dims[1]} mm @ ${t.wastage}% wastage</td>
        <td class="qty num">${t.tiles} tiles</td>
        <td class="qty num">${t.tiles} tiles</td>
        <td class="qty"><span class="buy num">${t.boxes} boxes of ${Math.max(1, Math.round(state.tile.perBox) || 1)} (${t.spare} spare)</span></td>`;
      tb.appendChild(tr2);
    }
  }

  function renderTiles() {
    const selSrc = $('#tileSource');
    selSrc.innerHTML = `<option value="direct" ${state.tile.source === 'direct' ? 'selected' : ''}>Direct area</option>` +
      state.rooms.map((r) => `<option value="${r.id}" ${state.tile.source === r.id ? 'selected' : ''}>${escapeHtml(r.name)} floor (L × W)</option>`).join('');
    $('#tileArea').value = state.tile.areaM2;
    $('#tileArea').disabled = state.tile.source !== 'direct';

    const selSize = $('#tileSize');
    const sizes = COEFFS.filter((c) => c.module === 'tile' && c.layer === 'size');
    selSize.innerHTML = sizes.map((c) => `<option value="${c.id}" ${state.tile.sizeId === c.id ? 'selected' : ''}>${c.dims_mm[0]} × ${c.dims_mm[1]} mm</option>`).join('') +
      `<option value="custom" ${state.tile.sizeId === 'custom' ? 'selected' : ''}>Custom (mm)</option>`;
    $('#customTileWrap').hidden = state.tile.sizeId !== 'custom';
    $('#tileCustomL').value = state.tile.customL;
    $('#tileCustomW').value = state.tile.customW;
    $('#tileLay').value = state.tile.lay;
    const ti = tileInputs();
    $('#tileWastage').value = ti.wastage;
    $('#tileBox').value = state.tile.perBox;

    const res = tileResult();
    if (res) {
      $('#tileReadout').textContent = `${res.tiles} tiles · ${res.boxes} boxes (${res.spare} spare)`;
      $('#tileSub').textContent =
        `${res.areaM2.toFixed(2)} m² in ${res.dims[0]} × ${res.dims[1]} mm tiles at ${res.wastage}% wastage — integer-mm math, single round-up, then boxes of ${Math.max(1, Math.round(state.tile.perBox) || 1)}.`;
    } else {
      $('#tileReadout').textContent = '—';
      $('#tileSub').textContent = 'Enter an area or pick a room.';
    }
  }

  function renderCoeffs() {
    $('#coeffCount').textContent = COEFFS.length;
    const wrap = $('#coeffList');
    wrap.innerHTML = '';
    const groups = [['paint', 'Paint, primer & putty coverage'], ['convention', 'Conventions'], ['tile', 'Tiles'], ['unit', 'Units & pack ladders']];
    for (const [mod, title] of groups) {
      const h = document.createElement('h3');
      h.textContent = title;
      wrap.appendChild(h);
      for (const c of COEFFS.filter((x) => x.module === mod)) {
        const ov = state.overrides[c.id];
        const card = document.createElement('div');
        card.className = 'coeff-card';
        card.innerHTML = `
          <div class="coeff-head">
            <span class="band">${bandLabel(c)}</span>
            ${c.beta ? '<span class="badge-beta">beta</span>' : ''}
            ${ov ? '<span class="badge-yours">your value</span>' : ''}
            <span>${escapeHtml(c.label)}</span>
          </div>
          <blockquote>“${escapeHtml(c.source_quote)}”</blockquote>
          <p class="meta">${escapeHtml(c.source_title)} · verified on <span class="num">${c.verified_on}</span> ·
            <a href="${c.source_url}" rel="noopener">source</a><br>${escapeHtml(c.verified_how)}</p>
          <button class="small" type="button" data-src="${c.id}">${isOverridable(c) ? 'View / override' : 'View source card'}</button>`;
        wrap.appendChild(card);
      }
    }
  }

  function isOverridable(c) {
    return ['sqft_per_L', 'm2_per_kg', 'percent'].includes(c.band.unit);
  }

  function renderAll() {
    renderProjectControls();
    renderRooms();
    renderLayers();
    renderShopping();
    renderTiles();
    renderCoeffs();
    save();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  }

  /* ---------------- source / override dialog ---------------- */

  let dialogCoeffId = null;

  function openSourceCard(id) {
    const c = coeffById(id);
    if (!c) return;
    dialogCoeffId = id;
    const ov = state.overrides[id];
    $('#srcTitle').textContent = c.label;
    const overridable = isOverridable(c);
    $('#srcBody').innerHTML = `
      <p><span class="band num">${bandLabel(c)}</span>
        ${c.beta ? ' <span class="badge-beta">beta</span>' : ''} ${ov ? ' <span class="badge-yours">your value</span>' : ''}</p>
      <p class="note">Published band: <span class="num">${c.band.min === c.band.max ? c.band.min : c.band.min + '–' + c.band.max}</span>
        ${c.band.unit.replace(/_/g, ' ')} · coats basis: ${escapeHtml(String(c.coats_basis))}</p>
      <blockquote>“${escapeHtml(c.source_quote)}”</blockquote>
      <p class="meta">${escapeHtml(c.source_title)}<br>
        Verified on <span class="num">${c.verified_on}</span> · ${escapeHtml(c.verified_how)}<br>
        <a href="${c.source_url}" rel="noopener">${escapeHtml(c.source_url)}</a></p>
      ${overridable ? `
      <fieldset class="mt8"><legend>Override with your tin's figure (${c.band.unit.replace(/_/g, ' ')})</legend>
        <div class="grid cols-3 gap6">
          <div><label for="ovMin">Min</label><input id="ovMin" type="number" step="0.01" value="${ov ? ov.min : c.band.min}"></div>
          <div><label for="ovMax">Max</label><input id="ovMax" type="number" step="0.01" value="${ov ? ov.max : c.band.max}"></div>
        </div>
        <p class="note-sm">Same value in both = a single-figure override. Marked “your value” everywhere it flows.</p>
      </fieldset>` : '<p class="note-sm">This entry is informational; nothing to override.</p>'}`;
    $('#btnApplyOverride').hidden = !overridable;
    $('#btnClearOverride').hidden = !(overridable && ov);
    $('#srcDialog').showModal();
  }

  /* ---------------- exports ---------------- */

  function download(filename, text, mime) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: mime }));
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function csvRows() {
    const areas = projectAreas();
    const rows = [
      ['sitemath site list', state.name, new Date().toISOString().slice(0, 10)],
      [],
      ['Room', `L (${state.unit})`, `W (${state.unit})`, `H (${state.unit})`, 'Doors', 'Windows', 'Ceiling', 'Net wall m2', 'Ceiling m2']
    ];
    for (const room of state.rooms) {
      const a = E.roomAreas({ L: room.L, W: room.W, H: room.H, unit: state.unit, ceiling: room.ceiling, openings: openingsFor(room) });
      rows.push([room.name, room.L, room.W, room.H, room.doors, room.windows, room.ceiling ? 'yes' : 'no', a.netWall.toFixed(2), a.ceiling.toFixed(2)]);
    }
    rows.push([], ['Net paintable area m2', areas.total.toFixed(2)], ['Net paintable area sq ft', E.toSqFt(areas.total).toFixed(2)], []);
    rows.push(['Layer', 'Product class', 'Band', 'Source status', 'Best case', 'Worst case', 'Buy']);
    for (const key of ['putty', 'primer', 'topcoat']) {
      const q = layerQty(key);
      if (!q) continue;
      const fill = E.packFill(q.range.max, packsFor(q.unit));
      rows.push([LAYER_META[key].label, q.coeff.label, bandLabel(q.coeff),
        q.overridden ? 'your value' : (q.coeff.beta ? 'beta — verify on your tin' : 'cited, verified ' + q.coeff.verified_on),
        q.range.min.toFixed(2) + ' ' + q.unit, q.range.max.toFixed(2) + ' ' + q.unit, fmtPacks(fill, q.unit)]);
    }
    const t = tileResult();
    if (t) {
      rows.push([], ['Tiles', `${t.dims[0]}x${t.dims[1]} mm`, `${t.wastage}% wastage`, `${t.areaM2.toFixed(2)} m2`, `${t.tiles} tiles`, `${t.boxes} boxes`, `${t.spare} spare`]);
    }
    rows.push([], ['Estimates from manufacturer-published coverage bands; actual consumption varies with surface. Not a quotation.']);
    return rows;
  }

  /* ---------------- events ---------------- */

  function bind() {
    // theme
    $('#btnTheme').addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(cur);
      localStorage.setItem(LS_THEME, cur);
    });

    // project controls
    $('#projectSelect').addEventListener('change', (e) => {
      currentName = e.target.value;
      state = projects[currentName];
      renderAll();
    });
    $('#btnNewProject').addEventListener('click', () => {
      const name = uniqueName(prompt('New project name?', 'Project ' + (Object.keys(projects).length + 1)));
      if (!name) return;
      projects[name] = newProject(name);
      currentName = name; state = projects[name];
      renderAll();
    });
    $('#btnDupProject').addEventListener('click', () => {
      const name = uniqueName(prompt('Duplicate as?', state.name + ' copy'));
      if (!name) return;
      projects[name] = JSON.parse(JSON.stringify(state));
      projects[name].name = name;
      currentName = name; state = projects[name];
      renderAll();
    });
    $('#btnRenameProject').addEventListener('click', () => {
      const name = uniqueName(prompt('Rename to?', state.name));
      if (!name) return;
      delete projects[currentName];
      state.name = name; projects[name] = state; currentName = name;
      renderAll();
    });
    $('#btnDeleteProject').addEventListener('click', () => {
      if (!confirm(`Delete project “${currentName}” from this browser?`)) return;
      delete projects[currentName];
      currentName = Object.keys(projects)[0] || 'My project';
      if (!projects[currentName]) projects[currentName] = newProject(currentName);
      state = projects[currentName];
      renderAll();
    });

    // units + opening sizes + preset
    document.addEventListener('change', (e) => {
      const t = e.target;
      if (t.name === 'unit') { state.unit = t.value; renderAll(); return; }
      if (t.name === 'preset') {
        state.preset = t.value;
        if (t.value === 'fresh') state.layers = defaultLayers();
        else {
          state.layers.putty.on = false;
          state.layers.primer.on = false;
          state.layers.topcoat.on = true;
          state.layers.topcoat.coats = 2;
        }
        renderAll(); return;
      }
      if (t.id === 'doorW') { state.door.w = num(t.value); renderAll(); return; }
      if (t.id === 'doorH') { state.door.h = num(t.value); renderAll(); return; }
      if (t.id === 'winW') { state.win.w = num(t.value); renderAll(); return; }
      if (t.id === 'winH') { state.win.h = num(t.value); renderAll(); return; }

      // room fields
      if (t.dataset.room) {
        const room = state.rooms.find((r) => r.id === t.dataset.room);
        if (room) {
          const k = t.dataset.k;
          if (k === 'name') room.name = t.value || room.name;
          else if (k === 'ceiling') room.ceiling = t.checked;
          else room[k] = num(t.value);
          renderAll();
        }
        return;
      }
      // layers
      if (t.dataset.layerOn) { state.layers[t.dataset.layerOn].on = t.checked; renderAll(); return; }
      if (t.dataset.layerCoeff) { state.layers[t.dataset.layerCoeff].coeffId = t.value; renderAll(); return; }
      if (t.dataset.layerCoats) { state.layers[t.dataset.layerCoats].coats = Math.max(1, Math.round(num(t.value)) || 1); renderAll(); return; }
      // tiles
      if (t.id === 'tileSource') { state.tile.source = t.value; renderAll(); return; }
      if (t.id === 'tileArea') { state.tile.areaM2 = num(t.value); renderAll(); return; }
      if (t.id === 'tileSize') { state.tile.sizeId = t.value; renderAll(); return; }
      if (t.id === 'tileCustomL') { state.tile.customL = Math.max(10, Math.round(num(t.value))); renderAll(); return; }
      if (t.id === 'tileCustomW') { state.tile.customW = Math.max(10, Math.round(num(t.value))); renderAll(); return; }
      if (t.id === 'tileLay') { state.tile.lay = t.value; state.tile.wastage = null; renderAll(); return; }
      if (t.id === 'tileWastage') { state.tile.wastage = num(t.value); renderAll(); return; }
      if (t.id === 'tileBox') { state.tile.perBox = Math.max(1, Math.round(num(t.value)) || 1); renderAll(); return; }
    });

    // add / delete room, source chips (delegated clicks)
    document.addEventListener('click', (e) => {
      const srcBtn = e.target.closest('[data-src]');
      if (srcBtn) { openSourceCard(srcBtn.dataset.src); return; }
      const del = e.target.closest('[data-del-room]');
      if (del) {
        state.rooms = state.rooms.filter((r) => r.id !== del.dataset.delRoom);
        if (state.tile.source === del.dataset.delRoom) state.tile.source = 'direct';
        renderAll();
        return;
      }
    });
    $('#btnAddRoom').addEventListener('click', () => {
      const id = 'r' + (Date.now() % 1e7);
      state.rooms.push({ id, name: 'Room ' + (state.rooms.length + 1), L: 3, W: 3, H: 2.75, doors: 1, windows: 1, ceiling: false });
      renderAll();
    });

    // dialog buttons
    $('#btnApplyOverride').addEventListener('click', () => {
      const min = num($('#ovMin').value), max = num($('#ovMax').value);
      if (!(min > 0) || !(max > 0) || min > max) { alert('Override needs 0 < min ≤ max.'); return; }
      state.overrides[dialogCoeffId] = { min, max };
      $('#srcDialog').close();
      renderAll();
    });
    $('#btnClearOverride').addEventListener('click', () => {
      delete state.overrides[dialogCoeffId];
      $('#srcDialog').close();
      renderAll();
    });

    // exports
    $('#btnPrint').addEventListener('click', () => window.print());
    $('#btnCsv').addEventListener('click', () => {
      download(slug(state.name) + '-site-list.csv', E.toCsv(csvRows()), 'text/csv');
    });
    $('#btnBackup').addEventListener('click', () => {
      download('sitemath-backup.json', JSON.stringify({ app: 'sitemath', version: 1, projects }, null, 2), 'application/json');
    });
    $('#btnRestore').addEventListener('click', () => $('#fileRestore').click());
    $('#fileRestore').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          if (data.app !== 'sitemath' || !data.projects) throw new Error('not a sitemath backup');
          projects = data.projects;
          currentName = Object.keys(projects)[0] || 'My project';
          if (!projects[currentName]) projects[currentName] = newProject(currentName);
          state = projects[currentName];
          renderAll();
        } catch (err) {
          alert('Could not restore: ' + err.message);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  }

  function num(v) { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project'; }
  function uniqueName(name) {
    if (!name) return null;
    name = name.trim();
    if (!name) return null;
    let n = name, i = 2;
    while (projects[n] && n !== currentName) n = name + ' ' + i++;
    return n;
  }

  function applyTheme(mode) {
    document.documentElement.setAttribute('data-theme', mode);
    const btn = $('#btnTheme');
    btn.setAttribute('aria-pressed', String(mode === 'dark'));
    btn.textContent = mode === 'dark' ? 'Light scheme' : 'Dark scheme';
  }

  /* ---------------- boot ---------------- */

  const savedTheme = localStorage.getItem(LS_THEME);
  applyTheme(savedTheme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  load();
  bind();
  renderAll();
})();
