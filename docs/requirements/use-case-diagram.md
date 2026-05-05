# BuzzyHive 2.0 — Use Case Diagram

*Version: 1.0 | Date: 2026-04-29*

---

## Use Case Diagram

```
                            +=====================================================================+
                            |                    BuzzyHive 2.0 System                            |
                            |                                                                     |
          +-------+         |  +--------------------+     +---------------------+                |
          |       |-------- |->| UC01 Invite         |     | UC10 View Dashboard |<------------- | -------+
          | Admin |         |  |      Beekeeper      |     +---------------------+               |        |
          |       |-------- |->| UC02 Update         |     | UC11 View Analytics |<------------- | ----+  |
          +-------+         |  |      Beekeeper      |     +---------------------+               |    |  |
              |             |  +--------------------+     | UC12 Manage Hive    |<------------- | -+ |  |
              |             |  | UC03 Toggle Status  |     +---------------------+               |  | |  |
              |             |  +--------------------+     | UC13 Record Harvest |<------------- | ---+  |
              |             |  | UC04 Delete         |     +---------------------+               |    |  |
              |             |  |      Beekeeper      |     | UC14 Log Inspection |<------------- | ------+
              |             |  +--------------------+     +---------------------+               |       |
              |             |  | UC05 Resend Invite  |     | UC15 Accept Invite  |<--------+     |   [Beekeeper]
              |             |  +--------------------+     +---------------------+         |     |       |
              |             |  | UC06 View           |     | UC16 Update Profile |<-----+ |     |       |
              |             |  |      Beekeepers     |     +---------------------+       | |     |       |
              |             |  +--------------------+     | UC17 Change Password|<---+  | |     |       |
              |             |  | UC07 Monitor        |     +---------------------+    |  | |     |       |
              |             |  |      Sensors        |                                |  | |     |       |
              |             |  +--------------------+                                 |  | |     |       |
              |             |  | UC08 Upload Thesis  |     +---------------------+    |  | |     |       |
              |             |  +--------------------+     | UC18 Ingest Sensor  |    |  | |     |       |
              +------------ |->| UC09 Update Profile |     |      Data           |<-- | -- | --- | --[ESP32]
                            |  +--------------------+     +---------------------+    |  | |     |
                            |                                  <<include>>            |  | |     |
                            |                                      |                  |  | |     |
                            |                             +---------------------+    |  | |     |
                            |                             | UC19 Classify       |    |  | |     |
                            |                             |      Readiness      |<-- | -- | --[Flask ML]
                            |                             +---------------------+    |  | |
                            |                                  <<extend>>             |  | |
                            |                              (when ready=true)          |  | |
                            |                                      |                  |  | |
                            |                             +---------------------+    |  | |
                            |                             | UC20 Send Telegram  |    |  | |
                            |                             |      Alert          |----+  | |--[Telegram Bot]
                            |                             +---------------------+       | |
                            |                             | UC21 Update HRI    |        | |
                            |                             |      Summary        |--------+ |
                            |                             +---------------------+          |
                            |                                  <<include>>                 |
                            |                              (on harvest save)               |
                            |                                      |                       |
                            |                             +---------------------+          |
                            |                             | UC13 Record Harvest |----------+
                            |                             +---------------------+
                            |                                                             |
                            +=====================================================================+
```

---

## Simplified Use Case Overview

```
+========================================== BuzzyHive 2.0 System ==========================================+
|                                                                                                          |
|  ADMIN USE CASES                  BEEKEEPER USE CASES             SYSTEM USE CASES                      |
|  +---------------------------------+  +---------------------------+  +-------------------------------+   |
|  | UC01  Invite Beekeeper          |  | UC10  View Dashboard      |  | UC18  Ingest Sensor Data      |   |
|  | UC02  Update Beekeeper          |  | UC11  View Analytics      |  | UC19  Classify Readiness      |   |
|  | UC03  Toggle Beekeeper Status   |  | UC12  Manage Hive         |  | UC20  Send Telegram Alert     |   |
|  | UC04  Delete Beekeeper          |  | UC13  Record Harvest      |  | UC21  Update HRI Summary      |   |
|  | UC05  Resend Invite             |  | UC14  Log Inspection      |  +-------------------------------+   |
|  | UC06  View Beekeepers           |  | UC15  Accept Invite       |                                      |
|  | UC07  Monitor Sensors           |  | UC16  Update Profile      |                                      |
|  | UC08  Upload Thesis             |  | UC17  Change Password     |                                      |
|  | UC09  Update Profile            |  +---------------------------+                                      |
|  +---------------------------------+                                                                      |
|                                                                                                          |
+==========================================================================================================+

  [Admin] -----------> UC01, UC02, UC03, UC04, UC05, UC06, UC07, UC08, UC09
  [Beekeeper] -------> UC10, UC11, UC12, UC13, UC14, UC15, UC16, UC17
  [ESP32] -----------> UC18
  [Flask ML] --------> UC19      <<include>> UC18 (triggered after every sensor ingest)
  [Telegram Bot] ----> UC20      <<extend>>  UC19 (only when readiness_level = ready)
  [System] ----------> UC21      <<include>> UC13 (HRI summary updated after every harvest)
```

