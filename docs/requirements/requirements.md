# BuzzyHive 2.0 — System Requirements

*Version: 1.0 | Date: 2026-04-29 | Status: Draft*

---

## 1. System Overview

### 1.1 Purpose

BuzzyHive 2.0 is an IoT-based harvest readiness monitoring system for kelulut (stingless bee) hives. It collects environmental sensor data from hives in real time, classifies harvest readiness using a machine learning model, and notifies beekeepers when a hive is ready to harvest.

### 1.2 Scope

The system covers:

- Real-time sensor data ingestion from ESP32 hardware nodes deployed inside kelulut hives
- ML-based harvest readiness classification using a KNN model served by a Flask REST API
- A web application for beekeepers to manage hives, record harvests, log inspections, and view analytics
- An admin panel for platform management (beekeeper accounts, sensor monitoring, thesis documentation)
- Push notifications via Telegram when harvest readiness is detected

Out of scope: honey volume measurement, regular honeybee (*Apis mellifera*) monitoring, mobile native application.

### 1.3 Target Species

BuzzyHive 2.0 is designed specifically for **Trigona sp. (stingless bees / kelulut)**. Sensor thresholds, readiness classifications, and domain rules are calibrated for Trigona hive conditions and are not applicable to Apis mellifera.

### 1.4 System Boundary

```
+-------------------------------------------------------------+
|                    BuzzyHive 2.0 System                     |
|                                                             |
|  +------------------+     +-----------------------------+   |
|  |  Laravel Web App |     |  Flask ML Microservice      |   |
|  |  (PHP 8.3)       |<--->|  (Python, scikit-learn)     |   |
|  +------------------+     +-----------------------------+   |
|          |                                                   |
|  +------------------+                                       |
|  |  MySQL Database  |                                       |
|  +------------------+                                       |
+-------------------------------------------------------------+
         ^                              |
         |                              v
   [ESP32 Hardware]             [Telegram Bot API]
   (sensor nodes)               (push notifications)
         ^
         |
   [Beekeeper / Admin]
   (web browser)
```

---

## 2. Actors

| Actor | Type | Description |
|-------|------|-------------|
| **Admin** | Human | Platform administrator. Creates and manages beekeeper accounts. Monitors all hives across the system. Uploads thesis documentation. Has no personal hives. |
| **Beekeeper** | Human | Registered hive owner. Views sensor data and analytics for assigned hives. Records harvests and inspections. Receives harvest readiness alerts. |
| **ESP32** | External System | IoT hardware node deployed inside a hive. Posts sensor readings to the Laravel API at regular intervals via HTTP. Identified by device_id and authenticated via X-API-Key header. |
| **Flask ML Service** | External System | Python microservice running a trained KNN classifier. Receives sensor readings from Laravel and returns a harvest readiness classification with a confidence score. |
| **Telegram Bot** | External System | Notification channel. Receives an alert message from the system when a hive's harvest readiness is classified as "Ready". |

---

## 3. Functional Requirements

### FR-AUTH — Authentication and Access Control

| ID | Requirement |
|----|-------------|
| FR-AUTH-01 | The system shall support invite-only registration. Only an Admin can create a beekeeper account. The system generates a signed invite URL valid for 7 days and sends it to the beekeeper's email. |
| FR-AUTH-02 | A beekeeper shall set their own password upon accepting an invite. The account status changes from *pending* to *active* upon successful acceptance. |
| FR-AUTH-03 | The system shall authenticate users via email and password. |
| FR-AUTH-04 | The system shall require email verification before granting access to protected routes. |
| FR-AUTH-05 | The system shall support two-factor authentication (2FA) for enhanced account security. |
| FR-AUTH-06 | The system shall enforce role-based access control with two roles: *admin* and *beekeeper*. Admin routes are inaccessible to beekeepers, and beekeeper routes are inaccessible to admins. |

### FR-ADMIN — Admin Management

| ID | Requirement |
|----|-------------|
| FR-ADMIN-01 | The Admin shall be able to create a beekeeper account by providing a name, email address, and phone number. The system automatically sends an invite email upon creation. |
| FR-ADMIN-02 | The Admin shall be able to update a beekeeper's name, email address, and phone number. |
| FR-ADMIN-03 | The Admin shall be able to toggle a beekeeper's account status between *active* and *deactivated*. Deactivated accounts cannot log in. |
| FR-ADMIN-04 | The Admin shall be able to delete a beekeeper account. Deletion permanently removes the account and all associated hives and sensor logs (cascade). |
| FR-ADMIN-05 | The Admin shall be able to resend an invite email to a beekeeper whose account status is *pending*. A new signed URL is generated (7-day expiry). |
| FR-ADMIN-06 | The Admin shall be able to view a paginated list of all beekeeper accounts (20 per page), including account status and registration date. |
| FR-ADMIN-07 | The Admin shall be able to upload, view, and delete a thesis PDF file (maximum 50 MB). The uploaded file is publicly accessible from the landing page. |

