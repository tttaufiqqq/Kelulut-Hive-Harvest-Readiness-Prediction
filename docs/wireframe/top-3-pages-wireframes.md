# BuzzyHive 2.0 — Top 3 Page ASCII Wireframes

*Version: 1.0 | Date: 2026-05-07 | Status: Drafted*

---

## Overview

This document provides simple ASCII wireframes for the three most important BuzzyHive pages:

1. Live Predictions
2. Dashboard
3. Analytics

These wireframes are intended for thesis documentation and focus on:

- Navigation design
- Input design
- Output design

---

## 1. Live Predictions Page

**Page role:** Displays the latest ML harvest-readiness result, trust/warning state, live trend charts, and prediction history for one hive.

**Primary user:** Beekeeper

**Navigation:** Opened from the Dashboard through the `View Live Predictions` action.

```text
[1] Title / System Header
      |
      v
+--------------------------------------------------------------------------------------------------+   <-- [2] User Profile
| BuzzyHive 2.0                                                     Live Predictions               |       / Session
| Breadcrumbs: Home > My Hives > [Hive Name] > Live Predictions                 [User/Profile]    |
+--------------------------------------------------------------------------------------------------+
| [3] Back Button -> [<- Back to Dashboard]                           [4] Date Filter -> [v]       |
+--------------------------------------------------------------------------------------------------+
| [5] Hive Context: HIVE = [Hive Name]                                                             |
|--------------------------------------------------------------------------------------------------|
| +--------------------------------------+  +----------------------------------------------------+ |
| | [6] Latest Prediction Output         |  | [7] Trust / Warning Output                        | |
| |--------------------------------------|  |----------------------------------------------------| |
| | Readiness Badge: [READY]             |  | Trust Label: [Trusted / Use Caution / Low Trust] | |
| | HRI Score: 92%                       |  | Warning Text / Guardrail Action                   | |
| | Confidence Score: 88.5%              |  | Action Advice for beekeeper                       | |
| | Captured Time: 10:35 AM              |  +----------------------------------------------------+ |
| | Prediction Time: 10:35 AM            |                                                        |
| +--------------------------------------+                                                        |
|                                                                                                  |
| +---------------------------------------------------+  +--------------------------------------+ |
| | [8] HRI Trend Chart                               |  | [9] Environmental Context Chart      | |
| |---------------------------------------------------|  |--------------------------------------| |
| | Area chart of HRI % + confidence over time        |  | Line chart of temperature/humidity   | |
| |                                                   |  | versus recent live readings          | |
| +---------------------------------------------------+  +--------------------------------------+ |
|                                                                                                  |
| +----------------------------------------------------------------------------------------------+ |
| | [10] Sensor Snapshot Output                                                                   | |
| |----------------------------------------------------------------------------------------------| |
| | Temp | Humidity | MQ2 | MQ3 | MQ5 | MQ135                                                   | |
| | 34 C |   72 %   | 310 | 275 | 290 | 320                                                     | |
| +----------------------------------------------------------------------------------------------+ |
|                                                                                                  |
| +----------------------------------------------------------------------------------------------+ |
| | [11] Prediction History Table                                                                 | |
| |----------------------------------------------------------------------------------------------| |
| | [Time] [Readiness] [HRI] [Confidence] [Trust] [Device] [View Details]                       | |
| | 10:35  Ready       92%   88.5%        Trusted NODE-001 [Open]                               | |
| | 09:55  Nearly      78%   84.0%        Caution NODE-001 [Open]                               | |
| | 09:15  Approaching 61%   79.2%        Trusted NODE-001 [Open]                               | |
| +----------------------------------------------------------------------------------------------+ |
+--------------------------------------------------------------------------------------------------+
```

**Figure W1: Live Predictions Page Wireframe**

**Wireframe labels**

1. Page title and system header
2. User profile/session area
3. Back navigation to dashboard
4. Date filter input
5. Current hive context
6. Latest prediction result output
7. Trust/warning explanation output
8. HRI trend chart output
9. Environmental context chart output
10. Sensor snapshot output
11. Prediction history output table

**Navigation System**

Users reach the Live Predictions page by clicking the `View Live Predictions` button from the Dashboard page after selecting a hive. The breadcrumb at the top shows the current module path, which helps users understand that they are inside a specific hive's prediction-monitoring screen. A back button is placed near the top of the page so the beekeeper can quickly return to the Dashboard without losing context.

**Input Design**

