# Real Data Sources

Current status: no committed expert-labeled real harvest-readiness dataset exists in this repo.

Local workspace snapshot:

- local MySQL database currently contains `427` collected `sensor_logs`
- only `10` persisted `predictions` are available beside those logs
- current observed ranges already exceed the legacy ML training bounds on temperature and gas sensors

What does exist:

- live-like development sensor ranges in `database/seeders/SensorLogSeeder.php`
- real sensor-log coverage snapshot in `ml/reports/real_sensor_coverage_snapshot.md`
- API acceptance bounds in `app/Http/Controllers/SensorController.php`
- heuristic seeded predictions in `database/seeders/PredictionSeeder.php`

These are not a substitute for real labeled model-training data.
