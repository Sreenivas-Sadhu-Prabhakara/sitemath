'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const E = require('../data/engine.js');
const { COEFFS, SQFT_PER_M2, M_PER_FT } = require('../data/coeffs.js');

/* ---------------- area fixtures (brief, hand-computed) ---------------- */

test('wallArea: 2×(4+3)×2.75 = 38.5', () => {
  assert.equal(E.wallArea(4, 3, 2.75), 38.5);
});

test('netArea: 38.5 − door 0.9×2.1 (1.89) − window 1.2×1.2 (1.44) = 35.17', () => {
  assert.equal(E.netArea(38.5, [1.89, 1.44]), 35.17);
});

test('toSqFt: 35.17 × 10.7639 = 378.5664… → 378.57 (half-up 2dp)', () => {
  assert.equal(E.toSqFt(35.17), 378.57);
});

/* ---------------- litres / kg fixtures ---------------- */

test('litresBand: 35.17 m² × 2 coats over 10–12 m²/L/coat → {5.86, 7.03}; min litres uses band max', () => {
  assert.deepEqual(E.litresBand(35.17, 2, { min: 10, max: 12 }), { min: 5.86, max: 7.03 });
});

test('puttyKg: 35.17 m² over 1.0–1.2 m²/kg → {29.31, 35.17}', () => {
  assert.deepEqual(E.puttyKg(35.17, { min: 1.0, max: 1.2 }), { min: 29.31, max: 35.17 });
});

test('user override collapses the band: 14–14 m²/L/coat → {5.02, 5.02}', () => {
  assert.deepEqual(E.litresBand(35.17, 2, { min: 14, max: 14 }), { min: 5.02, max: 5.02 });
});

/* ---------------- pack-fill minimizer fixtures ---------------- */

test('packFill(7.03, [20,10,4,1]) = {4:2} totalling 8 L', () => {
  assert.deepEqual(E.packFill(7.03, [20, 10, 4, 1]), { 4: 2 });
});

test('packFill(2.93, [20,10,4,1]) = {1:3} — 3 L beats a 4 L tin', () => {
  assert.deepEqual(E.packFill(2.93, [20, 10, 4, 1]), { 1: 3 });
});

test('packFill(11.2, [20,10,4,1]) = {10:1, 1:2} — largest-tin tiebreak over {4:3}', () => {
  assert.deepEqual(E.packFill(11.2, [20, 10, 4, 1]), { 10: 1, 1: 2 });
});

test('packFill(35.17, [40,5]) = {40:1} — one 40 kg bag beats 8×5 kg', () => {
  assert.deepEqual(E.packFill(35.17, [40, 5]), { 40: 1 });
});

/* ---------------- tile fixtures ---------------- */

test('tileCount 4000×3000 mm floor, 600×600, 5% straight = 35 exactly (single ceil)', () => {
  assert.equal(E.tileCount(4000, 3000, 600, 600, 5), 35);
});

test('tileCount 4000×3000 mm floor, 600×600, 10% diagonal = 37 (36.67 → ceil)', () => {
  assert.equal(E.tileCount(4000, 3000, 600, 600, 10), 37);
});

test('tileCountFromArea agrees with tileCount for the same floor', () => {
  assert.equal(E.tileCountFromArea(12, 600, 600, 5), 35);
  assert.equal(E.tileCountFromArea(12, 600, 600, 10), 37);
});

test('boxes: 35 tiles @4/box = 9 boxes +1 spare; 37 @4 = 10 boxes +3 spare', () => {
  assert.deepEqual(E.boxes(35, 4), { boxes: 9, spare: 1 });
  assert.deepEqual(E.boxes(37, 4), { boxes: 10, spare: 3 });
});

/* ---------------- amendment tests (adversarial review) ---------------- */

test('AMENDMENT: ceiling area = L×W is unaffected by door/window deductions', () => {
  const base = { L: 4, W: 3, H: 2.75, unit: 'm', ceiling: true, openings: [] };
  const withOpenings = {
    ...base,
    openings: [{ w: 0.9, h: 2.1, count: 1 }, { w: 1.2, h: 1.2, count: 1 }]
  };
  const a = E.roomAreas(base);
  const b = E.roomAreas(withOpenings);
  assert.equal(a.ceiling, 12);
  assert.equal(b.ceiling, 12);           // deductions did NOT touch the ceiling
  assert.equal(b.netWall, 35.17);        // they subtracted from wall area only
  assert.equal(b.total, 47.17);
});

test('AMENDMENT: a 12ft×10ft×9ft room converts via exact 0.3048 and matches hand-computed litres', () => {
  // 12ft=3.6576 m, 10ft=3.048 m, 9ft=2.7432 m
  // wall = 2×(3.6576+3.048)×2.7432 = 36.78960384 → 36.79
  const r = E.roomAreas({ L: 12, W: 10, H: 9, unit: 'ft', ceiling: false, openings: [] });
  assert.equal(M_PER_FT, 0.3048);
  assert.equal(r.grossWall, 36.79);
  // 2 coats over a 10–12 m²/L/coat band: 73.58/12 = 6.1316→6.13; 73.58/10 = 7.358→7.36
  assert.deepEqual(E.litresBand(r.netWall, 2, { min: 10, max: 12 }), { min: 6.13, max: 7.36 });
});

/* ---------------- corpus-driven derivations ---------------- */

