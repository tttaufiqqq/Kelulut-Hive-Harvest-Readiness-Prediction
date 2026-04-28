# BuzzyHive 2.0 — Flow of Events

*Version: 1.0 | Date: 2026-04-29*

Each use case is documented with: Actor, Preconditions, Main Flow, Alternate Flows, and Postconditions.

---

## UC01: Invite Beekeeper

**Actor:** Admin
**Preconditions:**
- Admin is authenticated and has the *admin* role.
- The email address to be invited does not already exist in the system.

### Main Flow
1. Admin navigates to `/admin/beekeepers` and submits the create beekeeper form with name, email, and phone.
2. The system validates the input (name, email, and phone are required; email must be unique).
3. The system creates a new user record with `status = pending` and no password set.
4. The system assigns the *beekeeper* role to the new user.
5. The system generates a signed URL for `/invite/accept/{user}` with a 7-day expiry.
6. The system sends an invite email to the provided address containing the signed URL.
7. The system returns a 201 response. The admin sees the new beekeeper entry in the list with status *Pending*.

### Alternate Flows
- **AF1 — Validation failure:** If any required field is missing or the email is already registered, the system returns a 422 response with field-level validation errors. No user is created.
- **AF2 — Email delivery failure:** If the email service fails to deliver the invite, the user record and role assignment are still created. The admin can resend the invite via UC05.

**Postconditions:**
- A new user record exists with `status = pending` and the *beekeeper* role assigned.
- An invite email has been sent (or queued) to the provided address.

---

## UC03: Toggle Beekeeper Status

**Actor:** Admin
**Preconditions:**
- Admin is authenticated with the *admin* role.
- The target beekeeper account exists.

### Main Flow
1. Admin clicks the status toggle button next to a beekeeper on the `/admin/beekeepers` list.
2. The system sends `PATCH /admin/beekeepers/{user}/toggle-status`.
3. If the beekeeper's current status is *active*, the system sets it to *deactivated*.
4. If the beekeeper's current status is *deactivated*, the system sets it to *active*.
5. The system returns a 200 response. The beekeeper list reflects the updated status.

### Alternate Flows
- **AF1 — Toggle on pending account:** If the beekeeper's status is *pending* (invite not yet accepted), the toggle is disabled in the UI and the request is rejected by the server.
- **AF2 — Deactivated beekeeper attempts login:** A beekeeper with `status = deactivated` cannot authenticate. The login form displays an "Account deactivated" message.

**Postconditions:**
- The beekeeper's `status` field has been updated to the opposite of its previous value.
- If deactivated, any active sessions for that beekeeper are invalidated.

---

## UC10: View Dashboard

**Actor:** Beekeeper
**Preconditions:**
- Beekeeper is authenticated, email-verified, and has the *beekeeper* role.

### Main Flow
1. Beekeeper navigates to `/dashboard`.
2. The system queries all hives assigned to the authenticated beekeeper (`beekeeper_id = auth()->id()`).
3. For each hive, the system retrieves the hive summary (`latest_readiness_level`, `avg_hri_7d`, `last_harvest_date`, `total_harvests`).
4. The system renders the dashboard page via Inertia, passing the hive list and summaries as props.
5. The beekeeper sees a card for each hive showing its name, readiness status, and key summary metrics.

### Alternate Flows
- **AF1 — No hives assigned:** If the beekeeper has no hives, the dashboard displays an empty state with a prompt to create the first hive.
- **AF2 — No predictions yet:** If a hive has no prediction records, the readiness level shows as "No data yet" and HRI values display as "--".

**Postconditions:**
- No data is modified. This is a read-only operation.

---

## UC11: View Analytics

**Actor:** Beekeeper
**Preconditions:**
- Beekeeper is authenticated, email-verified, and has the *beekeeper* role.
- The requested hive is assigned to the authenticated beekeeper.

### Main Flow
1. Beekeeper navigates to `/hives/{hive}/analytics`.
2. The system checks that the beekeeper owns the requested hive. If not, a 403 response is returned.
3. The system executes five database queries:
   a. HRI trend: daily prediction values for the past 30 days, with a 7-day rolling average.
   b. Hourly sensor readings: all sensor_log records for today, grouped by hour.
   c. Score components: the latest prediction record's readiness level and confidence score.
   d. Harvest history: all harvest records for the hive, ordered by date descending.
   e. Hive summary: the current `hive_summary` record for the hive.
4. The system renders the analytics page via Inertia with all query results as props.
5. The beekeeper sees five visual sections: HRI trend chart, sensor chart, score components, harvest table, and summary card.

### Alternate Flows
- **AF1 — Hive not owned by beekeeper:** System returns 403. Beekeeper is redirected to the dashboard.
- **AF2 — No sensor logs for today:** The hourly sensor chart displays an empty state: "No readings recorded today."
- **AF3 — No predictions in the past 30 days:** The HRI trend chart displays an empty state: "No prediction data available."
- **AF4 — No harvests recorded:** The harvest history section displays: "No harvests recorded yet."

