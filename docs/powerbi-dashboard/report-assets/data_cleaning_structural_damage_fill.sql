-- Session 6 (page 3 continued): fill the 124 NULL inspections.structural_damage
-- rows instead of hiding them behind a chart filter. All 124 fall in one
-- exact window, 2026-06-27 to 2026-08-08 -- the InspectionGapFillSeeder
-- output (HANDOFF.md Section 12c), which documented that it would draw
-- structural_damage from the historical weighted pool but apparently never
-- actually wrote a value for this column.
--
-- Storytelling choice (user-directed): rather than a flat proportional
-- fill, decay damage severity from the storm date already scripted on
-- page 5 (Hive 15, 15 June 2026 -- Section 15b), so this window reads as
-- "the apiary recovering after the same storm", tapering from heavy
-- damage right after 15 June back toward the historical baseline
-- (None ~79% / Minor ~14% / Severe ~7% / Moderate ~0.3%) by early August.
-- Applies apiary-wide (all 14 hives), not just Hive 15 -- the storm
-- chart is a targeted single-hive case study, this is the general trend
-- it sits inside.
--
-- Restore point: inspections_backup_before_damage_fill.sql

UPDATE inspections i
JOIN (
  SELECT id,
    RAND() AS r,
    0.85 * EXP(-DATEDIFF(inspection_date, '2026-06-27') / 14) * 0.40 AS pSevere,
    0.85 * EXP(-DATEDIFF(inspection_date, '2026-06-27') / 14) * 0.30 AS pModerate,
    0.15 + 0.85 * EXP(-DATEDIFF(inspection_date, '2026-06-27') / 14) * 0.10 AS pMinor
  FROM inspections
  WHERE structural_damage IS NULL
) x ON x.id = i.id
SET i.structural_damage = CASE
    WHEN x.r < x.pSevere THEN 'severe'
    WHEN x.r < x.pSevere + x.pModerate THEN 'moderate'
    WHEN x.r < x.pSevere + x.pModerate + x.pMinor THEN 'minor'
    ELSE 'none'
  END
WHERE i.structural_damage IS NULL;
