# Synthetic Readiness Generation Assumptions v1

## Dataset Positioning

- This dataset is a `rule-informed synthetic prototype dataset` for pipeline prototyping, UI integration, and warning-flow simulation.
- It is not real harvest-readiness ground truth and should not be presented as validated biological evidence.

## Literature-Informed Elements

- Temperature is literature-informed as a core environmental variable, with overheating increasing stress in tropical deployments.
- Humidity is literature-informed as a key environmental and fermentation-risk proxy, especially in wet tropical conditions.
- MQ gas sensors are treated as heuristic stress indicators because the literature review supports multi-sensor monitoring but does not validate a readiness-specific gas signature.
- The literature review emphasizes multi-sensor integration, tropical deployment constraints, and the need for calibration under Malaysian conditions. Those themes guided the use of scenario families, season context, and controlled sensor noise.

## Threshold-Informed Elements

- High temperature, very high humidity, and elevated gas readings increase `threshold_warning_count` and can trigger `critical_stress_flag`.
- Rows with strong warning signals are discouraged from landing in the `ready` class because the plan called for consistency with the app’s rule-based interpretation.

## Project Heuristics

- Time continuity is project-informed so the datasets better support ML prototyping and live prediction flow testing.
- Readiness labels are project heuristics derived from hidden maturity and stress variables rather than direct biological ground truth.
- `maturity_index`, `stress_index`, and `readiness_score` are latent variables created for smoother class transitions and more realistic model-prototyping behavior.
- Scenario families were used instead of pure random sampling so the dataset can express meaningful states such as overheating, humidity risk, gas stress, and instability.

## Stress-Test Rows

- `sensor_anomaly_case` and `extreme_outlier_case` are intended for warning logic, out-of-distribution handling, and robustness checks.
- Stress-test rows should not be mixed into normal prototype training without a deliberate experiment design.

## Recommended Use

- Use the balanced dataset for first-pass model training experiments.
- Use the time-series dataset for sequence-aware testing, UI playback, and end-to-end monitoring flows.
- Use the stress-test dataset for safety checks, anomaly handling, and threshold-warning validation.