test('bandToM2PerCoat: Tractor 130–150 sq.ft/L @2 coats → 24.15–27.87 m²/L per coat', () => {
  const t = E.getCoeff('paint_tractor');
  const b = E.bandToM2PerCoat(t);
  assert.equal(E.round2(b.min), 24.15); // 260/10.7639
  assert.equal(E.round2(b.max), 27.87); // 300/10.7639
});

test('putty band passes through unchanged (total-application m²/kg)', () => {
  const p = E.getCoeff('putty_birla');
  assert.deepEqual(E.bandToM2PerCoat(p), { min: 1.86, max: 2.04 });
  // 35.17 m² wall: 35.17/2.04=17.2402→17.24 kg best, 35.17/1.86=18.9086→18.91 kg worst
  assert.deepEqual(E.puttyKg(35.17, E.bandToM2PerCoat(p)), { min: 17.24, max: 18.91 });
});

test('engine constants come FROM the corpus (no duplicated numbers)', () => {
  assert.equal(E.toSqFt(1), E.round2(SQFT_PER_M2));
  assert.equal(E.getCoeff('unit_m2_sqft').band.min, SQFT_PER_M2);
  assert.deepEqual(E.getCoeff('pack_emulsion').packs, [20, 10, 4, 1]);
  assert.deepEqual(E.getCoeff('pack_putty').packs, [40, 5]);
});

test('effectiveBand honours overrides and marks them', () => {
  const t = E.getCoeff('paint_tractor');
  const clean = E.effectiveBand(t, {});
  assert.equal(clean.overridden, false);
  assert.deepEqual(clean.band, t.band);
  const ov = E.effectiveBand(t, { paint_tractor: { min: 120, max: 140 } });
  assert.equal(ov.overridden, true);
  assert.deepEqual(ov.band, { min: 120, max: 140, unit: 'sqft_per_L' });
});

/* ---------------- corpus gate (the tiles mandate, machine-enforced) ---------------- */

test('corpus gate: ≤30 coefficients, unique ids, provenance on every fact, sane bands', () => {
  assert.ok(COEFFS.length <= 30, 'hard cap: ' + COEFFS.length + ' > 30');
  assert.ok(COEFFS.length >= 20, 'suspiciously small corpus');
  const ids = new Set(COEFFS.map((c) => c.id));
  assert.equal(ids.size, COEFFS.length, 'duplicate ids');
  for (const c of COEFFS) {
    assert.ok(c.source_url && c.source_url.startsWith('http'), c.id + ': missing source_url');
    assert.match(c.verified_on, /^\d{4}-\d{2}-\d{2}$/, c.id + ': verified_on not ISO');
    assert.ok(c.band && c.band.min <= c.band.max, c.id + ': band.min > band.max');
    assert.ok(typeof c.beta === 'boolean', c.id + ': beta flag missing');
    assert.ok(c.source_quote && c.source_title, c.id + ': missing quote/title');
    assert.ok(['paint', 'tile', 'convention', 'unit'].includes(c.module), c.id + ': bad module');
  }
  // every beta fact must say so in verified_how (the honesty trail)
  for (const c of COEFFS.filter((x) => x.beta)) {
    assert.match(c.verified_how, /BETA/i, c.id + ': beta fact must explain itself');
  }
  // the six tile sizes carry integer mm dims
  const tiles = COEFFS.filter((c) => c.module === 'tile' && c.layer === 'size');
  assert.equal(tiles.length, 6);
  for (const t of tiles) {
    assert.ok(Number.isInteger(t.dims_mm[0]) && Number.isInteger(t.dims_mm[1]), t.id);
  }
});

/* ---------------- property test: pack minimizer optimality ---------------- */

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('property: with a 1 L tin in the ladder, best total is always exactly ceil(need)', () => {
  const rand = mulberry32(20260723);
  for (let i = 0; i < 2000; i++) {
    const need = Math.round(rand() * 6000) / 100 + 0.01; // 0.01 … 60.01 L
    const fill = E.packFill(need, [20, 10, 4, 1]);
    const total = Object.entries(fill).reduce((s, [size, n]) => s + Number(size) * n, 0);
    assert.equal(Math.round(total * 100), Math.ceil(Math.round(need * 100) / 100) * 100,
      'need=' + need + ' got total=' + total);
  }
});

test('property: pack fill is deterministic (same seed → identical run)', () => {
  const run = () => {
    const rand = mulberry32(42);
    const out = [];
    for (let i = 0; i < 200; i++) out.push(E.packFill(Math.round(rand() * 4500) / 100 + 0.5, [40, 5]));
    return JSON.stringify(out);
  };
  assert.equal(run(), run());
});

test('property: putty fill over [40,5] always covers need and never overshoots by ≥ 5 kg', () => {
  const rand = mulberry32(7);
  for (let i = 0; i < 1000; i++) {
    const need = Math.round(rand() * 9000) / 100 + 0.5;
    const fill = E.packFill(need, [40, 5]);
    const total = Object.entries(fill).reduce((s, [size, n]) => s + Number(size) * n, 0);
    assert.ok(total + 1e-9 >= need, 'undershoot at ' + need);
    assert.ok(total - need < 5, 'overshoot ≥5 at ' + need + ' total ' + total);
  }
});

/* ---------------- CSV (RFC 4180) ---------------- */

test('toCsv quotes commas/quotes/newlines and uses CRLF', () => {
  const csv = E.toCsv([['a', 'b,c', 'say "hi"'], ['line\nbreak', 12, '']]);
  assert.equal(csv, 'a,"b,c","say ""hi"""\r\n"line\nbreak",12,\r\n');
});