---

## Use Case Relationships

| Relationship | Type | Description |
|-------------|------|-------------|
| UC19 <<include>> UC18 | Include | Every sensor ingest (UC18) includes a call to classify readiness (UC19). UC19 always executes as part of UC18. |
| UC20 <<extend>> UC19 | Extend | Sending a Telegram alert (UC20) extends UC19, but only when `readiness_level = ready`. It does not always execute. |
| UC21 <<include>> UC13 | Include | Recording a harvest (UC13) always includes updating the HRI summary (UC21). |
| UC15 <<precedes>> UC10 | Sequence | A beekeeper must accept their invite (UC15) before they can view the dashboard (UC10). |

---

## Use Case Catalogue

### Admin Use Cases

| ID | Name | Actor | Brief Description |
|----|------|-------|-------------------|
| UC01 | Invite Beekeeper | Admin | Admin creates a beekeeper account and the system emails a signed 7-day invite link |
| UC02 | Update Beekeeper | Admin | Admin edits a beekeeper's name, email, or phone number |
| UC03 | Toggle Beekeeper Status | Admin | Admin activates or deactivates a beekeeper account |
| UC04 | Delete Beekeeper | Admin | Admin permanently removes a beekeeper and all associated hives and data |
| UC05 | Resend Invite | Admin | Admin regenerates and resends the invite link for a pending beekeeper |
| UC06 | View Beekeepers | Admin | Admin views a paginated list of all beekeeper accounts with status and stats |
| UC07 | Monitor Sensors | Admin | Admin views real-time sensor readings for any hive (1h / 6h / 24h / date filter) |
| UC08 | Upload Thesis | Admin | Admin uploads or replaces a thesis PDF for public access via the landing page |
| UC09 | Update Profile | Admin | Admin updates their own name, email, or phone number |

### Beekeeper Use Cases

| ID | Name | Actor | Brief Description |
|----|------|-------|-------------------|
| UC10 | View Dashboard | Beekeeper | Beekeeper sees a list of their hives with latest readiness status |
| UC11 | View Analytics | Beekeeper | Beekeeper views HRI trend, sensor charts, score components, and harvest history for a hive |
| UC12 | Manage Hive | Beekeeper | Beekeeper creates, edits, or deactivates a hive (name, species, site, status) |
| UC13 | Record Harvest | Beekeeper | Beekeeper logs a harvest event (date, weight, colour, flavour, notes) |
| UC14 | Log Inspection | Beekeeper | Beekeeper records a hive inspection (conditions, flora, weather, notes) |
| UC15 | Accept Invite | Beekeeper | New beekeeper sets their password via the signed invite link and activates their account |
| UC16 | Update Profile | Beekeeper | Beekeeper updates their name, email, or phone number |
| UC17 | Change Password | Beekeeper | Beekeeper updates their account password (rate-limited) |

### System Use Cases

| ID | Name | Actor | Brief Description |
|----|------|-------|-------------------|
| UC18 | Ingest Sensor Data | ESP32 | ESP32 posts sensor readings to the API; system validates, resolves device, and stores a sensor log |
| UC19 | Classify Readiness | Flask ML | System sends sensor values to Flask; Flask returns readiness level and confidence score; system stores prediction |
| UC20 | Send Telegram Alert | Telegram Bot | System sends a harvest-ready notification via Telegram when readiness_level = ready |
| UC21 | Update HRI Summary | System | System updates the hive's denormalised summary record after a harvest is recorded |