**Postconditions:**
- No data is modified. This is a read-only operation.

---

## UC13: Record Harvest

**Actor:** Beekeeper
**Preconditions:**
- Beekeeper is authenticated, email-verified, and has the *beekeeper* role.
- The target hive is assigned to the authenticated beekeeper.

### Main Flow
1. Beekeeper navigates to the harvest section for a hive and submits the harvest form.
2. The system validates the input: `harvest_date` and `weight` are required; `color_id` and `flavor_id` must reference valid entries in `master_honey_colors` and `master_honey_flavors`.
3. The system creates a `Harvest` record linked to the hive and the authenticated beekeeper.
4. The system updates the `hive_summary` for the hive: `last_harvest_date` is set to today, and `total_harvests` is incremented by 1.
5. The system returns a 201 response. The harvest appears in the harvest history list.

### Alternate Flows
- **AF1 — Validation failure:** If required fields are missing or foreign key references are invalid, the system returns a 422 response. No harvest is recorded.
- **AF2 — Unauthorised access:** If the beekeeper does not own the hive, the system returns a 403 response.

**Postconditions:**
- A new `harvests` record exists for the hive.
- The `hive_summary` record has been updated with the latest harvest date and count.

---

## UC14: Log Inspection

**Actor:** Beekeeper
**Preconditions:**
- Beekeeper is authenticated, email-verified, and has the *beekeeper* role.
- The target hive is assigned to the authenticated beekeeper.

### Main Flow
1. Beekeeper navigates to the inspection section for a hive and submits the inspection form.
2. The system validates the input: `inspection_date` is required; `weather_ids` must reference valid `master_weather_conditions` entries; `flora_ids` must reference valid `master_flora_types` entries.
3. The system creates an `Inspection` record with all observation fields.
4. The system writes one `inspection_weather` junction record for each selected weather condition.
5. The system writes one `inspection_flora` junction record for each selected flora type.
6. The system returns a 201 response. The inspection appears in the inspection history list.

### Alternate Flows
- **AF1 — Validation failure:** Invalid or missing fields result in a 422 response. No inspection is created.
- **AF2 — No weather or flora selected:** The system accepts the inspection with empty junction tables. Weather and flora associations are optional.
- **AF3 — Unauthorised access:** The system returns 403 if the beekeeper does not own the hive.

**Postconditions:**
- A new `inspections` record exists for the hive.
- Junction records exist in `inspection_weather` and `inspection_flora` for each selected association.

---

## UC15: Accept Invite

**Actor:** Beekeeper (new, pending)
**Preconditions:**
- A beekeeper account with `status = pending` exists (created via UC01).
- The beekeeper has received the invite email and the signed URL has not expired.

### Main Flow
1. Beekeeper clicks the invite link. The browser loads `GET /invite/accept/{user}?expires=...&signature=...`.
2. The system verifies the URL signature and expiry. If valid, the password setup form is displayed.
3. Beekeeper enters and confirms a password (minimum 8 characters).
4. Beekeeper submits the form via `POST /invite/accept/{user}`.
5. The system sets the beekeeper's `password` (hashed), `status = active`, and `email_verified_at = now()`.
6. The system logs the beekeeper in and redirects to `/dashboard`.

### Alternate Flows
- **AF1 — Expired invite link:** If the URL has expired (> 7 days), the system returns a 403 response: "This invite link has expired. Please contact your administrator."
- **AF2 — Invalid signature:** If the URL signature is tampered with, the system returns a 403 response.
- **AF3 — Account already active:** If the beekeeper's status is already *active* (invite previously accepted), the system returns a 403 response: "This invite has already been used."
- **AF4 — Password validation failure:** If the password is too short or the confirmation does not match, the system returns a 422 response and re-displays the form with errors.

**Postconditions:**
- The beekeeper's account status is *active*.
- The beekeeper has a hashed password and is authenticated.
- The beekeeper is redirected to the dashboard.

---

## UC17: Change Password

**Actor:** Beekeeper (or Admin)
**Preconditions:**
- User is authenticated and email-verified.

### Main Flow
1. User navigates to `/settings/security`.
2. User enters their current password and the new password (with confirmation).
3. User submits the form via `PUT /settings/password`.
4. The system verifies the current password against the stored hash.
5. The system updates the password with the new hashed value.
6. The system returns a 200 response. A success message is displayed.

### Alternate Flows
- **AF1 — Wrong current password:** If the current password does not match, the system returns a 422 response: "The provided password does not match your current password."
- **AF2 — New password too short:** If the new password is less than 8 characters, the system returns a 422 response.
- **AF3 — Rate limit exceeded:** If the user submits more than 6 requests per minute, the system returns a 429 Too Many Requests response.

