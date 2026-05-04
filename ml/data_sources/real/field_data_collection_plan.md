# Field Data Collection Plan

Prioritize real readings that fill the current trust gaps:

- temperatures above `33.6°C`
- humid readings above `81.8%`
- MQ gas readings above the legacy dataset ceilings
- combined high-temperature plus high-gas events

For each collection window, capture:

- hive identifier
- timestamp
- all six model features
- threshold interpretation at the time of capture
- later expert assessment, harvest outcome, or lab outcome

Until those labels exist, collected rows should improve coverage monitoring but not be treated as supervised ground truth.
