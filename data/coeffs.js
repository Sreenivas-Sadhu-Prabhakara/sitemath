/*
 * sitemath — coefficient corpus.
 * Every number the calculator uses lives HERE, with provenance.
 * A band ships only if it was read from a real source on the verified_on date.
 * beta:true = the figure could NOT be confirmed on an official manufacturer/standards
 * page and comes from a named secondary source, or is a stated practice convention —
 * it is visibly flagged in the UI and overridable in one tap. Nothing is invented.
 *
 * Units:
 *   sqft_per_L  — square feet covered per litre, at the stated coats_basis
 *   m2_per_kg   — square metres covered per kilogram (putty, total application)
 *   mm          — tile nominal dimension
 *   percent     — wastage allowance
 *   ratio       — unit-conversion factor
 * Hard gate (machine-enforced in tests): COEFFS.length <= 30.
 */

const SQFT_PER_M2 = 10.7639; // display/derivation constant; 1 ft = 0.3048 m exactly
const M_PER_FT = 0.3048;     // exact, by definition (international foot)

const COEFFS = [
  /* ---------------- (a) paint / primer / putty coverage bands ---------------- */
  {
    id: 'paint_tractor', module: 'paint', layer: 'topcoat',
    label: 'Interior emulsion — economy (e.g. Asian Paints Tractor Emulsion)',
    band: { min: 130, max: 150, unit: 'sqft_per_L' }, coats_basis: 2,
    brand_example: 'Asian Paints Tractor Emulsion (product code 0057)',
    source_title: 'Asian Paints Tractor Emulsion — Product Information Sheet (staged: sources/asianpaints-tractor-emulsion-pis.pdf)',
    source_url: 'https://www.asianpaints.com/content/dam/asianpaints/website/products/pis-files-2/tractor-emulsion.pdf',
    source_quote: 'On normal masonry surface after brushing — 1 COAT 250 - 270 sq.ft/ltr — 2 COATS 130 - 150 sq.ft/ltr',
    verified_how: 'Official TDS PDF fetched from asianpaints.com and read; copy staged in sources/',
    verified_on: '2026-07-23', beta: false
  },
  {
    id: 'paint_apcolite', module: 'paint', layer: 'topcoat',
    label: 'Interior emulsion — premium (e.g. Asian Paints Apcolite Premium Emulsion)',
    band: { min: 130, max: 150, unit: 'sqft_per_L' }, coats_basis: 2,
    brand_example: 'Asian Paints Apcolite Premium Emulsion (product code 0011)',
    source_title: 'Asian Paints Apcolite Premium Emulsion — Product Information Sheet (staged: sources/asianpaints-apcolite-premium-emulsion-pis.pdf)',
    source_url: 'https://www.asianpaints.com/content/dam/asianpaints/website/products/pis-files-2/apcolite-premium-emulsion.pdf',
    source_quote: 'On normal masonry surface after brushing — 1 COAT 260 - 300 sq.ft/ltr — 2 COATS 130 - 150 sq.ft/ltr',
    verified_how: 'Official TDS PDF fetched from asianpaints.com and read; copy staged in sources/',
    verified_on: '2026-07-23', beta: false
  },
  {
    id: 'paint_royale', module: 'paint', layer: 'topcoat',
    label: 'Interior emulsion — luxury (e.g. Asian Paints Royale Luxury Emulsion)',
    band: { min: 140, max: 160, unit: 'sqft_per_L' }, coats_basis: 2,
    brand_example: 'Asian Paints Royale Luxury Emulsion (product code 030)',
    source_title: 'Asian Paints Royale Luxury Emulsion — Product Information Sheet (staged: sources/asianpaints-royale-luxury-emulsion-pis.pdf)',
    source_url: 'https://www.asianpaints.com/content/dam/asianpaints/website/products/pis-files-2/royale-luxury-emulsion.pdf',
    source_quote: 'On normal masonry surface after brushing/roller — 1 COAT 270 – 310 sq.ft/ltr — 2 COATS 140 – 160 sq.ft/ltr',
    verified_how: 'Official TDS PDF fetched from asianpaints.com and read; copy staged in sources/',
    verified_on: '2026-07-23', beta: false
  },
  {
    id: 'paint_apex', module: 'paint', layer: 'topcoat',
    label: 'Exterior emulsion (e.g. Asian Paints Apex Weatherproof Emulsion)',
    band: { min: 55, max: 60, unit: 'sqft_per_L' }, coats_basis: 2,
    brand_example: 'Asian Paints Apex Weatherproof Emulsion (product code 0012)',
    source_title: 'Asian Paints Apex — Product Information Sheet (staged: sources/asianpaints-apex-weatherproof-emulsion-pis.pdf)',
    source_url: 'https://www.asianpaints.com/content/dam/asianpaints/website/products/pis-files-2/apex-weatherproof-emulsion.pdf',
    source_quote: 'On normal masonry surface by brushing — 1 COAT 100 - 130 sq.ft/ltr — 2 COATS 55 - 60 sq.ft/ltr',
    verified_how: 'Official TDS PDF fetched from asianpaints.com and read; copy staged in sources/',
    verified_on: '2026-07-23', beta: false
  },
  {
    id: 'paint_bison_glow', module: 'paint', layer: 'topcoat',
    label: 'Interior emulsion — Berger anchor (Bison Glow)',
    band: { min: 130, max: 150, unit: 'sqft_per_L' }, coats_basis: 2,
    brand_example: 'Berger Bison Glow Acrylic Interior Emulsion',
    source_title: 'Berger Bison Glow product page (carries no coverage figure); band from Berger spec quoted in retailer listings',
    source_url: 'https://www.bergerpaints.com/products/interior-wall-coatings/bison-glow',
    source_quote: 'Coverage 130-150 sq.ft/litre for 2 coats under ideal test conditions (retailer listing quoting Berger specification; NOT read on bergerpaints.com)',
    verified_how: 'BETA — bergerpaints.com product page fetched 2026-07-23 but publishes no coverage number; band cross-checked from Amazon.in / dealer listings quoting the Berger spec. Override with your tin’s TDS figure.',
    verified_on: '2026-07-23', beta: true
  },
  {
    id: 'paint_weathercoat', module: 'paint', layer: 'topcoat',
    label: 'Exterior emulsion — Berger anchor (WeatherCoat Long Life 10)',
    band: { min: 70, max: 75, unit: 'sqft_per_L' }, coats_basis: 2,
    brand_example: 'Berger WeatherCoat Long Life 10 Exterior Emulsion',
    source_title: 'Berger WeatherCoat Long Life 10 spec as quoted by Yes Painter product listing (official Berger TDS not fetchable)',
    source_url: 'https://yespainter.com/berger-paint-price-list/berger-weathercoat-long-life-10-exterior-emulsion/',
    source_quote: 'Coverage of Berger WeatherCoat Long Life 10 is 70-75 sq. ft/lt/2 coats, under ideal test conditions (secondary source)',
    verified_how: 'BETA — official Berger TDS could not be fetched on 2026-07-23; band from a named secondary listing. Override with your tin’s TDS figure.',
    verified_on: '2026-07-23', beta: true
  },
  {
    id: 'primer_interior', module: 'paint', layer: 'primer',
    label: 'Interior wall primer (e.g. Asian Paints TruCare Interior Wall Primer)',
    band: { min: 130, max: 160, unit: 'sqft_per_L' }, coats_basis: 1,
    brand_example: 'Asian Paints TruCare Interior Wall Primer ST (product code 0359); water-thinnable WT variant sold alongside',
    source_title: 'Asian Paints TruCare Interior Wall Primer (Solvent Thinnable) — Product Information Sheet (staged: sources/asianpaints-trucare-interior-wall-primer-st-pis.pdf)',
    source_url: 'https://www.asianpaints.com/content/dam/asianpaints/website/products/pis-files-2/trucare-interior-wall-primer-st.pdf',
    source_quote: 'On smooth masonry surface by brushing — 1 COAT 130 - 160 sq.ft/ltr',
    verified_how: 'Official TDS PDF fetched from asianpaints.com and read; copy staged in sources/. Figure is for the ST variant; check your primer’s own TDS if using WT.',
    verified_on: '2026-07-23', beta: false
  },
  {
    id: 'primer_exterior', module: 'paint', layer: 'primer',
    label: 'Exterior wall primer (e.g. Asian Paints TruCare Exterior Wall Primer)',
    band: { min: 120, max: 140, unit: 'sqft_per_L' }, coats_basis: 1,
    brand_example: 'Asian Paints TruCare Exterior Wall Primer',
    source_title: 'TruCare Exterior Wall Primer coverage as quoted by Yes Painter (official TDS not fetchable)',
    source_url: 'https://yespainter.com/faq-items/what-is-the-coverage-of-asian-paints-trucare-exterior-wall-primer/',
    source_quote: 'Trucare Exterior Wall Primer covers 120 - 140 Square Feet Per Litre in One Coat (secondary source)',
    verified_how: 'BETA — official TDS PDF could not be located on 2026-07-23; band from a named secondary listing. Override with your primer’s TDS figure.',
    verified_on: '2026-07-23', beta: true
  },
  {
    id: 'putty_birla', module: 'paint', layer: 'putty',
    label: 'Acrylic/white-cement wall putty (Birla White WallCare)',
    band: { min: 1.86, max: 2.04, unit: 'm2_per_kg' }, coats_basis: 'total application (thin coats, each ≤ 2 mm, per Birla White)',
    brand_example: 'Birla White WallCare Putty',
    source_title: 'Birla White — How to estimate your Wall Putty Needs (official estimator guide)',
    source_url: 'https://www.birlawhite.com/en/blogs/how-to-estimate-your-wall-putty-needs',
    source_quote: '1 kg of Birla White WallCare Putty spreads approximately 20-22 square feet of surface area and coverage of 1.86-2.04 square meters per kg.',
    verified_how: 'Official birlawhite.com estimator page fetched and quoted verbatim',
    verified_on: '2026-07-23', beta: false
  },
  {
    id: 'paint_dulux_global', module: 'paint', layer: 'topcoat',
    label: 'Interior emulsion — global anchor (Dulux Interior Acrylic Emulsion, AkzoNobel India)',
    band: { min: 90, max: 110, unit: 'sqft_per_L' }, coats_basis: 2,
    brand_example: 'Dulux Interior Acrylic Emulsion (Dulux Professional, AkzoNobel India)',
    source_title: 'Dulux Professional India — Dulux Interior Acrylic Emulsion product page',
    source_url: 'https://www.duluxprofessional.com/in/en/products/dulux-interior-acrylic-emulsion',
    source_quote: '90 – 110 sft per litre for 2 coats (However, this can vary depending upon surface nature and surface preparation)',
    verified_how: 'Official duluxprofessional.com page fetched and quoted verbatim',
    verified_on: '2026-07-23', beta: false
  },

  /* ---------------- (b) conventions ---------------- */
  {
    id: 'conv_fresh_system', module: 'convention', layer: 'system',
    label: 'Fresh-surface paint system default: 2 coats putty + 1 coat primer + 2 coats topcoat (all editable)',
    band: { min: 2, max: 2, unit: 'coats_topcoat' }, coats_basis: 'putty 2 / primer 1 / topcoat 2',
    brand_example: 'Asian Paints TDS application process (staged) runs: sand → primer → acrylic wall putty → sand → primer → sand → first coat → second coat',
    source_title: 'Asian Paints TDS “Paint Application Process” (staged PDFs); CPWD Specifications Vol. 2 is the public-works reference but was not independently fetched',
    source_url: 'https://www.asianpaints.com/content/dam/asianpaints/website/products/pis-files-2/apcolite-premium-emulsion.pdf',
    source_quote: 'STEP 2 DECOPRIME CEMENT PRIMER … STEP 3 ACRYLIC WALL PUTTY … STEP 5 DECOPRIME CEMENT PRIMER … STEP 7 FIRST COAT … STEP 8 SECOND COAT',
    verified_how: 'BETA convention — the 2-putty/1-primer/2-topcoat default is common site practice; the staged Asian Paints TDS process differs (primer→putty→primer→2 coats). Set the coats your painter actually quotes.',
    verified_on: '2026-07-23', beta: true
  },
  {
    id: 'conv_repaint_system', module: 'convention', layer: 'system',
    label: 'Repaint (sound existing paint) system default: 0 putty + 0 primer + 2 coats topcoat (all editable)',
    band: { min: 2, max: 2, unit: 'coats_topcoat' }, coats_basis: 'topcoat 2',
    brand_example: 'Matches the “2 COATS” coverage basis every staged TDS publishes',
    source_title: 'Asian Paints TDS coverage panels (staged PDFs, sources/)',
    source_quote: '2 COATS 130 - 150 sq.ft/ltr (Tractor); damaged patches still need spot putty/primer — contractor judgment this app does not quantify',
    source_url: 'https://www.asianpaints.com/content/dam/asianpaints/website/products/pis-files-2/tractor-emulsion.pdf',
    verified_how: 'Coats default equals the published 2-coat TDS basis; verified from staged TDS',
    verified_on: '2026-07-23', beta: false
  },
  {
    id: 'conv_openings', module: 'convention', layer: 'measure',
    label: 'Opening deduction: subtract door/window areas from WALL area (never from ceiling); suggested sizes door 0.9 × 2.1 m, window 1.2 × 1.2 m',
    band: { min: 1.44, max: 1.89, unit: 'm2_suggested_opening' }, coats_basis: 'n/a',
    brand_example: 'Common Indian residential convention — measure your own openings',
    source_title: 'Stated measurement convention of this app (suggested sizes are editable defaults, not a standard)',
    source_url: 'https://sreenivas-sadhu-prabhakara.github.io/sitemath/',
    source_quote: 'Suggested sizes are conventions; both are editable per project and per room',
    verified_how: 'BETA convention — no external authority claimed; always editable',
    verified_on: '2026-07-23', beta: true
  },
  {
    id: 'conv_tds_caveat', module: 'convention', layer: 'caveat',
    label: 'Manufacturer surface-condition caveat (verbatim, common to all staged Asian Paints TDS)',
    band: { min: 0, max: 0, unit: 'text' }, coats_basis: 'n/a',
    brand_example: 'Asian Paints (identical wording on all four staged TDS)',
    source_title: 'Asian Paints TDS coverage footnote (staged PDFs, sources/)',
    source_url: 'https://www.asianpaints.com/content/dam/asianpaints/website/products/pis-files-2/tractor-emulsion.pdf',
    source_quote: 'Actual coverage may vary from the quoted coverage due to factors such as method and condition of application and surface roughness and porosity.',
    verified_how: 'Quoted verbatim from staged TDS PDFs',
    verified_on: '2026-07-23', beta: false
  },

  /* ---------------- (c) tiles ---------------- */
  {
    id: 'tile_300x300', module: 'tile', layer: 'size', dims_mm: [300, 300],
    label: 'Tile 300 × 300 mm (1 × 1 ft)',
    band: { min: 300, max: 300, unit: 'mm' }, coats_basis: 'n/a',
    brand_example: 'Kajaria / Somany / Orientbell catalogue size; IS 15622 is the Indian standard for pressed ceramic tiles (standard text not fetched)',
    source_title: 'Orientbell Tiles — Standard Tile Sizes guide',
    source_url: 'https://www.orientbell.com/tiles/tile-size',
    source_quote: 'Square tiles: 300 x 300 mm … 400 x 400 mm … 600 x 600 mm … 800 x 800 mm; rectangular: 300 x 450 mm … 600 x 1200 mm',
    verified_how: 'Manufacturer size-guide page fetched; size listed',
    verified_on: '2026-07-23', beta: false
  },
  {
    id: 'tile_300x450', module: 'tile', layer: 'size', dims_mm: [300, 450],
    label: 'Tile 300 × 450 mm (wall)',
    band: { min: 300, max: 450, unit: 'mm' }, coats_basis: 'n/a',
    brand_example: 'Kajaria / Somany / Orientbell catalogue size',
    source_title: 'Orientbell Tiles — Standard Tile Sizes guide',
    source_url: 'https://www.orientbell.com/tiles/tile-size',
    source_quote: 'Rectangular tiles: … 300 x 450 mm …',
    verified_how: 'Manufacturer size-guide page fetched; size listed',
    verified_on: '2026-07-23', beta: false
  },
  {
    id: 'tile_400x400', module: 'tile', layer: 'size', dims_mm: [400, 400],
    label: 'Tile 400 × 400 mm',
    band: { min: 400, max: 400, unit: 'mm' }, coats_basis: 'n/a',
    brand_example: 'Kajaria / Somany / Orientbell catalogue size',
    source_title: 'Orientbell Tiles — Standard Tile Sizes guide',
    source_url: 'https://www.orientbell.com/tiles/tile-size',
    source_quote: 'Square tiles: … 400 x 400 mm …',
    verified_how: 'Manufacturer size-guide page fetched; size listed',
    verified_on: '2026-07-23', beta: false
  },
  {
    id: 'tile_600x600', module: 'tile', layer: 'size', dims_mm: [600, 600],
    label: 'Tile 600 × 600 mm (2 × 2 ft)',
    band: { min: 600, max: 600, unit: 'mm' }, coats_basis: 'n/a',
    brand_example: 'Kajaria / Somany / Orientbell catalogue size',
    source_title: 'Orientbell Tiles — Standard Tile Sizes guide',
    source_url: 'https://www.orientbell.com/tiles/tile-size',
    source_quote: 'Square tiles: … 600 x 600 mm …',
    verified_how: 'Manufacturer size-guide page fetched; size listed',
    verified_on: '2026-07-23', beta: false
  },
  {
    id: 'tile_800x800', module: 'tile', layer: 'size', dims_mm: [800, 800],
    label: 'Tile 800 × 800 mm',
    band: { min: 800, max: 800, unit: 'mm' }, coats_basis: 'n/a',
    brand_example: 'Kajaria / Somany / Orientbell catalogue size',
    source_title: 'Orientbell Tiles — Standard Tile Sizes guide',
    source_url: 'https://www.orientbell.com/tiles/tile-size',
    source_quote: 'Square tiles: … 800 x 800 mm …',
    verified_how: 'Manufacturer size-guide page fetched; size listed',
    verified_on: '2026-07-23', beta: false
  },
  {
    id: 'tile_600x1200', module: 'tile', layer: 'size', dims_mm: [600, 1200],
    label: 'Tile 600 × 1200 mm (large format)',
    band: { min: 600, max: 1200, unit: 'mm' }, coats_basis: 'n/a',
    brand_example: 'Kajaria / Somany / Orientbell catalogue size',
    source_title: 'Orientbell Tiles — Standard Tile Sizes guide',
    source_url: 'https://www.orientbell.com/tiles/tile-size',
    source_quote: 'Rectangular tiles: … 600 x 1200 mm …',
    verified_how: 'Manufacturer size-guide page fetched; size listed',
    verified_on: '2026-07-23', beta: false
  },
  {
    id: 'tile_wastage_straight', module: 'tile', layer: 'wastage',
    label: 'Wastage allowance — straight lay (cutting/breakage), default 5%',
    band: { min: 5, max: 5, unit: 'percent' }, coats_basis: 'n/a',
    brand_example: 'Trade rule of thumb repeated in manufacturer buying guides; no single TDS publishes it as a specification',
    source_title: 'Stated convention (editable default)',
    source_url: 'https://sreenivas-sadhu-prabhakara.github.io/sitemath/',
    source_quote: 'Editable default; complex rooms, many cuts or fragile tiles can exceed it',
    verified_how: 'BETA convention — not literally published as a standard figure; override to your fixer’s allowance',
    verified_on: '2026-07-23', beta: true
  },
  {
    id: 'tile_wastage_diagonal', module: 'tile', layer: 'wastage',
    label: 'Wastage allowance — diagonal lay, default 10%',
    band: { min: 10, max: 10, unit: 'percent' }, coats_basis: 'n/a',
    brand_example: 'Trade rule of thumb for diagonal/pattern lays; no single TDS publishes it as a specification',
    source_title: 'Stated convention (editable default)',
    source_url: 'https://sreenivas-sadhu-prabhakara.github.io/sitemath/',
    source_quote: 'Editable default; diagonal and pattern lays cut every border tile',
    verified_how: 'BETA convention — not literally published as a standard figure; override to your fixer’s allowance',
    verified_on: '2026-07-23', beta: true
  },

  /* ---------------- (d) units & pack ladders ---------------- */
  {
    id: 'unit_m2_sqft', module: 'unit', layer: 'conversion',
    label: '1 m² = 10.7639 sq ft (derived from 1 ft = 0.3048 m, exact by definition)',
    band: { min: 10.7639, max: 10.7639, unit: 'sqft_per_m2' }, coats_basis: 'n/a',
    brand_example: 'International foot: 0.3048 m exactly (1959 international yard and pound agreement)',
    source_title: 'Mathematical definition — 1/0.3048² = 10.76391… sq ft per m², used here at 4 decimal places',
    source_url: 'https://www.nist.gov/pml/us-surveyfoot/revised-unit-conversion-factors',
    source_quote: '1 ft = 0.3048 m (exact); therefore 1 m² = 10.76391 sq ft',
    verified_how: 'Exact definitional constant; not an empirical claim',
    verified_on: '2026-07-23', beta: false
  },
  {
    id: 'pack_emulsion', module: 'unit', layer: 'packs', packs: [20, 10, 4, 1],
    label: 'Emulsion & primer pack ladder: 1 / 4 / 10 / 20 L tins (some primers add 500 ml)',
    band: { min: 1, max: 20, unit: 'L' }, coats_basis: 'n/a',
    brand_example: 'Identical “AVAILABLE PACKS” panel on all four staged Asian Paints TDS; TruCare primer TDS adds 500 ml',
    source_title: 'Asian Paints TDS “AVAILABLE PACKS” panels (staged PDFs, sources/)',
    source_url: 'https://www.asianpaints.com/content/dam/asianpaints/website/products/pis-files-2/tractor-emulsion.pdf',
    source_quote: 'AVAILABLE PACKS — 1 ltr, 4 ltr, 10 ltr, 20 ltr',
    verified_how: 'Read verbatim from staged TDS PDFs',
    verified_on: '2026-07-23', beta: false
  },
  {
    id: 'pack_putty', module: 'unit', layer: 'packs', packs: [40, 5],
    label: 'Putty bag ladder used for rounding: 5 / 40 kg (Birla White also sells 1/10/20/30 kg)',
    band: { min: 5, max: 40, unit: 'kg' }, coats_basis: 'n/a',
    brand_example: 'Birla White putty guide lists 1 kg, 5 kg, 10 kg, 20 kg, 30 kg and 40 kg options',
    source_title: 'Birla White — putty pack-size guide (official blog)',
    source_url: 'https://www.birlawhite.com/en/media/blogs/the-ultimate-guide-to-birla-putty-understanding-1-kg-5-kg-10kg-20kg-30kg-40kg-and-options',
    source_quote: 'Understanding 1 kg, 5 kg, 10kg, 20kg, 30kg, 40kg and options',
    verified_how: 'Official birlawhite.com page located in search on 2026-07-23; app rounds against the common 5/40 kg site bags (editable)',
    verified_on: '2026-07-23', beta: false
  }
];

if (typeof module !== 'undefined') module.exports = { COEFFS, SQFT_PER_M2, M_PER_FT };
