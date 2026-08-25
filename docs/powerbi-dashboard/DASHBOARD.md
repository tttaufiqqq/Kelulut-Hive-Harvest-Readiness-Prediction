# BuzzyHive Power BI Dashboard — Reference & Storytelling Guide

Last updated: 2026-08-24.

**Single source of truth.** This replaces `HANDOFF.md`, `NEW_PAGES_PLAN.md`,
`CROSS_ANALYSIS_EXPANSION_PLAN.md`, and `DASHBOARD_STORYTELLING_GUIDE.md`
(all deleted). Those docs tracked an earlier, larger report shape — an
"Environmental Intelligence" page split into 5 pages, plus 4 further
cross-analysis pages — none of which was kept. The report was
consolidated down to **6 pages** on 2026-08-24, then a 7th cross-analysis
page (Site & Model Validation) was added the same day once the 6-page
shape was settled; this doc describes only what actually exists in the
`.pbix` today.

Numbers quoted below (cards, chart values) are a snapshot from the
2026-08-24 screenshots used to write this doc — the database is live, so
treat them as a reference point, not a permanent truth. Re-run the
matching SQL against `buzzyhive2.0` before quoting a number in a
high-stakes context (a defense, a stakeholder report).

---

## 1. Report at a glance

- **Source**: MySQL `buzzyhive2.0`, live connection — refresh needed after
  any DML.
- **Table-name quirk**: MySQL tables import into Power BI as
  `'buzzyhive2 0 <table>'` (space-separated, not underscore) — confirmed
  for `harvests`, `hives`, `users`, `master_species`, `master_sites`,
  `master_honey_colors`, `master_honey_flavors`, `inspections`. **Both
  MySQL views also import with this same prefix** —
  `'buzzyhive2 0 harvest_hri_link'` and `'buzzyhive2 0 inspection_hri_link'`
  — correcting an earlier version of this doc that claimed
  `harvest_hri_link` imports unprefixed; that claim was never
  independently re-checked and turned out wrong (confirmed 2026-08-24
  while building Page 7). Always confirm against your own Data pane
  before pasting DAX from this doc — if a name differs there, that's the
  source of truth, not this file.
- **Card style convention**: every KPI card is a Card visual, black title
  bar (Format → General → Title **on**, Format → Header **off**), bold
  callout value.
- **Global date shift**: `harvests.harvest_date`, `inspections.
  inspection_date`, and `sensor_logs.record_timestamp` were all shifted
  back 2 years on 2026-08-20 so the dataset ends at "now" with no
  future-dated rows (now spans 2023-01-07 → 2026-08-27). `DateTable`
  spans `CALENDAR(DATE(2023,1,1), DATE(2026,12,31))`, with `MonthName`
  sort-by-`MonthNumber` so month axes render Jan→Dec.

### The 7 pages, in tab order

| # | Page | Answers |
|---|---|---|
| 1 | Fleet Composition & Trends | What does the fleet look like right now, and how has readiness/HRI moved over the year? |
| 2 | Harvest Leaderboard | Which hive produces the most? |
| 3 | Honey Quality Analysis | Which hive produces the best quality? |
| 4 | Monthly & Seasonal Trends | Does either of the above vary by season? |
| 5 | Beekeeper & Species Performance | Who's harvesting it, and does species matter? |
| 6 | Operational Insights | Which hives are reliable/consistent, and do pre-harvest conditions predict yield? |
| 7 | Site & Model Validation | Does HRI actually predict harvest outcomes, and how much of what pages 5–6 show is Site/Species confounded rather than independent? |

---

## 2. Shared model pieces powering these 6 pages

- `harvests` — `hive_id`, `beekeeper_id`, `harvest_date`, `weight`,
  `color_id`, `flavor_id`, `productivity_level` (Low/Medium/High).
- `hives` → `master_species[id]` (species per hive) and →
  `master_sites` (not used on any kept page).