This page has lightweight interaction instead of full data-entry forms. The main input control is the date filter, which allows the user to change the chart and history view based on a selected day. The prediction history table also acts as an interaction surface because the user can choose a historical prediction entry to inspect more details. These controls support analysis and review rather than manual record creation.

**Output Design**

The page is designed to present prediction results clearly and in multiple layers. At the top, the latest prediction card shows the current readiness badge, HRI score, confidence score, and timestamp. Next to it, the trust/warning panel explains whether the model output is safe to rely on. Below that, charts display the HRI trend and environmental context, followed by a sensor snapshot and a prediction history table that together provide both summary output and detailed historical evidence.

---

## 2. Dashboard Page

**Page role:** Main beekeeper landing page for reviewing assigned hives, readiness level, sensor averages, and next actions.

**Primary user:** Beekeeper

**Navigation:** Main authenticated home page after login for beekeeper users.

```text
[1] Title / Page Header
      |
      v
+--------------------------------------------------------------------------------------------------+   <-- [2] Tabs / Module Menu
| BuzzyHive 2.0                                                     Dashboard | Harvests | ...     |
| Breadcrumbs: Home > My Hives                                                                [User]|
+--------------------------------------------------------------------------------------------------+
| [3] Page Title: Your Hives                                                                      |
| [4] Page Subtitle: Monitor readiness, recent sensor trends, and live predictions.               |
+--------------------------------------------------------------------------------------------------+
| +--------------------------------------+  +----------------------------------------------------+ |
| | [5] Hive List / Navigation Menu      |  | [6] Selected Hive Overview                        | |
| |--------------------------------------|  |----------------------------------------------------| |
| | [Hive A]                             |  | Hive Name: [Hive A]                                | |
| | Species                              |  | Species: Kelulut                                   | |
| | Age: 6m  Harvests: 3  Status: Active |  | Readiness Score: 84%   Badge: [Nearly Ready]      | |
| | Progress: ===================--      |  | [7] Analytics Button                              | |
| |--------------------------------------|  |                                                    | |
| | [Hive B]                             |  | [8] Hive Summary Output                           | |
| | Species                              |  | Total Harvests: 3                                 | |
| | Age: 4m  Harvests: 1  Status: Active |  | Hive Age: 6 months                                | |
| | Progress: ===============-----       |  | Harvest Target Guidance with 80% marker           | |
| |--------------------------------------|  +----------------------------------------------------+ |
| | [Hive C]                             |                                                        |
| | ...                                  |                                                        |
| +--------------------------------------+                                                        |
|                                                                                                  |
|                                         +----------------------------------------------------+   |
|                                         | [9] Sensor Average Output Cards                    |   |
|                                         |----------------------------------------------------|   |
|                                         | Avg Temp | Avg Humidity | Avg MQ2 | Avg MQ3       |   |
|                                         | Avg MQ5  | Avg MQ135                                |   |
|                                         +----------------------------------------------------+   |
|                                                                                                  |
|                                         +----------------------------------------------------+   |
|                                         | [10] Latest Prediction Summary                     |   |
|                                         |----------------------------------------------------|   |
|                                         | Readiness Badge + Short Description                |   |
|                                         | [11] Action Button -> View Live Predictions        |   |
|                                         +----------------------------------------------------+   |
+--------------------------------------------------------------------------------------------------+
```

**Figure W2: Dashboard Page Wireframe**

**Wireframe labels**

1. Page title header
2. Main navigation tabs/menu
3. Page title text
4. Page subtitle text
5. Hive selection menu
6. Selected hive detail panel
7. Analytics navigation button
8. Hive summary and readiness guidance output
9. Sensor average output cards
10. Latest prediction summary output
11. Navigation action to live predictions

**Navigation System**

The Dashboard page acts as the main entry point for beekeeper users after login. Users move between modules through the top tab navigation, which links the Dashboard to other pages such as Harvests, Inspections, and Reporting. Inside the page, the hive list on the left works as internal navigation because selecting a hive updates the content shown on the right. From the selected hive panel, users can continue to the Analytics page or the Live Predictions page for deeper monitoring.

**Input Design**

The Dashboard mainly uses selection-based input rather than traditional form submission. Users choose a hive by clicking a hive card in the left-side list, and the system updates the overview panel according to the selected hive. The page also includes action buttons such as `Analytics` and `View Live Predictions`, which serve as navigation inputs to open more detailed screens for the same hive. This design reduces typing and makes daily monitoring faster for the beekeeper.

**Output Design**