**Postconditions:**
- The user's password has been updated.
- Existing sessions remain valid (Laravel default behaviour).

---

## UC18: Ingest Sensor Data

**Actor:** ESP32
**Preconditions:**
- The ESP32 device is powered on and connected to the network.
- A valid `X-API-Key` has been provisioned on the device.
- An `IotNode` record exists in the database with matching `device_id` and `hive_id`, with `status = active`.

### Main Flow
1. ESP32 sends `POST /api/sensor-data` with `Content-Type: application/json` and the `X-API-Key` header.
2. The payload contains: `device_id`, `hive_id`, `temp`, `humidity`, `mq2_value`, `mq3_value`, `mq5_value`, `mq135_value`.
3. The system validates the API key.
4. The system validates all payload fields against their permitted ranges.
5. The system resolves the IoT node by `device_id` and `hive_id` (must be active).
6. The system creates a `SensorLog` record with all 6 readings and `recorded_at = now()`.
7. The system returns `201 { "status": "ok" }` to the ESP32.
8. The system asynchronously calls `MlPredictionService::predict($log)` (UC19).

### Alternate Flows
- **AF1 — Invalid API key:** System returns `401 Unauthorized`. No data is stored.
- **AF2 — Payload validation failure:** System returns `422 Unprocessable Entity` with field-level errors. No data is stored.
- **AF3 — IoT node not found or inactive:** System returns `404 Not Found`. No data is stored.
- **AF4 — Flask unavailable (UC19 failure):** The sensor log is still stored. The prediction is silently skipped. A warning is written to the Laravel log. The 201 response has already been sent to the ESP32 before UC19 runs (non-blocking).

**Postconditions:**
- A `SensorLog` record exists with all 6 sensor readings and a `recorded_at` timestamp.
- A prediction is either stored (UC19 success) or skipped (UC19 failure) — either way, the sensor log is preserved.

---

## UC19: Classify Harvest Readiness

**Actor:** Flask ML Service (triggered by SensorController after UC18)
**Preconditions:**
- A `SensorLog` record has been created (UC18 completed successfully).
- The Flask ML service is running at `ML_API_URL/predict`.

### Main Flow
1. `MlPredictionService` constructs a JSON payload from the sensor log: `mq2_value`, `mq3_value`, `mq5_value`, `mq135_value`, `temp`, `humidity`.
2. The service sends `POST {ML_API_URL}/predict` with a 5-second timeout.
3. Flask receives the payload, applies the MinMaxScaler, and runs the trained KNN classifier.
4. Flask returns: `readiness_level` (one of: not_ready / approaching / nearly_ready / ready), `hri_value` (class-to-score map: 0.25 / 0.50 / 0.75 / 1.00), and `confidence_score` (KNN vote ratio, e.g. 0.80).
5. `MlPredictionService` creates a `Prediction` record in the database with the returned values and `prediction_timestamp = now()`.
6. If `readiness_level = ready`, `MlPredictionService` triggers UC20 (Telegram alert).

### Alternate Flows
- **AF1 — Flask connection refused:** `MlPredictionService` catches the exception, logs a warning (`Log::warning`), and returns `null`. No prediction is stored. UC20 is not triggered.
- **AF2 — Flask timeout (> 5s):** Same as AF1.
- **AF3 — Flask returns non-2xx:** Same as AF1.
- **AF4 — Missing fields in Flask response:** Same as AF1 (caught by `\Throwable`).

**Postconditions:**
- If successful: a `Prediction` record exists linked to the sensor log, with `readiness_level`, `hri_value`, `confidence_score`, and `prediction_timestamp`.
- If unsuccessful: no prediction is stored. The sensor log from UC18 is unaffected.

---

## UC20: Send Telegram Alert

**Actor:** Telegram Bot (triggered by MlPredictionService when readiness = ready)
**Preconditions:**
- UC19 has completed successfully.
- The prediction `readiness_level` is `ready`.
- A Telegram bot token and chat ID are configured in the system environment.

### Main Flow
1. `MlPredictionService` detects `readiness_level = ready` after storing the prediction.
2. The system composes a Telegram message including: hive name, readiness level ("Ready to Harvest"), HRI value, confidence score (as percentage), and prediction timestamp.
3. The system sends the message to the configured Telegram chat via the Telegram Bot API.
4. The Telegram API returns a 200 response. The beekeeper receives the alert on their Telegram account.

### Alternate Flows
- **AF1 — Telegram API unavailable:** The system logs a warning and continues. The prediction record is already stored. No retry is attempted.
- **AF2 — Flask was down (UC19 failed):** UC20 is never triggered. No alert is sent.
- **AF3 — Readiness level is not "ready":** UC20 is not triggered. This is the normal case for non-ready predictions.

**Postconditions:**
- A Telegram alert message has been delivered to the configured chat.
- No database records are created or modified by this use case.
