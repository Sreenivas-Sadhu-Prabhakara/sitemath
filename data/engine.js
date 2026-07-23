/*
 * sitemath — pure calculation engine. No DOM, no state.
 * Reads its constants FROM the corpus (data/coeffs.js) — numbers are never
 * duplicated here. Works in the browser (globals) and under node --test.
 */
(function () {
  'use strict';

  /* In Node, require the corpus; in the browser, coeffs.js is loaded first and its
     top-level bindings are visible in the shared script scope. */
  const C = (typeof module !== 'undefined' && typeof require === 'function')
    ? require('./coeffs.js')
    : { COEFFS: COEFFS, SQFT_PER_M2: SQFT_PER_M2, M_PER_FT: M_PER_FT };

  const SQFT = C.SQFT_PER_M2;  // distinct names — must not shadow the corpus globals
  const MFT = C.M_PER_FT;

  /* half-up rounding to 2 decimal places */
  function round2(x) {
    return Math.round((x + Number.EPSILON) * 100) / 100;
  }

  /* feet → metres via the exact definitional factor */
  function ftToM(ft) {
    return ft * MFT;
  }

  /* gross wall area of a rectangular room: 2 × (L + W) × H, in the input unit² */
  function wallArea(L, W, H) {
    return round2(2 * (L + W) * H);
  }

  /* ceiling area = L × W. Door/window deductions NEVER touch this. */
  function ceilingArea(L, W) {
    return round2(L * W);
  }

  /* net paintable area: gross minus each opening area (m²), floored at 0 */
  function netArea(gross, deductions) {
    let net = gross;
    for (const d of deductions) net -= d;
    return round2(Math.max(0, net));
  }

  function toSqFt(m2) {
    return round2(m2 * SQFT);
  }

  /*
   * Convert a corpus coverage band to m² per litre per coat.
   * A TDS band of X sq.ft/ltr at an n-coat basis means one litre paints X sq.ft
   * n times over → per-coat spreading = X × n sq.ft/L.
   */
  function bandToM2PerCoat(coeff) {
    const b = coeff.band;
    if (b.unit === 'sqft_per_L') {
      const n = typeof coeff.coats_basis === 'number' ? coeff.coats_basis : 1;
      return { min: (b.min * n) / SQFT, max: (b.max * n) / SQFT };
    }
    if (b.unit === 'm2_per_kg') return { min: b.min, max: b.max }; // total-application basis
    throw new Error('not a coverage band: ' + coeff.id);
  }

  /*
   * Litres needed for `coats` coats over `areaM2`, given a per-coat coverage band
   * in m²/L. Worst case (band.max litres) uses the band MINIMUM coverage;
   * best case uses the band maximum — min litres uses band max.
   */
  function litresBand(areaM2, coats, bandM2PerCoat) {
    const spread = areaM2 * coats;
    return { min: round2(spread / bandM2PerCoat.max), max: round2(spread / bandM2PerCoat.min) };
  }

  /* Putty kg for a total-application band in m²/kg (coats basis baked into the band) */
  function puttyKg(areaM2, bandM2PerKg) {
    return { min: round2(areaM2 / bandM2PerKg.max), max: round2(areaM2 / bandM2PerKg.min) };
  }

  /*
   * Pack-fill minimizer. Round `need` (L or kg) up to real pack sizes.
   * Ranking: least total volume ≥ need → fewest tins → largest tin
   * (lexicographic preference for combos using bigger packs).
   * Returns { packSize: count, … } with only non-zero counts.
   */
  function packFill(need, packs) {
    const sizes = [...packs].sort((a, b) => b - a);
    // integer centi-units to avoid float drift
    const needC = Math.round(need * 100);
    if (needC <= 0) return {};
    let best = null; // { total, counts:[…aligned to sizes] }

    const maxTotal = needC + sizes[0] * 100; // upper bound: overshoot by one largest pack

    function better(a, b) {
      if (a.total !== b.total) return a.total < b.total;
      const at = a.counts.reduce((s, c) => s + c, 0);
      const bt = b.counts.reduce((s, c) => s + c, 0);
      if (at !== bt) return at < bt;
      // largest-tin tiebreak: prefer more of the larger pack, scanning big → small
      for (let i = 0; i < sizes.length; i++) {
        if (a.counts[i] !== b.counts[i]) return a.counts[i] > b.counts[i];
      }
      return false;
    }

    (function rec(i, counts, total) {
      if (total >= needC) {
        const cand = { total, counts: counts.slice() };
        if (!best || better(cand, best)) best = cand;
        return;
      }
      if (i >= sizes.length) return;
      const sizeC = sizes[i] * 100;
      const maxN = Math.ceil((maxTotal - total) / sizeC);
      for (let n = maxN; n >= 0; n--) {
        counts[i] = n;
        rec(i + 1, counts, total + n * sizeC);
      }
      counts[i] = 0;
    })(0, new Array(sizes.length).fill(0), 0);

    const out = {};
    if (best) sizes.forEach((s, i) => { if (best.counts[i] > 0) out[s] = best.counts[i]; });
    return out;
  }

  /*
   * Tile count with wastage — integer-mm rational math, one single ceil.
   * areaLmm × areaWmm floor (or wall patch); wastagePct may carry one decimal.
   */
  function tileCount(areaLmm, areaWmm, tileLmm, tileWmm, wastagePct) {
    const w10 = Math.round(wastagePct * 10); // tenths of a percent, integer
    const num = areaLmm * areaWmm * (1000 + w10);
    const den = tileLmm * tileWmm * 1000;
    return Math.ceil(num / den);
  }

  /* tiles from a direct m² area (converted once to mm² integers) */
  function tileCountFromArea(areaM2, tileLmm, tileWmm, wastagePct) {
    const areaMm2 = Math.round(areaM2 * 1e6);
    const w10 = Math.round(wastagePct * 10);
    return Math.ceil((areaMm2 * (1000 + w10)) / (tileLmm * tileWmm * 1000));
  }

  /* boxes of N tiles + spares left over */
  function boxes(tiles, perBox) {
    const b = Math.ceil(tiles / perBox);
    return { boxes: b, spare: b * perBox - tiles };
  }

  function getCoeff(id) {
    return C.COEFFS.find((c) => c.id === id);
  }

  /*
   * Room aggregate. Dimensions in room.unit ('m' | 'ft'); opening sizes are ALWAYS
   * metres. Openings deduct from WALL area only — the ceiling (L × W) is never
   * reduced by a door or window.
   */
  function roomAreas(room) {
    const f = room.unit === 'ft' ? MFT : 1;
    const L = room.L * f, W = room.W * f, H = room.H * f;
    const grossWall = wallArea(L, W, H);
    const deductions = (room.openings || []).map((o) => o.w * o.h * (o.count || 1));
    const netWall = netArea(grossWall, deductions);
    const ceiling = room.ceiling ? ceilingArea(L, W) : 0;
    return { grossWall, netWall, ceiling, total: round2(netWall + ceiling) };
  }

  /* effective band for a coefficient, honouring a user override {min,max} */
  function effectiveBand(coeff, overrides) {
    const ov = overrides && overrides[coeff.id];
    if (ov && typeof ov.min === 'number' && typeof ov.max === 'number') {
      return { band: { min: ov.min, max: ov.max, unit: coeff.band.unit }, overridden: true };
    }
    return { band: coeff.band, overridden: false };
  }

  /* RFC-4180 CSV: quote fields containing comma, quote or newline; CRLF rows */
  function toCsv(rows) {
    const esc = (v) => {
      const s = String(v == null ? '' : v);
      return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    return rows.map((r) => r.map(esc).join(',')).join('\r\n') + '\r\n';
  }

  const api = {
    round2, ftToM, wallArea, ceilingArea, netArea, toSqFt,
    bandToM2PerCoat, litresBand, puttyKg, packFill,
    tileCount, tileCountFromArea, boxes, getCoeff, effectiveBand, toCsv, roomAreas
  };

  if (typeof module !== 'undefined') module.exports = api;
  else globalThis.Engine = api;
})();
