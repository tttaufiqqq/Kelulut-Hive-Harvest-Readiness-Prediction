# Real Sensor Coverage Snapshot

Snapshot date: `2026-05-05`

This snapshot comes from the local MySQL workspace connected through `.env`, not from synthetic CSV assets.

## Counts

- `sensor_logs`: `427`
- `predictions`: `10`

## Observed Feature Ranges

- `temp`: `28.00` to `43.50`
- `humidity`: `65.00` to `79.00`
- `mq2_value`: `0` to `750`
- `mq3_value`: `38` to `700`
- `mq5_value`: `80` to `730`
- `mq135_value`: `20` to `620`

## Coverage Against Legacy Training Bounds

- `133` logs exceed the legacy temperature ceiling of `33.6°C`
- `1` log is already in the critical temperature band at `>= 40.1°C`
- `14` logs exceed at least one legacy gas-feature ceiling
- `3` logs are already in a gas-critical band at `>= 501`
- `1` log shows combined critical stress with both `temp >= 40.1°C` and at least one gas sensor `>= 501`

## Recent High-Stress Examples

- `2026-05-04 23:38:55`: `temp=43.50`, `mq2=540`, `mq3=690`, `mq5=730`, `mq135=20`
- `2026-05-04 23:36:37`: `temp=33.50`, `mq2=50`, `mq3=690`, `mq5=230`, `mq135=20`
- `2026-05-04 23:21:49`: `temp=33.50`, `mq2=750`, `mq3=700`, `mq5=580`, `mq135=620`

## Interpretation

- Real collected readings in the local workspace already extend far beyond the original `ml/dataset.csv` bounds.
- Coverage is improving faster than trustworthy labels; only a small subset of those readings currently has persisted prediction context, and none are verified as harvest-outcome ground truth.
- Future model promotion should depend on labeling these real readings, not just proving that they exist.