### FR-HIVE — Hive Management

| ID | Requirement |
|----|-------------|
| FR-HIVE-01 | A Beekeeper shall be able to create a hive by providing a name and optionally assigning a species (Trigona itama, Trigona thoracica, Apis mellifera) and a site (Lab, Field A, Field B). |
| FR-HIVE-02 | A Beekeeper shall be able to update hive details (name, species, site, status). |
| FR-HIVE-03 | A Beekeeper shall be able to set a hive's status to *active* or *inactive*. Inactive hives do not receive sensor data. |
| FR-HIVE-04 | The system shall maintain a hive summary record per hive, storing: latest readiness level, 7-day average HRI value, 30-day average HRI value, last harvest date, and total harvest count. |
| FR-HIVE-05 | A Beekeeper shall only be able to view and manage hives assigned to their account. |

### FR-IOT — IoT Sensor Ingestion

| ID | Requirement |
|----|-------------|
| FR-IOT-01 | The system shall accept sensor data via HTTP POST to `/api/sensor-data`. Requests must include a valid `X-API-Key` header. Requests with an invalid or missing key shall receive a 401 response. |
| FR-IOT-02 | The system shall validate all sensor payload fields: `temp` (−10 to 60°C), `humidity` (0 to 100%), and `mq2_value`, `mq3_value`, `mq5_value`, `mq135_value` (0 to 4095 ADC). Invalid payloads shall receive a 422 response. |
| FR-IOT-03 | The system shall resolve the IoT node by matching `device_id` and `hive_id`. If no active node is found, the system shall return a 404 response. |
| FR-IOT-04 | The system shall store each valid sensor reading as a `sensor_log` record with a server-side `recorded_at` timestamp. Sensor logs are immutable (no update). |
| FR-IOT-05 | After storing a sensor log, the system shall trigger an ML harvest readiness prediction. |

### FR-ML — Machine Learning Prediction

| ID | Requirement |
|----|-------------|
| FR-ML-01 | The system shall send sensor readings (mq2_value, mq3_value, mq5_value, mq135_value, temp, humidity) to the Flask `/predict` endpoint via HTTP POST after every sensor log write. |
| FR-ML-02 | The Flask ML service shall classify harvest readiness into one of four levels: *not_ready*, *approaching*, *nearly_ready*, *ready*. |
| FR-ML-03 | The system shall store each prediction result in the `predictions` table, including: `readiness_level`, `hri_value` (class-to-score mapping: 0.25 / 0.50 / 0.75 / 1.00), `confidence_score` (KNN vote ratio, 0–1), and `prediction_timestamp`. |
| FR-ML-04 | If the Flask ML service is unavailable (connection refused, timeout, or non-2xx response), the system shall log a warning and continue. The sensor log shall still be saved. The prediction shall be skipped silently with no error returned to the ESP32. |

### FR-HARV — Harvest Recording

| ID | Requirement |
|----|-------------|
| FR-HARV-01 | A Beekeeper shall be able to record a harvest by providing: harvest date, weight (kg), honey colour (from master list), honey flavour (from master list), productivity level, and optional notes. |
| FR-HARV-02 | The system shall associate each harvest record with the beekeeper who recorded it and the hive it belongs to. |
| FR-HARV-03 | After recording a harvest, the system shall update the hive summary: `last_harvest_date` and `total_harvests`. |
| FR-HARV-04 | A Beekeeper shall be able to view all harvest records for a hive, ordered by date descending. |

### FR-INSP — Inspection Logging

| ID | Requirement |
|----|-------------|
| FR-INSP-01 | A Beekeeper shall be able to log an inspection by providing: inspection date, notes, blooming status, vegetation density, nectar source availability, structural damage assessment, and food source observations. |
| FR-INSP-02 | A Beekeeper shall be able to associate weather conditions (from master list: Sunny, Cloudy, Rainy, Windy) with an inspection via a junction table. |
| FR-INSP-03 | A Beekeeper shall be able to associate flora types observed (from master list: Rubber tree, Coconut, Rambutan, Acacia, Mixed) with an inspection via a junction table. |
| FR-INSP-04 | A Beekeeper shall be able to view all inspection records for a hive, ordered by date descending. |

