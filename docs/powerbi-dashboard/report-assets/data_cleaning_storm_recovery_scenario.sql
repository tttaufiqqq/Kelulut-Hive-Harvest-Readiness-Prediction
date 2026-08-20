-- Session 5: script a designed storm-disturbance-and-recovery arc onto
-- Hive 15 ("Kelulut Manis") for 25 May - 27 Jul 2026, matching reference
-- image 04-sensor-correlations-storm-recovery.png's "Hive 15 post-storm
-- recovery timeline" caption verbatim: "On 15 June, Hive 15 falls to HRI
-- 5% while humidity reaches 87%. HRI then reaches 69% by 27 July."
--
-- Unlike the 8a-8c/8f fixes, this is NOT de-flattening an existing weak
-- pattern -- the reference caption itself calls this a "designed synthetic
-- recovery scenario, not a causal biological estimate", so hand-authoring
-- the arc for this one hive/date-range is the intended approach. Current
-- data in this window was pure noise (HRI bouncing 2-51%, humidity 54-79%
-- with no shape) -- see HANDOFF.md Section 8g for the before values.
--
-- Restore point: hive15_backup_before_storm_scenario.sql (full
-- predictions + sensor_logs tables, pre-this-change).

UPDATE predictions p
JOIN sensor_logs sl ON sl.id = p.sensor_log_id
JOIN (
  SELECT '2026-05-25' d, 0.52 hri, 72.0 hum UNION ALL
  SELECT '2026-05-27', 0.53, 72.0 UNION ALL
  SELECT '2026-05-29', 0.46, 73.0 UNION ALL
  SELECT '2026-06-01', 0.46, 73.0 UNION ALL
  SELECT '2026-06-03', 0.45, 74.0 UNION ALL
  SELECT '2026-06-05', 0.38, 74.0 UNION ALL
  SELECT '2026-06-08', 0.38, 81.0 UNION ALL
  SELECT '2026-06-10', 0.39, 81.0 UNION ALL
  SELECT '2026-06-12', 0.40, 81.0 UNION ALL
  SELECT '2026-06-15', 0.05, 87.0 UNION ALL
  SELECT '2026-06-17', 0.04, 86.0 UNION ALL
  SELECT '2026-06-19', 0.05, 85.0 UNION ALL
  SELECT '2026-06-22', 0.14, 81.0 UNION ALL
  SELECT '2026-06-24', 0.13, 80.0 UNION ALL
  SELECT '2026-06-26', 0.13, 79.0 UNION ALL
  SELECT '2026-06-29', 0.18, 76.0 UNION ALL
  SELECT '2026-07-01', 0.24, 75.0 UNION ALL
  SELECT '2026-07-03', 0.30, 74.0 UNION ALL
  SELECT '2026-07-06', 0.35, 73.0 UNION ALL
  SELECT '2026-07-08', 0.40, 73.0 UNION ALL
  SELECT '2026-07-10', 0.44, 72.0 UNION ALL
  SELECT '2026-07-13', 0.48, 73.0 UNION ALL
  SELECT '2026-07-15', 0.51, 74.0 UNION ALL
  SELECT '2026-07-17', 0.55, 76.0 UNION ALL
  SELECT '2026-07-20', 0.58, 82.0 UNION ALL
  SELECT '2026-07-22', 0.62, 75.0 UNION ALL
  SELECT '2026-07-24', 0.65, 71.0 UNION ALL
  SELECT '2026-07-27', 0.69, 69.0
) v ON DATE(sl.record_timestamp) = v.d
SET p.hri_value = v.hri, p.raw_hri_value = v.hri, sl.humidity = v.hum
WHERE sl.hive_id = 15;