The page presents a compact operational summary of all assigned hives. The left panel outputs a list of hive cards with status, age, harvest count, and readiness progress. The main panel outputs the selected hive's readiness score, badge, harvest target guidance, and summary statistics. Additional sensor average cards and a latest prediction summary give the user immediate decision-support output without requiring them to open a separate report first.

---

## 3. Analytics Page

**Page role:** Displays detailed business intelligence for one hive, including HRI trends, daily sensor curves, latest prediction, and harvest history.

**Primary user:** Beekeeper

**Navigation:** Opened from the Dashboard through the `Analytics` button.

```text
[1] Title / System Header
      |
      v
+--------------------------------------------------------------------------------------------------+   <-- [2] User Profile
| BuzzyHive 2.0                                                          Analytics                 |       / Session
| Breadcrumbs: Home > My Hives > [Hive Name] > Analytics                    [User/Profile]         |
+--------------------------------------------------------------------------------------------------+
| [3] Back Button -> [<- Back]                                                                      |
| [4] Page Title: Analytics                                                                         |
| [5] Hive Context: [Hive Name] - Harvest Readiness Intelligence                                    |
+--------------------------------------------------------------------------------------------------+
| +--------------------------------------+  +----------------------------------------------------+ |
| | [6] HRI Score Card                   |  | [7] HRI Trend Output Chart                        | |
| |--------------------------------------|  |----------------------------------------------------| |
| | Current Avg HRI: 81%                 |  | Area chart of daily HRI score                     | |
| | Readiness Badge: Nearly Ready        |  | Dashed line for 7-day average                     | |
| | 7-day Avg: 77%                       |  |                                                    | |
| +--------------------------------------+  +----------------------------------------------------+ |
|                                                                                                  |
| +----------------------------------------------------------------------------------------------+ |
| | [8] Daily Sensor Curves                                                                      | |
| |----------------------------------------------------------------------------------------------| |
| | [9] Date Picker Input   [10] Sensor Group Filter Input                                       | |
| |                                                                                              | |
| | Line chart of Temp / Humidity / MQ2 / MQ3 / MQ5 / MQ135                                     | |
| +----------------------------------------------------------------------------------------------+ |
|                                                                                                  |
| +---------------------------------------------+  +---------------------------------------------+ |
| | [11] Latest Prediction Output               |  | [12] Harvest History Output                  | |
| |---------------------------------------------|  |---------------------------------------------| |
| | Badge: [Ready]                              |  | Bar chart of harvest weights by date         | |
| | Confidence bar                              |  |                                             | |
| | HRI Value: 92%                              |  |                                             | |
| | Timestamp: 07 May 2026, 10:35               |  |                                             | |
| +---------------------------------------------+  +---------------------------------------------+ |
+--------------------------------------------------------------------------------------------------+
```

**Figure W3: Analytics Page Wireframe**

**Wireframe labels**

1. Page title and system header
2. User profile/session area
3. Back navigation button
4. Page title text
5. Hive context heading
6. HRI score summary output
7. HRI trend chart output
8. Sensor chart section
9. Date picker input
10. Sensor group filter input
11. Latest prediction output
12. Harvest history output

**Navigation System**

Users open the Analytics page from the Dashboard by pressing the `Analytics` button for a selected hive. The breadcrumb trail shows the page hierarchy and confirms that the user is viewing analytics for one specific hive. A back button is included near the page title to let the user return to the Dashboard quickly after reviewing the charts and reports.

**Input Design**

The Analytics page includes filter inputs that support report exploration. The date picker allows the user to request sensor readings for a specific day, while the sensor group dropdown lets the user switch between all sensors, environmental sensors, or gas sensors. These inputs help users refine the displayed information without editing any stored data, making the page suitable for analytical review and decision support.

**Output Design**

This page is structured as a reporting and intelligence screen. The HRI score card outputs the current average readiness and 7-day average, while the HRI trend chart shows readiness movement over the last 30 days. The daily sensor chart visualizes raw environmental and gas data based on the selected filters. At the bottom, the latest prediction card outputs the most recent ML result, and the harvest history chart displays previous harvest weights so users can compare prediction patterns with actual harvesting outcomes.

---

## Summary

These three pages represent the strongest end-user flow in BuzzyHive:

1. `Dashboard` for overview and navigation
2. `Analytics` for detailed trend analysis
3. `Live Predictions` for real-time ML decision support

Together, they cover the thesis requirements for navigation, data input/filter interaction, and system output presentation.