### FR-ANLYT — Analytics and Dashboard

| ID | Requirement |
|----|-------------|
| FR-ANLYT-01 | The system shall display an HRI trend chart showing daily harvest readiness values for the past 30 days, with a 7-day rolling average overlay. |
| FR-ANLYT-02 | The system shall display hourly sensor readings for the current day across all 6 sensor types (temp, humidity, mq2, mq3, mq5, mq135). |
| FR-ANLYT-03 | The system shall display the latest prediction's score component breakdown (per-sensor contribution). |
| FR-ANLYT-04 | The system shall display a harvest history table showing: date, weight (kg), and HRI value at time of harvest. |
| FR-ANLYT-05 | The system shall display a hive summary card showing: latest readiness level, 7-day and 30-day average HRI, last harvest date, and total harvest count. |
| FR-ANLYT-06 | The Admin shall be able to monitor sensor readings for any hive via a time-window filter (last 1h, 6h, 24h, or a specific date). The view shows the latest reading and a history chart (maximum 500 rows). |

### FR-NOTIF — Notifications

| ID | Requirement |
|----|-------------|
| FR-NOTIF-01 | The system shall send a Telegram notification when a prediction result has `readiness_level = ready`. |
| FR-NOTIF-02 | The Telegram notification shall include: hive name, readiness level, HRI value, confidence score, and prediction timestamp. |

### FR-REPORT — Reporting and Export

| ID | Requirement |
|----|-------------|
| FR-REPORT-01 | The system shall maintain an HRI summary table (`hri_summary`) per hive storing: average temperature, average humidity, average MQ2 value, harvest count, latest readiness level, and average HRI value — suitable for reporting queries. |
| FR-REPORT-02 | The system shall support Power BI integration via a dedicated reporting database (`bh_powerbi`) seeded with representative data for BI query development. |

---

## 4. Non-Functional Requirements

### NFR-PERF — Performance

| ID | Requirement |
|----|-------------|
| NFR-PERF-01 | The sensor ingestion API (`POST /api/sensor-data`) shall respond within 500ms at the 95th percentile under normal operating load. |
| NFR-PERF-02 | The analytics page (`/hives/{id}/analytics`) shall load within 2 seconds. Database queries shall use the composite index on `(hive_id, recorded_at)` in `sensor_logs`. |
| NFR-PERF-03 | The Flask ML `/predict` endpoint shall respond within 2 seconds. The Laravel HTTP client shall enforce a 5-second timeout when calling Flask. |

### NFR-SEC — Security

| ID | Requirement |
|----|-------------|
| NFR-SEC-01 | All sensor API requests shall be authenticated using an `X-API-Key` header. Each IoT node has a unique device key. |
| NFR-SEC-02 | All web routes shall require an authenticated, email-verified session. |
| NFR-SEC-03 | Admin routes shall require the *admin* role via Spatie Permission middleware. |
| NFR-SEC-04 | Beekeeper invite URLs shall be cryptographically signed and expire after 7 days. |
| NFR-SEC-05 | Password change requests shall be rate-limited to 6 attempts per minute per user. |
| NFR-SEC-06 | All database queries shall use Eloquent ORM. Raw SQL is prohibited. |

### NFR-AVAIL — Availability

| ID | Requirement |
|----|-------------|
| NFR-AVAIL-01 | The Laravel application and MySQL database shall be hosted on Exabytes shared hosting (LiteSpeed web server). |
| NFR-AVAIL-02 | The Flask ML service shall run on the same server via cPanel Python App (Passenger WSGI). |
| NFR-AVAIL-03 | If the Flask ML service is unavailable, the system shall continue to accept and store sensor data without interruption. Prediction creation is non-blocking. |

### NFR-SCAL — Scalability

| ID | Requirement |
|----|-------------|
| NFR-SCAL-01 | Sensor log queries shall use a composite database index on `(hive_id, recorded_at)` to maintain performance as the sensor_logs table grows. |
| NFR-SCAL-02 | Admin beekeeper lists shall be paginated (20 records per page) to prevent full-table loads. |

### NFR-MAINT — Maintainability

