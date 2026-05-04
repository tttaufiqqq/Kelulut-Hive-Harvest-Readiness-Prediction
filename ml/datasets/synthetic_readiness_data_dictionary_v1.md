# Synthetic Readiness Data Dictionary v1

This dictionary documents the rule-informed synthetic prototype dataset for kelulut harvest readiness work.

| Column | Meaning | Unit / Type |
| --- | --- | --- |
| `sample_id` | Synthetic reading identifier | string |
| `hive_id` | Synthetic hive identifier | string |
| `device_id` | Synthetic ESP32-style device identifier | string |
| `timestamp` | Timestamp for the simulated reading | ISO 8601 datetime |
| `hive_age_days` | Approximate hive age at the reading | days |
| `days_since_last_harvest` | Approximate progression since the previous harvest cycle | days |
| `cycle_progress` | Normalized harvest-cycle progression used as a hidden maturity driver | 0.0-1.0 |
| `scenario_type` | Scenario family used to generate the row | categorical |
| `season` | Synthetic Malaysia-oriented season context | dry|wet|inter_monsoon |
| `weather_state` | Short-term weather state affecting the reading | categorical |
| `temp` | Temperature reading | degrees Celsius |
| `humidity` | Relative humidity reading | percent |
| `mq2_value` | MQ-2 sensor proxy reading | arbitrary unit |
| `mq3_value` | MQ-3 sensor proxy reading | arbitrary unit |
| `mq5_value` | MQ-5 sensor proxy reading | arbitrary unit |
| `mq135_value` | MQ-135 sensor proxy reading | arbitrary unit |
| `maturity_index` | Hidden synthetic maturity variable | 0.0-1.0 |
| `stress_index` | Hidden synthetic stress variable | 0.0-1.0 |
| `readiness_score` | Synthetic readiness score derived from maturity and stress | 0.0-1.0 |
| `readiness_level` | Final categorical readiness label | not_ready|approaching|nearly_ready|ready |
| `out_of_distribution_case` | Flag for anomaly or stress-test rows | boolean |
| `threshold_warning_count` | Count of threshold exceedances across key sensor features | integer |
| `critical_stress_flag` | Flag for severe environmental or gas stress | boolean |

## Label Mapping

- `0.00` to `<0.35` -> `not_ready`
- `0.35` to `<0.60` -> `approaching`
- `0.60` to `<0.80` -> `nearly_ready`
- `0.80` to `1.00` -> `ready`

These boundaries are project heuristics for prototyping and not biological ground truth.
