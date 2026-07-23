# sitemath — corpus citations & staged sources

Every coefficient in `data/coeffs.js` traces to an entry here. "Verified" means the figure
was read from the named document on the stated date; staged PDFs are byte-for-byte copies of
the fetched originals. "BETA" means the official document could not be fetched or does not
publish the number — the figure comes from the named secondary source or is a stated
convention, is flagged `beta:true` in the corpus, is visibly marked in the UI, and is
overridable in one tap. **No number was invented.**

All verifications performed: **2026-07-23**.

## Staged documents (sources/)

| File | Document | Fetched from | Status |
|---|---|---|---|
| `asianpaints-tractor-emulsion-pis.pdf` | Asian Paints Tractor Emulsion — Product Information Sheet (code 0057) | https://www.asianpaints.com/content/dam/asianpaints/website/products/pis-files-2/tractor-emulsion.pdf | VERIFIED — "1 COAT 250 - 270 sq.ft/ltr — 2 COATS 130 - 150 sq.ft/ltr"; packs 1/4/10/20 ltr |
| `asianpaints-apcolite-premium-emulsion-pis.pdf` | Asian Paints Apcolite Premium Emulsion — PIS (code 0011) | https://www.asianpaints.com/content/dam/asianpaints/website/products/pis-files-2/apcolite-premium-emulsion.pdf | VERIFIED — "1 COAT 260 - 300 sq.ft/ltr — 2 COATS 130 - 150 sq.ft/ltr"; packs 1/4/10/20 ltr |
| `asianpaints-royale-luxury-emulsion-pis.pdf` | Asian Paints Royale Luxury Emulsion — PIS (code 030) | https://www.asianpaints.com/content/dam/asianpaints/website/products/pis-files-2/royale-luxury-emulsion.pdf | VERIFIED — "1 COAT 270 – 310 sq.ft/ltr — 2 COATS 140 – 160 sq.ft/ltr"; packs 1/4/10/20 ltr |
| `asianpaints-apex-weatherproof-emulsion-pis.pdf` | Asian Paints Apex Weatherproof Emulsion — PIS (code 0012) | https://www.asianpaints.com/content/dam/asianpaints/website/products/pis-files-2/apex-weatherproof-emulsion.pdf | VERIFIED — "1 COAT 100 - 130 sq.ft/ltr — 2 COATS 55 - 60 sq.ft/ltr"; packs 1/4/10/20 ltr; "APPLICATION OF PRIMER IS MANDATORY" |
| `asianpaints-trucare-interior-wall-primer-st-pis.pdf` | Asian Paints TruCare Interior Wall Primer (Solvent Thinnable) — PIS (code 0359) | https://www.asianpaints.com/content/dam/asianpaints/website/products/pis-files-2/trucare-interior-wall-primer-st.pdf | VERIFIED — "1 COAT 130 - 160 sq.ft/ltr" on smooth masonry; packs 500 ml / 1 / 4 / 10 / 20 ltr |

The identical coverage caveat appears on all four paint TDS and is carried verbatim as
corpus row `conv_tds_caveat`:

> "Actual coverage may vary from the quoted coverage due to factors such as method and
> condition of application and surface roughness and porosity."

## Verified from official web pages (not PDF-staged; quoted verbatim in the corpus)

- **Birla White WallCare Putty** — https://www.birlawhite.com/en/blogs/how-to-estimate-your-wall-putty-needs
  — "1 kg of Birla White WallCare Putty spreads approximately 20-22 square feet of surface
  area and coverage of 1.86-2.04 square meters per kg." (Fetched 2026-07-23. Page prescribes
  thin coats each ≤ 2 mm; corpus treats the figure as a total-application band.)
- **Birla White putty pack sizes** — https://www.birlawhite.com/en/media/blogs/the-ultimate-guide-to-birla-putty-understanding-1-kg-5-kg-10kg-20kg-30kg-40kg-and-options
  — official guide naming 1/5/10/20/30/40 kg options. App rounds against 5 / 40 kg bags.
- **Dulux Interior Acrylic Emulsion (global anchor)** — https://www.duluxprofessional.com/in/en/products/dulux-interior-acrylic-emulsion
  — "90 – 110 sft per litre for 2 coats (However, this can vary depending upon surface nature
  and surface preparation)". Fetched 2026-07-23.
- **Tile nominal sizes** — https://www.orientbell.com/tiles/tile-size (fetched 2026-07-23)
  lists 300×300, 300×450, 400×400, 600×600, 800×800 and 600×1200 mm among standard Indian
  catalogue sizes (Kajaria/Somany size pages returned 403/404 to automated fetch on the same
  day; Orientbell is the citable catalogue source). IS 15622 is the Indian standard for
  pressed ceramic tiles; the standard text itself was not fetched and is referenced only as
  context, never as a quoted figure.

## BETA rows (secondary source or stated convention — flagged in UI, overridable)

- **Berger Bison Glow interior emulsion, 130–150 sq.ft/L/2 coats** — the official page
  https://www.bergerpaints.com/products/interior-wall-coatings/bison-glow (fetched
  2026-07-23) publishes **no** coverage figure; the band comes from retailer listings quoting
  the Berger spec (e.g. Amazon.in ASIN B09652Q795). BETA.
- **Berger WeatherCoat Long Life 10 exterior emulsion, 70–75 sq.ft/L/2 coats** — official
  TDS not fetchable; band from https://yespainter.com/berger-paint-price-list/berger-weathercoat-long-life-10-exterior-emulsion/. BETA.
- **Asian Paints TruCare Exterior Wall Primer, 120–140 sq.ft/L/1 coat** — official TDS not
  located; band from https://yespainter.com/faq-items/what-is-the-coverage-of-asian-paints-trucare-exterior-wall-primer/. BETA.
- **Fresh-surface system default (2 putty + 1 primer + 2 topcoat)** — common site practice;
  the staged Asian Paints TDS process runs primer → putty → primer → 2 topcoats. CPWD
  Specifications Vol. 2 (https://www.cpwd.gov.in/Publication/Specs2009V2.pdf) is the
  public-works reference but was not independently fetched. All coats editable. BETA.
- **Opening deduction sizes (0.9 × 2.1 m door, 1.2 × 1.2 m window)** and **tile wastage
  (5% straight / 10% diagonal)** — stated conventions, not published specifications. BETA,
  editable defaults.

## Pre-staged references for the v0.2 walls module (bricks / cement / sand — NOT built)

- IS 1077 — Common Burnt Clay Building Bricks (modular size 190×90×90 mm):
  https://law.resource.org/pub/in/bis/S03/is.1077.1992.pdf
- CPWD Specifications (mortar ratios, brickwork chapters):
  https://www.cpwd.gov.in/Publication/Specs2009V2.pdf
  These are listed for the deferred module only; nothing in v0.1 uses them.