| ID | Requirement |
|----|-------------|
| NFR-MAINT-01 | The backend shall follow a Route → Controller → Service architecture. Business logic shall not reside in route closures or Eloquent models. |
| NFR-MAINT-02 | All database schema changes shall be made via Laravel migrations. Direct schema editing is prohibited. |
| NFR-MAINT-03 | All master data (species, sites, honey colours, flavours, weather conditions, flora types, sensor thresholds) shall be managed via seeders, not hardcoded in application logic. |
| NFR-MAINT-04 | The ML model and scaler shall be stored as versioned `.pkl` files. Retraining must produce new files without modifying the Flask application code. |

### NFR-USAB — Usability

| ID | Requirement |
|----|-------------|
| NFR-USAB-01 | The web application shall be a single-page application (SPA) built with React 19 + Inertia.js, providing page transitions without full reloads. |
| NFR-USAB-02 | The UI shall support 5 runtime colour themes switchable from the admin appearance panel, with no flash on load. |
| NFR-USAB-03 | All data tables shall include pagination, search, and status filter controls. |

### NFR-COMPAT — Compatibility

| ID | Requirement |
|----|-------------|
| NFR-COMPAT-01 | The ESP32 firmware shall communicate with the system over plain HTTP (not HTTPS) due to TLS memory constraints on the ESP32. |
| NFR-COMPAT-02 | The system shall be compatible with Laravel 11 (PHP 8.3), MySQL 8.0, and Node.js 20+. |
| NFR-COMPAT-03 | The web application shall be compatible with modern browsers: Chrome 110+, Firefox 110+, Edge 110+. |

---

## 5. Domain Requirements

### DR-KELULUT — Kelulut-Specific Constraints

| ID | Requirement |
|----|-------------|
| DR-KELULUT-01 | The system target species is Trigona sp. (kelulut / stingless bees). All sensor thresholds, readiness levels, and domain terminology shall reflect Trigona hive biology — not Apis mellifera (regular honeybees). |
| DR-KELULUT-02 | Harvest readiness shall be determined by environmental gas and temperature profile, not honey volume. Gas sensors (MQ2, MQ3, MQ5, MQ135) are the primary classification inputs. |
| DR-KELULUT-03 | The system shall store species using master data. Supported species: Trigona itama, Trigona thoracica, Apis mellifera (as reference). Primary focus is Trigona itama. |

### DR-SENSOR — Sensor Value Constraints

| Sensor | Valid Range | Kelulut Optimal Range | Notes |
|--------|------------|----------------------|-------|
| Temperature (DHT11) | −10°C to 60°C | 28°C to 32°C | ADC not applicable (digital sensor) |
| Humidity (DHT11) | 0% to 100% | 65% to 75% | ADC not applicable (digital sensor) |
| MQ2 (smoke / combustibles) | 0 to 4095 ADC | — | Baseline rises as honey matures |
| MQ3 (ethanol / alcohol) | 0 to 4095 ADC | — | Key fermentation indicator |
| MQ5 (LPG / CO) | 0 to 4095 ADC | — | Secondary gas indicator |
| MQ135 (air quality / NH3) | 0 to 4095 ADC | — | Ammonia detection |

All ADC values are 12-bit readings from the ESP32 (range: 0–4095). Out-of-range values are rejected at the API validation layer.

### DR-READINESS — Harvest Readiness Level Definitions

| Level | ENUM Value | HRI Value | Meaning |
|-------|------------|-----------|---------|
| Not Ready | `not_ready` | 0.25 | Environmental conditions do not indicate harvest readiness |
| Approaching | `approaching` | 0.50 | Conditions are developing towards readiness |
| Nearly Ready | `nearly_ready` | 0.75 | Conditions strongly indicate imminent readiness |
| Ready | `ready` | 1.00 | Harvest conditions met — beekeeper should inspect and harvest |

### DR-HRI — HRI Value Derivation

The `hri_value` stored in the `predictions` table is a **server-side class-to-score mapping**, not a raw sensor formula. It is derived from the ML classification output:

- The KNN model outputs a `readiness_level` label.
- Laravel maps the label to a fixed float using: `not_ready → 0.25`, `approaching → 0.50`, `nearly_ready → 0.75`, `ready → 1.00`.
- The `confidence_score` (separate field) is the KNN majority vote ratio (e.g. 4 out of 5 neighbours = 0.80).
- The `hri_value` is used for trend charts and summary averages. The `confidence_score` is used for alert messaging and analytics.