- `users` — imported with **only** `id`, `name`, `status` kept (password/
  2FA/token columns dropped in Power Query — don't re-add them). Filtered
  to beekeepers via a Power Query join against this app's Spatie-style
  `roles` + `model_has_roles` tables (there is no plain `users.role`
  column, despite what an older migration file might suggest).
  `harvests[beekeeper_id] → users[id]`, Many→1, Single.
- `harvest_hri_link` (MySQL view) — matches each harvest to its nearest
  pre-harvest inspection/HRI reading. Two relationships exist off it:
  - `harvest_hri_link[matched_inspection_id] → inspections[id]` —
    **active**, set to **Both** cross-filter.
  - `harvest_hri_link[hive_id] → hives[id]` — **inactive** (added later;
    kept inactive on purpose so it doesn't disturb the first
    relationship). Species-by-HRI measures activate it explicitly with
    `USERELATIONSHIP()`. If you ever touch either relationship, re-verify
    both paths still resolve correctly — Power BI will silently pick one
    of two paths to `hives` if both are ever left active at once.
  - `harvest_hri_link[harvest_date] → DateTable[Date]` — Many→1, Single
    (separate fact table on the same `DateTable`, normal star-schema
    shape).
- `inspection_hri_link` (MySQL view, one row per inspection —
  `inspection_id, hive_id, inspection_date, blooming_status,
  vegetation_density, nectar_source_availability, structural_damage,
  hri_value, humidity`) — **left over from the original, dropped "HRI ×
  environmental drivers" page**, unused by any of the first 6 pages but
  still fully wired into the model:
  - `inspection_hri_link[inspection_id] → inspections[id]` — **active**,
    **One-to-one** (every row is one real inspection, not a "nearest
    match" like `harvest_hri_link`). Power BI forces 1:1 relationships to
    cross-filter in **both** directions automatically, so filtering by
    `master_sites`/`master_species` already flows all the way through:
    `master_sites → hives → inspections → inspection_hri_link`. **Don't
    add a direct `inspection_hri_link[hive_id] → hives[id]` relationship**
    — it's redundant (the 1:1 path already covers it) and only creates an
    ambiguous-path conflict for no benefit. This was tried and reverted
    while building Page 7.
- `hives[beekeeper_id] → users[id]` — **inactive** (added 2026-08-24 for
  Page 7's Beekeeper × Site matrix). The only *other* beekeeper
  relationship in the model, `harvests[beekeeper_id] → users[id]`
  (above), doesn't help here — it's Single-direction from `users` to
  `harvests` only, and `hives → harvests` is also Single-direction the
  other way, so there was never a working path from `users` to `hives`
  before this. Kept inactive to avoid an ambiguous-path conflict with the
  `hives → harvests → users` chain; activate via
  `USERELATIONSHIP('buzzyhive2 0 hives'[beekeeper_id], 'buzzyhive2 0 users'[id])`
  inside `CALCULATE` (see `Hive Count (by Beekeeper)`, Page 7).
- `DateTable[MonthName]` / `[Year]` — used for every seasonal chart.

### Leftover artifacts from dropped pages — harmless, but expect more

Building Page 7 turned up three pieces of scaffolding from the original,
larger report shape that survived the 2026-08-24 consolidation even
though no page uses them:
`inspection_hri_link`'s relationships (above), a duplicate
`HRI-Weight R -2` measure created when the first attempt at that formula
had a bug and got re-typed under a new auto-generated name (the broken
original was deleted, only one `HRI-Weight R` should remain), and a
disconnected **`Sensor Axis`** table sitting unused in the Data pane — a
routing trick for the old, dropped "Sensor Correlations" page. None of
these affect anything currently built, but their presence means **the
model likely has more unused leftovers than are documented here** —
don't assume an unfamiliar table/measure/relationship you spot is a
mistake before checking whether it's simply unused scaffolding from a
page that no longer exists.

### Known unresolved issue

`Active Beekeeper Count` (Beekeeper & Species Performance page) reads
**6**, not 5 — an Admin account is getting back into the filtered `users`
table, likely a Power Query step not persisting through refresh. Doesn't
affect any `harvests`-based chart (Admin has zero harvests, contributes
nothing), but the card itself is wrong. Not yet fixed — check Data view
for an "Admin" row and confirm the role filter step is still in Applied
Steps if you pick this up.

---

## 3. Page 1 — Fleet Composition & Trends

![Fleet Composition & Trends](screenshots/01-fleet-composition-trends.png)

**Purpose**: fleet-wide composition (species mix, readiness mix) plus how
readiness and HRI have moved across the year — the "where do we stand,
and what's the shape of the trend" page.

**Slicers**: Year, Hive.

**Cards** (4): Total Hives, Harvest Ready Hives, Species Diversity,
Readiness Rate.

**Charts** (5): Species Percentage Across Hives (pie), Readiness Level
Percentage Across Hives (donut), Monthly Readiness Rate Trend (line),
Monthly Ready vs Ready-or-Nearly-Ready Trend (clustered bar, two series),
Average HRI Trend & Forecast for Year 2026 (line, with Analytics-pane
forecast band).

> **Note on this page's build history**: unlike the other 5 pages, this
> one predates the planning docs that used to live in this folder — no
> DAX/build-steps record exists for it. The underlying measures aren't
> documented here; if you need the exact DAX, open the page in Power BI
> and check each visual's field well directly rather than assuming
> anything below is derived from a written spec.

**Snapshot as of 2026-08-24** (14 hives, unfiltered):
- Total Hives 14 · Harvest Ready Hives 5 · Species Diversity 5 ·
  Readiness Rate 35.71%.
- Species mix: Geniotrigona thoracica 4 hives (28.57%), Heterotrigona
  itama 3 (21.43%), Tetragonula laeviceps 3 (21.43%), Lepidotrigona
  terminate 2 (14.29%), Tetrigona binghami 2 (14.29%).
- Readiness mix: Ready 5 (35.71%), Approaching 4 (28.57%), Nearly Ready 4
  (28.57%), Not Ready 1 (7.14%).
- Monthly Readiness Rate Trend: climbs from 16% (Jan) to a 51% peak in
  April, then drifts back down to the low-to-mid 20s-30s for the rest of
  the year (May 33%, Jun 29%, Jul 35%, Aug 34%, Sep 31%, Oct 25%, Nov
  26%, Dec 24%).
- Average HRI Trend & Forecast: starts 48% (Jan 2026), climbs fairly
  steadily to 61% by July 2026, then the Analytics-pane forecast band
  takes over (widening confidence interval into Aug–Nov 2026).

### Presentation script

**Act 1 — "Where do we stand?"**
> "We're tracking the full active fleet — 14 kelulut colonies, 5 species.
> Right now 35.71% of hives are classified Ready for harvest — the rest
> are Approaching or Nearly Ready (28.57% each) or resting after a recent
> harvest (7.14% Not Ready)."

Ground the species number in the biology if the audience isn't
apiculture-familiar: these are all generalist foragers, so flora variety
around a mix of 5 species matters more than it would for a single-crop
honeybee operation.

**Act 2 — "Has it always looked like this?"**
> "Readiness isn't flat across the year — it peaked at 51% in April and
> has drifted down to the low-to-mid 20-30% range since. That's not
> noise, that's a seasonal shape worth planning around, not a one-off dip
> to investigate."

Demo the slicers here: switch the Year filter and watch both trend
charts move — that's the moment that proves this is a live query, not a
static image.

**Act 3 — "Where is it headed?"**
> "HRI has been climbing steadily through the year, from 48% in January
> to 61% by July. The dashed line and shaded band past July are Power
> BI's own forecast — an indicative planning outlook, not a guarantee,
> and the band widens the further out it projects. That's the model
> being honest about its own uncertainty, not a hedge."

**Closing line**: *"So: a fleet that's currently just over a third
Ready, with a readiness trend that peaks mid-year, and an HRI trajectory
climbing into a cautiously optimistic forecast. That's the entry point —
everything else in this report answers a more specific follow-up
question this page raises."*

---

## 4. Page 2 — Harvest Leaderboard

![Harvest Leaderboard](screenshots/02-harvest-leaderboard.png)

**Purpose**: which hive produces the most, by weight and by count.

**Slicers**: Year, Month only (deliberate — Site/Species/Hive all cascade
correctly to `harvests`, but a Readiness slicer would filter nothing on
this page since `predictions → sensor_logs → hives` is Single-direction
cross-filter the wrong way; a minimal panel was chosen for this
specific page).

**Measures**:
```dax
Total Harvest Weight = SUM('buzzyhive2 0 harvests'[weight])
Harvest Count = COUNTROWS('buzzyhive2 0 harvests')

Top Hive by Weight Name =
VAR t = ADDCOLUMNS(VALUES('buzzyhive2 0 hives'[name]), "W", CALCULATE([Total Harvest Weight]))
VAR maxW = MAXX(t, [W])
RETURN MAXX(FILTER(t, [W] = maxW), 'buzzyhive2 0 hives'[name])

Top Hive by Weight Value =
VAR t = ADDCOLUMNS(VALUES('buzzyhive2 0 hives'[name]), "W", CALCULATE([Total Harvest Weight]))
RETURN MAXX(t, [W])
```
`Average Harvest Weight` is reused from elsewhere in the model.

**Cards** (4): Top Hive by Weight Name (+ Value), Total Harvest Weight,
Harvest Count, Average Harvest Weight.

**Chart** (1): Top 5 Hives by Harvest Weight — horizontal bar, sorted
descending. **Deliberately capped at Top 5, not all 14** — the visual's
item-limit setting defaulted to 5 and the user kept it that way
(punchier for a leaderboard). If you ever need a full 14-hive ranking,
check this setting first.

**Snapshot as of 2026-08-24**: Kelulut Murni leads at 86,602 g, Getah
Maju 82,350 g, Gelam Prima 81,895 g, Belimbing Jaya 78,076 g, Tualang
Murni 77,928 g. Total fleet weight 1,041,651 g across 2,163 harvests,
482 g average.

### Presentation script

> "Across the whole fleet we've recorded 2,163 harvests totaling just
> over one tonne — 1,041,651 grams — averaging 482 grams per harvest. The
> single biggest producer is Kelulut Murni, at roughly 87 kilograms
> total."

> "But it's not a one-hive story — the next four hives on the board
> (Getah Maju, Gelam Prima, Belimbing Jaya, Tualang Murni) all sit within
> about 10% of the leader. This is a competitive top tier, not one
> outlier hive carrying the fleet."

Note for whoever presents: the chart is intentionally capped at Top 5 —
say so if asked, framed as a leaderboard-style choice, not a data
limitation.

**Transition into Quality**: *"That's the most productive hive by
weight — but volume isn't the same thing as quality. Does the biggest
producer also make the best honey?"*

---

## 5. Page 3 — Honey Quality Analysis

![Honey Quality Analysis](screenshots/03-honey-quality-analysis.png)

**Purpose**: which hive produces the best quality, and what does typical
quality look like fleet-wide.

**Slicers**: Year, Month, Species.

**Measures**:
```dax
/* calculated column on harvests */
Quality Points = SWITCH('buzzyhive2 0 harvests'[productivity_level], "Low", 1, "Medium", 2, "High", 3, BLANK())

Avg Quality Score = AVERAGE('buzzyhive2 0 harvests'[Quality Points])

Pct High Quality =
DIVIDE(
    CALCULATE(COUNTROWS('buzzyhive2 0 harvests'), 'buzzyhive2 0 harvests'[productivity_level] = "High"),
    COUNTROWS('buzzyhive2 0 harvests')
)

Top Quality Hive Name =
VAR t = ADDCOLUMNS(VALUES('buzzyhive2 0 hives'[name]), "Q", CALCULATE([Avg Quality Score]))
VAR maxQ = MAXX(t, [Q])
RETURN MAXX(FILTER(t, [Q] = maxQ), 'buzzyhive2 0 hives'[name])
```
`Dominant Honey Colour` / `Dominant Honey Flavour` are reused from
elsewhere in the model.

**Cards** (4): Top Hive by Honey Quality (+ score), Avg Honey Quality
Score, % High-Quality Harvests, Most Common Honey Colour.

**Charts** (2, of 3 originally planned — see below): Top 5 Hive by
Average Honey Quality Score (bar, descending); Harvest Count for Each
Hive by Honey Colour (matrix, hive × colour).

**Deliberately not built**: a Low/Medium/High stacked-mix bar chart (the
ranking bar + cards already told the "quality skews Medium" story
clearly enough) and a flavour-by-hive matrix (canvas was full; a quick
add later if ever needed — same recipe as the colour matrix, swap
`master_honey_flavors[name]` in).

**Snapshot as of 2026-08-24**: Top hive Tualang Murni at 2.16 (Top 5:
Tualang Murni 2.16, Kelulut Murni 2.15, Getah Maju 2.11, Tualang Barat
2.07, Belimbing Jaya 1.89). Fleet Avg Quality Score 1.88/3. % High-Quality
Harvests 4.16%. Most Common Honey Colour: Dark Amber. Colour spread
across all 7 recorded colours is fairly even (283–328 harvests each).

### Presentation script

> "We score every harvest Low, Medium, or High and turn that into a
> weighted quality score out of 3. Fleet-wide, we're averaging 1.88 —
> closer to Medium than High — and only 4.16% of all harvests are rated
> High at all. That's a real, verified number, not a data gap: every one
> of the 2,163 harvests has a rating, none are blank."

> "The top hive by quality is Tualang Murni — but notice that's a
> *different* hive from Kelulut Murni, our weight leader from the last
> page. The biggest producer isn't the best-quality producer. And even
> Tualang Murni, our best, only scores 2.16 — just barely above the
> fleet's Medium midpoint of 2.0."

Present this as an honest, slightly humbling finding, not a problem to
explain away: most of this operation's honey is Medium grade, with High
being genuinely rare rather than typical.

**Transition into Monthly Trends**: *"So quality and quantity are two
different stories, and neither one is fixed — do either of them change
across the season?"*

---

## 6. Page 4 — Monthly & Seasonal Trends

![Monthly & Seasonal Trends](screenshots/04-monthly-seasonal-trends.png)

**Purpose**: does harvest volume or quality vary by month/season.

**Slicers**: Year, Month, Species.

**Measures**:
```dax
Best Month by Weight Name =
VAR t = ADDCOLUMNS(VALUES(DateTable[MonthName]), "W", CALCULATE([Total Harvest Weight]))
VAR maxW = MAXX(t, [W])
RETURN MAXX(FILTER(t, [W] = maxW), DateTable[MonthName])

Best Month by Quality Name =
VAR t = ADDCOLUMNS(VALUES(DateTable[MonthName]), "Q", CALCULATE([Avg Quality Score]))
VAR maxQ = MAXX(t, [Q])
RETURN MAXX(FILTER(t, [Q] = maxQ), DateTable[MonthName])

Avg HRI (Harvest-Linked) = AVERAGE(harvest_hri_link[hri_value])
```
Card is titled "Avg HRI at Harvest Time (0–1 scale)" — kept on the raw
0–1 scale by deliberate choice rather than the report's usual ×100
percentage convention, to avoid ambiguity.

**Cards** (3): Best Month by Weight, Best Month by Quality, Avg HRI at
Harvest Time.

**Charts** (2): Total Harvest Weight by Month (clustered column, Year
legend, true calendar-month YoY comparison); Harvest Quality Mix by
Month (100% stacked column, `productivity_level` legend).

**Snapshot as of 2026-08-24**: Best Month by Weight = March, Best Month
by Quality = May, Avg HRI at Harvest Time = 0.54. Quality mix stays in a
tight 77–82% Medium band all year; High share ranges roughly 2.6–7.0%
across months, never zero, peaking in May.

> **Build note worth keeping**: an early render of the quality-mix chart
> looked like `High` was missing in 11 of 12 months — a genuine data
> artifact, right? Querying raw SQL directly (this project's standing
> practice: verify before calibrating) showed `High` present every
> month, 2.58–7.00%. The chart's data-label renderer was silently
> suppressing labels on thin segments — a formatting issue, not a data
> issue. Worth remembering as a general lesson: a suspicious pattern in a
> Power BI visual isn't automatically a database problem.

### Presentation script

> "By weight, March is our strongest month at just over 100 kilograms
> fleet-wide, with April and May close behind — a real mid-year peak, not
> a flat line. By quality, May edges out as the best month for
> High-rated harvests, at 7%, against a typical month of around 4%."

> "Quality mix, though, barely moves month to month — Medium sits in a
> tight 77–82% band all year. So there's a real, moderate seasonal signal
> in *how much* we harvest, but not much of one in *how good* it is —
> quality looks more like a fleet-wide characteristic than a seasonal
> one."

> "The average HRI reading at the moment of harvest is 0.54 on our
> 0-to-1 readiness scale — meaning the typical harvest happens at just
> over half of full model-assessed readiness, not right at the peak."

**Closing line for this module**: *"Put together: one hive leads on
volume, a different hive leads on quality, harvest volume has a real
seasonal rhythm peaking in spring, and quality stays remarkably
consistent regardless of season. That's four separate, specific
answers — not just 'the farm is doing fine.'"*

---

## 7. Page 5 — Beekeeper & Species Performance

![Beekeeper & Species Performance](screenshots/05-beekeeper-species-performance.png)

**Purpose**: per-person and per-species performance — a gap the live app
has no analytics for at all.

**Slicers**: Year, Month, Species, Weather.

**Measures**:
```dax
Top Beekeeper Name =
VAR t = ADDCOLUMNS(VALUES('buzzyhive2 0 users'[name]), "W", CALCULATE([Total Harvest Weight]))
VAR maxW = MAXX(t, [W])
RETURN MAXX(FILTER(t, [W] = maxW), 'buzzyhive2 0 users'[name])

Top Species by HRI Name =
VAR t = ADDCOLUMNS(VALUES('buzzyhive2 0 master_species'[name]), "H", CALCULATE(AVERAGE(harvest_hri_link[hri_value])))
VAR maxH = MAXX(t, [H])
RETURN MAXX(FILTER(t, [H] = maxH), 'buzzyhive2 0 master_species'[name])
/* reads harvest_hri_link -> hives via USERELATIONSHIP, see Section 2 */

Active Beekeeper Count = CALCULATE(DISTINCTCOUNT('buzzyhive2 0 users'[id]), 'buzzyhive2 0 users'[status] = "active")
```

**Cards** (4): Top Beekeeper, Active Beekeepers (reads 6, known bug — see
Section 2), Top Species (by HRI), Total Fleet Weight.

**Charts** (4): Total Harvest Weight by Beekeeper (bar, descending);
Harvest Count by Beekeeper (bar, descending); Total Harvest Weight by
Species (bar, descending); Avg HRI by Species (bar, descending).

**Snapshot as of 2026-08-24**:
- By weight: Siti Hajar 229,642 g, Khairul Anam 228,097 g, Mohd Razif
  223,939 g, Ahmad Firdaus 222,078 g, Nurul Ain 137,895 g.
- By count: Ahmad Firdaus 467, Mohd Razif 464, Khairul Anam 463, Siti
  Hajar 462, Nurul Ain 307.
- By species weight: Geniotrigona thoracica 320,433 g, Tetragonula
  laeviceps 231,925 g, Heterotrigona itama 200,243 g, Lepidotrigona
  terminate 149,206 g, Tetrigona binghami 139,845 g.
- Avg HRI by species: Tetragonula laeviceps 0.63, Geniotrigona thoracica
  0.60, Lepidotrigona terminate 0.56, Tetrigona binghami 0.51,
  Heterotrigona itama 0.38.

**Real finding worth keeping**: Siti Hajar is Top Beekeeper by weight
despite having *fewer* harvests (462) than Ahmad Firdaus (467) — her
average harvest is simply bigger, not more frequent. Nurul Ain has
noticeably fewer harvests (307 vs 460+ for the other four) and
proportionally lower weight — reads as fewer assigned hives, not lower
per-harvest productivity, since the ratio holds.

### Presentation script

> "Five active beekeepers manage this fleet. Siti Hajar leads by total
> weight at just under 230 kilograms — but notice she doesn't have the
> most harvests. Ahmad Firdaus has more harvests (467 vs 462) but less
> total weight. Same effort, different outcome — Siti Hajar's average
> harvest just runs bigger."

> "Nurul Ain sits well below the other four on both weight and count —
> about two-thirds their harvest count. Before reading that as lower
> productivity, check the ratio: her weight-per-harvest is in line with
> everyone else's, so this reads as fewer hives assigned, not a
> performance gap."

> "By species, Tetragonula laeviceps both produces well by weight and
> leads on Average HRI — the two numbers agree, which is a stronger
> claim than either alone: it's not just a heavy producer, it's a
> genuinely healthier-reading colony type. Heterotrigona itama sits
> lowest on HRI (0.38) despite a respectable weight total — worth
> flagging as a species where volume and readiness diverge."

**Framing note for whoever presents this page**: this data invites a
"who's the best beekeeper" narrative — resist it. The honest read is
"here's the ranking, and here's the context (harvest count, hive
assignment) that explains most of the gap" rather than a performance
verdict. See Page 6 (Operational Insights) for the environmental-
confound angle this page doesn't control for.

---

## 8. Page 6 — Operational Insights

![Operational Insights](screenshots/06-operational-insights.png)

**Purpose**: which hives are dependable vs. volatile (harvest-cycle
reliability, weight consistency), and whether pre-harvest inspection
conditions predict yield.

**Slicers**: Species, Weather (as visible in the current build).

**Measures/columns**:
```dax
/* calculated column on harvests */
Previous Harvest Date =
VAR CurrentHive = 'buzzyhive2 0 harvests'[hive_id]
VAR CurrentDate = 'buzzyhive2 0 harvests'[harvest_date]
RETURN
CALCULATE(
    MAX('buzzyhive2 0 harvests'[harvest_date]),
    FILTER(
        ALL('buzzyhive2 0 harvests'),
        'buzzyhive2 0 harvests'[hive_id] = CurrentHive &&
        'buzzyhive2 0 harvests'[harvest_date] < CurrentDate
    )
)

/* calculated column, depends on the one above */
Days Since Previous Harvest =
IF(
    ISBLANK('buzzyhive2 0 harvests'[Previous Harvest Date]),
    BLANK(),
    DATEDIFF('buzzyhive2 0 harvests'[Previous Harvest Date], 'buzzyhive2 0 harvests'[harvest_date], DAY)
)

Avg Harvest Cycle Days = AVERAGE('buzzyhive2 0 harvests'[Days Since Previous Harvest])
Weight Std Dev = STDEV.P('buzzyhive2 0 harvests'[weight])

Most Consistent Hive Name =
VAR t = ADDCOLUMNS(VALUES('buzzyhive2 0 hives'[name]), "SD", CALCULATE([Weight Std Dev]))
VAR minSD = MINX(t, [SD])
RETURN MAXX(FILTER(t, [SD] = minSD), 'buzzyhive2 0 hives'[name])
```
A hive's first-ever harvest legitimately has no prior harvest —
`Previous Harvest Date`/`Days Since Previous Harvest` are blank for one
row per hive; `AVERAGE` skips blanks automatically.

**Cards** (4): Avg Harvest Cycle, Most Consistent Hive, Fleet Weight
Variability, Harvests Matched to an Inspection.

**Charts** (5): Top 5 Hive Avg Harvest Cycle by Hive (ascending — lower
= more active); Top 5 Hive by Weight Variability by Hive (ascending —
lower = more consistent); Avg Harvest Weight by Blooming Status; Avg
Harvest Weight by Vegetation Density; Avg Harvest Weight by Nectar
Availability (all three small columns, sorted worst→best).

Both leaderboard-style charts sort **ascending** — the opposite of every
other ranking chart in this report — because lower is better for both
metrics (cycle days, weight variability). This was caught as a real bug
during build: the item-limit initially defaulted to *highest* 5, which
made it look like `Most Consistent Hive` didn't belong in a "Top 5 most
consistent" chart. Call the direction out in a live demo so it doesn't
read backwards.

**Snapshot as of 2026-08-24**:
- Avg Harvest Cycle 8.66 days · Most Consistent Hive Durian Emas ·
  Fleet Weight Variability 77.62 · Harvests Matched to an Inspection
  2,134.
- Fastest cycles (~8.4–8.6 days): Gelam Prima, Kelulut Murni, Akasia
  Indah, Rambutan Madu, Belimbing Jaya.
- Most consistent by weight SD: Durian Emas 61, Getah Maju 62, Gelam
  Prima 63, Longan Harum 64, Belimbing Jaya 65.
- Avg Harvest Weight by Blooming Status: Peak Bloom 498 g, Early Bloom
  481 g, No Bloom 464 g.
- by Vegetation Density: Dense 490 g, Moderate 483 g, Sparse 472 g.
- by Nectar Availability: Abundant 495 g, Moderate 481 g, Scarce 470 g.

**Background this page's numbers depend on**: `harvests.weight` was
deliberately calibrated against blooming status, vegetation density,
nectar availability, and weather on 2026-08-20 (the 3 built condition
charts came back flat before this change) — a real, verified database
change. One consequence: `Most Consistent Hive` flipped from Getah Maju
to Durian Emas as a direct result, re-verified against fresh SQL as
correct, not a regression. A 4th chart (Avg Harvest Weight by Weather)
was deliberately not built even though the Weather slicer and underlying
data support one — a quick add later if wanted (same recipe, axis
`master_weather_conditions[name]`).

### Presentation script

> "The average hive gets harvested roughly every 8.7 days. Our most
> consistent hive by yield is Durian Emas — its harvest weight varies
> the least of any hive in the fleet, standard deviation 61 grams
> against a fleet-wide 77.6."

> "We matched 2,134 of 2,163 harvests to a pre-harvest inspection —
> essentially full coverage. That lets us ask: does the condition an
> inspector recorded right before a harvest actually predict a bigger or
> smaller one? Peak Bloom harvests average 498 grams versus 464 for No
> Bloom — a real but modest gap, and the same direction shows up for
> vegetation density and nectar availability too. Smaller effect than
> you'd see comparing hives to each other, but a consistent one: more
> forage at harvest time, somewhat bigger harvests."

**Framing note**: this page is the natural place to revisit Page 5's
beekeeper ranking with a skeptical eye — if a beekeeper's hives happen to
sit at sites with consistently better bloom/vegetation/nectar
conditions, some of their apparent edge could be environmental rather
than skill. **Page 7 (Site & Model Validation) now answers this
directly** — see its Beekeeper × Site matrix.

---

## 9. Page 7 — Site & Model Validation

![Site & Model Validation](screenshots/07-site-model-validation.png)

**Purpose**: two things neither of the first 6 pages covers. First,
validate that HRI actually predicts a harvest outcome — none of the
first 6 pages show this at all; it was on the original "Trends &
Forecasts" page, which got dropped in the consolidation. Second, `Site`
(`hives.site_id → master_sites`) is a completely unused dimension across
all 6 other pages — checking it turned up a real confound: Site and
Species are the two strongest measured drivers of HRI, and they're
confounded with each other (every site is dominated by one species), and
that confound extends into which beekeepers happen to have a hive at the
strongest site.

**Slicers**: Year, Month only (deliberately trimmed, copied from Harvest
Leaderboard) — Site/Species/Hive were left off on purpose: this page's
entire point is showing every site/species/beekeeper at once so the
confound is visible, and filtering to one would collapse the two
matrices down to a single row/column. Readiness was left off for the
same reason as every other page — `predictions → sensor_logs → hives` is
Single-direction the wrong way, so it wouldn't filter anything here
either. Confirmed by test (Year=2025, Month=November): cards/scatter/
Weight-by-Site all correctly respond to the filter; the Driver Ranking
table and both matrices correctly stay unchanged — the first because
it's a calculated table (evaluated once at refresh, by design), the
matrices because a hive's site/species/beekeeper assignment isn't a
time-varying fact in this schema, so there's no meaningful "November
view" of hive assignment to filter down to. Neither is a bug.

**One relationship needed**: `hives[beekeeper_id] → users[id]`, inactive
(see Section 2's "Leftover artifacts" / relationships list above for why
and how it's activated).

**Measures**:
```dax
HRI-Weight R =
VAR t = FILTER('buzzyhive2 0 harvest_hri_link', NOT ISBLANK('buzzyhive2 0 harvest_hri_link'[hri_value]))
VAR n = COUNTROWS(t)
VAR sX = SUMX(t, 'buzzyhive2 0 harvest_hri_link'[hri_value])
VAR sY = SUMX(t, 'buzzyhive2 0 harvest_hri_link'[weight])
VAR sXY = SUMX(t, 'buzzyhive2 0 harvest_hri_link'[hri_value] * 'buzzyhive2 0 harvest_hri_link'[weight])
VAR sX2 = SUMX(t, 'buzzyhive2 0 harvest_hri_link'[hri_value] ^ 2)
VAR sY2 = SUMX(t, 'buzzyhive2 0 harvest_hri_link'[weight] ^ 2)
VAR numerator = n * sXY - sX * sY
VAR denominator = SQRT((n * sX2 - sX ^ 2) * (n * sY2 - sY ^ 2))
RETURN DIVIDE(numerator, denominator)

Blooming Spread =
VAR t = ADDCOLUMNS(VALUES('buzzyhive2 0 inspection_hri_link'[blooming_status]), "H", CALCULATE(AVERAGE('buzzyhive2 0 inspection_hri_link'[hri_value])))
RETURN MAXX(t,[H]) - MINX(t,[H])
/* Vegetation Spread / Nectar Spread / Damage Spread: identical pattern, swap the column */

Site Spread =
VAR t = ADDCOLUMNS(VALUES('buzzyhive2 0 master_sites'[name]), "H", CALCULATE(AVERAGE('buzzyhive2 0 inspection_hri_link'[hri_value])))
RETURN MAXX(t,[H]) - MINX(t,[H])

Species Spread =
VAR t = ADDCOLUMNS(VALUES('buzzyhive2 0 master_species'[name]), "H", CALCULATE(AVERAGE('buzzyhive2 0 inspection_hri_link'[hri_value])))
RETURN MAXX(t,[H]) - MINX(t,[H])

Driver Ranking Table =  /* calculated table, Modeling → New table — needs all 6 Spread measures first */
UNION(
    ROW("Driver", "Blooming Status", "Spread", [Blooming Spread]),
    ROW("Driver", "Vegetation Density", "Spread", [Vegetation Spread]),
    ROW("Driver", "Nectar Availability", "Spread", [Nectar Spread]),
    ROW("Driver", "Structural Damage", "Spread", [Damage Spread]),
    ROW("Driver", "Site", "Spread", [Site Spread]),
    ROW("Driver", "Species", "Spread", [Species Spread])
)

Strongest HRI Driver Name =
VAR maxSpread = MAXX('Driver Ranking Table', 'Driver Ranking Table'[Spread])
RETURN MAXX(FILTER('Driver Ranking Table', 'Driver Ranking Table'[Spread] = maxSpread), 'Driver Ranking Table'[Driver])

Top Site by HRI Name =
VAR t = ADDCOLUMNS(VALUES('buzzyhive2 0 master_sites'[name]), "H", CALCULATE(AVERAGE('buzzyhive2 0 inspection_hri_link'[hri_value])))
VAR maxH = MAXX(t, [H])
RETURN MAXX(FILTER(t, [H] = maxH), 'buzzyhive2 0 master_sites'[name])

Top Site by Weight Name =
VAR t = ADDCOLUMNS(VALUES('buzzyhive2 0 master_sites'[name]), "W", CALCULATE([Average Harvest Weight]))
VAR maxW = MAXX(t, [W])
RETURN MAXX(FILTER(t, [W] = maxW), 'buzzyhive2 0 master_sites'[name])

Hive Count (by Beekeeper) =
CALCULATE(
    COUNTROWS('buzzyhive2 0 hives'),
    USERELATIONSHIP('buzzyhive2 0 hives'[beekeeper_id], 'buzzyhive2 0 users'[id])
)
```

**Cards** (4): HRI–Weight Correlation, Strongest HRI, Top Site by HRI,
Top Site by Harvest Weight.

**Charts** (5): **"HRI × Harvest Weight"** (scatter, one dot per harvest,
trend line via Analytics pane); **"HRI Factor Driver Ranking"** (bar,
descending); **"Avg Harvest Weight by Site"** (bar, descending); **"Hive
Count by Site × Species"** (matrix); **"Hive Count by Beekeeper × Site"**
(matrix). Titles are deliberately plain noun phrases, no question marks —
matching every other chart title in the report (the first two were
originally titled as questions, e.g. "Does a Healthier Reading Predict a
Bigger Harvest?", and retitled to this style for consistency).

**Snapshot as of 2026-08-24**:
- HRI–Weight Correlation **r = 0.72**. Strongest HRI Driver: **Species**.
  Top Site by HRI and by Harvest Weight: **Field B** (same site wins
  both).
- Driver Ranking, most to least: Species 17.2%, Site 16.9%, Structural
  Damage 16.8% (caveat: its "Moderate" category is only 29 rows — noisy),
  Blooming Status 13.9%, Nectar Availability 7.7%, Vegetation Density
  3.7%.
- Avg Harvest Weight by Site: Field B 536.70 g, Lab Test 488.53 g, Field
  C 468.01 g, Field A 443.76 g.
- Site × Species: Field A = Heterotrigona itama (3) + Tetrigona binghami
  (1); Field B = 100% Geniotrigona thoracica (3); Field C = a genuine mix
  of 3 species; Lab Test = Lepidotrigona terminate (1) + Tetragonula
  laeviceps (3).
- Beekeeper × Site: Ahmad Firdaus (3 hives: Field A, Field C, Lab Test)
  and Nurul Ain (2 hives: Field A, Lab Test) both have **no hive at
  Field B**. Khairul Anam, Mohd Razif, and Siti Hajar each do.

**Build history worth keeping** (three real bugs hit and fixed while
building this page, none of them data problems):
1. **DAX variable named `sumX` collided with the `SUMX` function** —
   DAX doesn't allow a variable name matching a function name even by
   case only, and threw a confusing "syntax for 'sumX' is incorrect"
   error rather than naming the real problem. Fixed by renaming to
   `sX`/`sY`/etc. A second pass of the fix accidentally also dropped the
   `NOT ISBLANK(hri_value)` filter needed to exclude the ~29 unmatched
   harvests — both issues are fixed together in the measure above.
2. **The Scatter chart defaulted to one aggregated point** (Sum of
   hri_value vs. Sum of weight) until `harvest_id` was added to the
   **Legend** field well to force one point per harvest (this Power BI
   version's Scatter visual has no separate "Details" bucket). Turning
   the Legend **display** off afterward hides the giant per-harvest color
   key, but the points stay individually colored as a side effect —
   cosmetic, not worth fighting further.
3. **Both matrices returned identical/nonsense numbers on the first
   build**, for two different reasons: the Beekeeper × Site matrix's
   Values field defaulted to aggregation **First** instead of **Count**
   (producing raw `id` values, not counts — every row's "Total" reading
   1 was the tell), and even after fixing that, a **field called
   "Beekeeper Name" turned out not to be connected to `hives` at all**
   (every row showed the identical fleet-wide `4/3/3/4=14` split) — the
   real fix was the missing `hives ↔ users` relationship described in
   Section 2, not a field swap. Both are checked against SQL and
   confirmed matching exactly (see snapshot above).

### Presentation script

> "Two questions the rest of this report doesn't answer: does a healthier
> HRI reading actually predict a bigger harvest, and how much of what
> we've shown so far might really be the same underlying pattern
> surfacing more than once?"

> "Start with the first: HRI and harvest weight correlate at 0.72 — a
> strong, real relationship. [Point at the scatter.] That's not a clean
> line, it's a real cloud of noise around a clear upward trend, which is
> exactly what you'd expect from a genuine predictive signal on messy
> real-world data."

> "Now the second question. We ranked every condition we record by how
> much it moves HRI. Blooming status and weather-adjacent conditions are
> the usual suspects — but Species and Site come out on top, both around
> 17 percentage points, ahead of every environmental condition we
> actually track."

> "Here's why that's worth pausing on: Field B is our best site on HRI
> *and* on harvest weight — but Field B is also 100% one species,
> Geniotrigona thoracica. Field A, our weakest site on both, is mostly
> Heterotrigona itama — the same species that scores lowest on HRI
> fleet-wide. We can't currently tell whether Field A underperforms
> because of the location or because of what's living there — they're
> the same three hives."

> "And it doesn't stop at species. Go back to Page 5's beekeeper ranking:
> Ahmad Firdaus and Nurul Ain, our two lowest performers by weight, are
> also the only two beekeepers with zero hives at Field B. That doesn't
> prove they're better or worse beekeepers than the ranking suggests —
> it means the ranking and the site effect can't currently be told
> apart, and that's the honest, more useful finding."

**Framing note for whoever presents this page**: same rule as Page 5 —
the point isn't to "correct" the beekeeper ranking or declare Site is
the "real" explanation. It's to show that two plausible explanations
(skill, environment) currently produce the same pattern in this data,
and let the audience see that rather than asserting either one.

---

## 10. Presenting all 7 pages as one story

Each page above has its own presentation script. This section is the
connective tissue — the order to walk them in, and the one-line
transitions that turn 7 separate pages into a single narrative instead of
7 unrelated demos back to back.

### Recommended order (matches the tab order — no reason to deviate)

1. **Fleet Composition & Trends** — establishes scope and the current
   state. Closing line already sets up "everything else answers a more
   specific follow-up question."
2. **Harvest Leaderboard** — "who produces the most." Has its own
   built-in transition line into Quality.
3. **Honey Quality Analysis** — "who produces the best." Has its own
   built-in transition line into Monthly Trends.
4. **Monthly & Seasonal Trends** — "does either vary by season."
   **Transition into Page 5**: *"We've covered the fleet, the volume, and
   the quality — but none of that says anything about who's actually
   doing this work, or whether the species itself matters. The app has
   zero analytics on either. Let's fix that."*
5. **Beekeeper & Species Performance** — "who's harvesting it, does
   species matter." Its framing note already tells you not to present
   the ranking as a verdict.
   **Transition into Page 6**: *"We now know who's producing what — but
   output isn't the same as reliability. Which hives can you actually
   count on, and does what happens right before a harvest predict it?"*
6. **Operational Insights** — "which hives are consistent, do
   pre-harvest conditions predict yield."
   **Transition into Page 7**: *"That covers composition, output,
   quality, season, people, and reliability. One question is still open:
   does the underlying HRI signal actually mean anything — and how much
   of what we just showed you might be the same effect, counted more
   than once?"*
7. **Site & Model Validation (Cross Analysis)** — the deliberate closer,
   not an afterthought. It validates the core premise (HRI predicts
   harvest weight, r=0.72) and then turns a skeptical eye on pages 5 and
   6's rankings via the Site/Species confound. Ending here is a stronger
   close for a defense than ending on Operational Insights — it
   demonstrates the report questioning its own findings rather than just
   listing them.

### Pacing

Each page's script above runs 3–5 spoken beats. A full 7-page walkthrough
at a natural pace is roughly 15–20 minutes. For a shorter slot, cut to a
4-page spine that still tells a complete story: **Fleet Composition &
Trends → Harvest Leaderboard → Beekeeper & Species Performance → Site &
Model Validation** — scope, output, people, validation/confound. That
skips Quality/Monthly/Operational detail but keeps the full arc from
"here's the fleet" to "here's what we validated and what we're honest
about not knowing yet."

### One rule that applies across every page transition

Don't just click to the next tab — say the transition line first, out
loud, before the new page is even on screen. The transition is what
makes it a story instead of a slideshow; the page itself is just
evidence for the sentence you already said.

---

## 11. Reading the dashboard for insight (not just reacting to problems)

**Reactive reading** starts from a problem: "Ready Observation Rate
dropped, why?" Legitimate, but narrow — it only fires when something
already looks broken.

**Insight reading** starts from the dashboard and asks what it's telling
you regardless of whether anything looks wrong. Ask these four questions
of every card and chart, whether or not it's flagged as a problem:

1. **Trend** — is this number moving over time, or is "now" the only
   thing being looked at?
2. **Compare** — moving relative to what? A number means little alone;
   it means something next to another hive, another beekeeper, another
   species, or the same period last year.
3. **Explain** — is there a plausible mechanism connecting this number to
   another one on the dashboard?
4. **Act** — if this pattern holds up, what would a beekeeper or farm
   manager actually do differently? If the honest answer is "nothing,"
   it's probably not insight yet.

A pattern only counts as insight once it clears **Trend + Compare**, and
only counts as *useful* insight once it also clears **Act**.

### Worked examples, using this report

| Reactive read | Insight read |
|---|---|
| "Readiness Rate is 35.71%, seems mediocre." | Filter Fleet Composition & Trends' Monthly Readiness Rate Trend across the year. It peaks in April (51%) and drifts down afterward — a seasonal shape, not a flat mediocre number, and worth planning harvest scheduling around. |
| "Harvests Matched to an Inspection is only 2,134 of 2,163, why not all?" | Break the gap down by hive/beekeeper before assuming it's a data problem — a small, consistent shortfall across every hive reads differently than a shortfall concentrated on one beekeeper's hives (a process gap, not a modeling one). |
| "Siti Hajar is the Top Beekeeper, she's doing the best." | Compare her harvest count to her weight total (Page 5). She has *fewer* harvests than the count leader — her edge is bigger individual harvests, not more frequent ones. That's a different, more specific claim than "best beekeeper." |
| "Avg Quality Score is 1.88, seems fine." | Compare it to the Top Hive's score (2.16, Page 3) — even the *best* hive barely clears the fleet's Medium midpoint (2.0). That's a fleet-wide characteristic worth naming explicitly, not a "some hives underperform" story. |

---

## 12. Suggested filter sequence for a live demo

1. **Start broad** — all years, all months selected (Select all). State
   the whole-fleet numbers.
2. **Narrow to one recent month** — show the cards move. This is the
   moment that proves it's a real filtered query, not a static image.
3. **Narrow further to one Hive or Beekeeper** (whichever page supports
   it) — walk through what the numbers look like for a single entity.
4. **Reset filters** before moving to the next page, so you're not
   accidentally presenting a filtered view of the next page's visuals
   without realizing it.

---

## 13. Do's and don'ts

**Do:**
- Say *why* a number is what it is, not just what it is.
- Let the filter panel do work during the demo — a moving number is more
  convincing than a static one.
- Own the imperfect numbers (4.16% High-quality, an 8-percentage-point
  quality-mix range across months) as evidence of realistic modeling,
  not gaps to gloss over.

**Don't:**
- Don't read every card in on-screen order — group by what question each
  one answers (see each page's presentation script above).
- Don't turn Page 5's beekeeper ranking into a performance verdict — pair
  it with the context (harvest count, hive assignment, Page 7's
  Site × Species / Beekeeper × Site confound) every time it's shown.
- Don't leave a stray diagnostic/test visual on a page during a real
  presentation — check the canvas before presenting.

---

## 14. One-paragraph version (if you only have 30 seconds)

> "We're tracking 14 kelulut hives across 5 species. Right now 35.71% are
> Ready for harvest, and that rate has followed a real seasonal
> shape — peaking mid-year. Across 2,163 recorded harvests totaling just
> over a tonne, one hive leads on volume (Kelulut Murni) and a different
> one leads on quality (Tualang Murni) — but fleet-wide honey quality
> skews Medium, not High, with only 4.16% rated High. Harvest volume has
> a real seasonal peak in March; quality stays flat regardless of season.
> Our most consistent hive by yield is Durian Emas, and pre-harvest bloom
> and forage conditions do predict somewhat bigger harvests — a modest
> but real, verified effect. HRI itself validates well — a 0.72
> correlation with harvest weight — and the strongest single driver of
> HRI is Species, though Species and Site are confounded in this data,
> which is also why some of the beekeeper performance gap can't yet be
> separated from which site a beekeeper's hives happen to sit at."
