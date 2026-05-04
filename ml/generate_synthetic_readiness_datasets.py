from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List
import math
import random

import numpy as np
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "datasets"
SEED = 20260504

LABEL_BOUNDS = (
    (0.00, 0.35, "not_ready"),
    (0.35, 0.60, "approaching"),
    (0.60, 0.80, "nearly_ready"),
    (0.80, 1.01, "ready"),
)

SEASON_EFFECTS = {
    "dry": {"temp": 1.0, "humidity": -4.0, "gas": 6.0},
    "wet": {"temp": -0.5, "humidity": 6.0, "gas": 10.0},
    "inter_monsoon": {"temp": 0.2, "humidity": 2.0, "gas": 3.0},
}

WEATHER_EFFECTS = {
    "stable_clear": {"temp": 0.4, "humidity": -1.0, "gas": 0.0},
    "humid_rain": {"temp": -0.8, "humidity": 7.0, "gas": 12.0},
    "midday_heat": {"temp": 1.8, "humidity": -3.0, "gas": 10.0},
    "cloudy_stable": {"temp": -0.1, "humidity": 1.5, "gas": 2.0},
    "storm_front": {"temp": -1.5, "humidity": 8.0, "gas": 14.0},
    "post_rain": {"temp": -0.6, "humidity": 5.5, "gas": 8.0},
}

WEATHER_BY_SEASON = {
    "dry": ["stable_clear", "midday_heat", "cloudy_stable", "stable_clear", "midday_heat"],
    "wet": ["humid_rain", "storm_front", "post_rain", "cloudy_stable", "humid_rain"],
    "inter_monsoon": ["cloudy_stable", "stable_clear", "post_rain", "humid_rain", "stable_clear"],
}

PLAIN_LANGUAGE_RATIONALE = {
    "temperature": "Temperature is literature-informed as a core environmental variable, with overheating increasing stress in tropical deployments.",
    "humidity": "Humidity is literature-informed as a key environmental and fermentation-risk proxy, especially in wet tropical conditions.",
    "gas": "MQ gas sensors are treated as heuristic stress indicators because the literature review supports multi-sensor monitoring but does not validate a readiness-specific gas signature.",
    "time_series": "Time continuity is project-informed so the datasets better support ML prototyping and live prediction flow testing.",
    "labels": "Readiness labels are project heuristics derived from hidden maturity and stress variables rather than direct biological ground truth.",
}


@dataclass(frozen=True)
class Scenario:
    name: str
    maturity_shift: float
    stress_shift: float
    temp_range: tuple[float, float]
    humidity_range: tuple[float, float]
    mq2_range: tuple[float, float]
    mq3_range: tuple[float, float]
    mq5_range: tuple[float, float]
    mq135_range: tuple[float, float]
    age_range: tuple[int, int]
    cycle_range: tuple[float, float]
    volatility: float
    event_probability: float
    ood_probability: float
    preferred_seasons: tuple[str, ...]
    note: str


SCENARIOS: Dict[str, Scenario] = {
    "early_stage_healthy": Scenario(
        name="early_stage_healthy",
        maturity_shift=-0.18,
        stress_shift=-0.08,
        temp_range=(28.0, 31.2),
        humidity_range=(63.0, 76.0),
        mq2_range=(38.0, 88.0),
        mq3_range=(35.0, 92.0),
        mq5_range=(95.0, 150.0),
        mq135_range=(145.0, 205.0),
        age_range=(18, 55),
        cycle_range=(0.06, 0.32),
        volatility=0.05,
        event_probability=0.05,
        ood_probability=0.01,
        preferred_seasons=("wet", "inter_monsoon"),
        note="Low-maturity healthy hives with stable readings and little stress.",
    ),
    "mid_stage_stable": Scenario(
        name="mid_stage_stable",
        maturity_shift=-0.03,
        stress_shift=-0.06,
        temp_range=(28.4, 31.6),
        humidity_range=(61.0, 74.0),
        mq2_range=(65.0, 112.0),
        mq3_range=(62.0, 116.0),
        mq5_range=(138.0, 188.0),
        mq135_range=(185.0, 235.0),
        age_range=(42, 85),
        cycle_range=(0.28, 0.57),
        volatility=0.05,
        event_probability=0.08,
        ood_probability=0.01,
        preferred_seasons=("inter_monsoon", "dry"),
        note="Middle-cycle hives trending upward under comparatively stable conditions.",
    ),
    "late_stage_nearly_ready": Scenario(
        name="late_stage_nearly_ready",
        maturity_shift=0.09,
        stress_shift=-0.02,
        temp_range=(28.7, 31.5),
        humidity_range=(60.0, 72.0),
        mq2_range=(96.0, 138.0),
        mq3_range=(92.0, 145.0),
        mq5_range=(170.0, 214.0),
        mq135_range=(210.0, 255.0),
        age_range=(72, 118),
        cycle_range=(0.56, 0.82),
        volatility=0.04,
        event_probability=0.09,
        ood_probability=0.01,
        preferred_seasons=("dry", "inter_monsoon"),
        note="Late-cycle hives that are close to readiness without consistently crossing the final threshold.",
    ),
    "late_stage_ready": Scenario(
        name="late_stage_ready",
        maturity_shift=0.16,
        stress_shift=-0.10,
        temp_range=(28.6, 31.3),
        humidity_range=(57.0, 69.0),
        mq2_range=(115.0, 155.0),
        mq3_range=(112.0, 162.0),
        mq5_range=(186.0, 228.0),
        mq135_range=(224.0, 268.0),
        age_range=(95, 145),
        cycle_range=(0.78, 1.00),
        volatility=0.03,
        event_probability=0.06,
        ood_probability=0.00,
        preferred_seasons=("dry", "inter_monsoon"),
        note="Mature hives in favorable conditions with high readiness tendency.",
    ),
    "late_stage_overheated": Scenario(
        name="late_stage_overheated",
        maturity_shift=0.11,
        stress_shift=0.18,
        temp_range=(32.6, 36.8),
        humidity_range=(60.0, 79.0),
        mq2_range=(105.0, 165.0),
        mq3_range=(110.0, 170.0),
        mq5_range=(190.0, 248.0),
        mq135_range=(235.0, 308.0),
        age_range=(94, 145),
        cycle_range=(0.74, 1.00),
        volatility=0.08,
        event_probability=0.20,
        ood_probability=0.04,
        preferred_seasons=("dry",),
        note="Mature hives whose readiness is delayed by overheating events.",
    ),
    "high_humidity_fermentation_risk": Scenario(
        name="high_humidity_fermentation_risk",
        maturity_shift=0.08,
        stress_shift=0.20,
        temp_range=(28.1, 31.8),
        humidity_range=(78.0, 92.0),
        mq2_range=(92.0, 145.0),
        mq3_range=(98.0, 150.0),
        mq5_range=(175.0, 236.0),
        mq135_range=(220.0, 300.0),
        age_range=(82, 140),
        cycle_range=(0.70, 1.00),
        volatility=0.08,
        event_probability=0.22,
        ood_probability=0.04,
        preferred_seasons=("wet", "inter_monsoon"),
        note="Late-stage hives penalized by sustained high humidity and fermentation-risk conditions.",
    ),
    "high_gas_stress": Scenario(
        name="high_gas_stress",
        maturity_shift=0.06,
        stress_shift=0.22,
        temp_range=(29.0, 32.7),
        humidity_range=(62.0, 79.0),
        mq2_range=(138.0, 210.0),
        mq3_range=(142.0, 215.0),
        mq5_range=(224.0, 300.0),
        mq135_range=(270.0, 360.0),
        age_range=(78, 138),
        cycle_range=(0.66, 1.00),
        volatility=0.09,
        event_probability=0.20,
        ood_probability=0.04,
        preferred_seasons=("wet", "inter_monsoon"),
        note="Mature hives with elevated gas readings used as a heuristic stress signal.",
    ),
    "environmentally_unstable": Scenario(
        name="environmentally_unstable",
        maturity_shift=0.01,
        stress_shift=0.17,
        temp_range=(27.8, 34.2),
        humidity_range=(58.0, 88.0),
        mq2_range=(72.0, 172.0),
        mq3_range=(70.0, 176.0),
        mq5_range=(150.0, 272.0),
        mq135_range=(185.0, 338.0),
        age_range=(58, 132),
        cycle_range=(0.42, 0.92),
        volatility=0.14,
        event_probability=0.28,
        ood_probability=0.05,
        preferred_seasons=("wet", "inter_monsoon", "dry"),
        note="Mixed-stage hives with abrupt environmental fluctuations and unstable readings.",
    ),
    "sensor_anomaly_case": Scenario(
        name="sensor_anomaly_case",
        maturity_shift=-0.02,
        stress_shift=0.12,
        temp_range=(24.0, 38.0),
        humidity_range=(42.0, 96.0),
        mq2_range=(24.0, 245.0),
        mq3_range=(22.0, 250.0),
        mq5_range=(70.0, 360.0),
        mq135_range=(110.0, 430.0),
        age_range=(20, 136),
        cycle_range=(0.12, 0.96),
        volatility=0.20,
        event_probability=0.32,
        ood_probability=0.22,
        preferred_seasons=("wet", "dry", "inter_monsoon"),
        note="Abrupt spikes, near-fault patterns, and contradictory signals for warning-flow testing.",
    ),
    "extreme_outlier_case": Scenario(
        name="extreme_outlier_case",
        maturity_shift=-0.06,
        stress_shift=0.30,
        temp_range=(22.0, 42.0),
        humidity_range=(35.0, 99.0),
        mq2_range=(18.0, 380.0),
        mq3_range=(18.0, 390.0),
        mq5_range=(60.0, 520.0),
        mq135_range=(95.0, 620.0),
        age_range=(24, 148),
        cycle_range=(0.18, 1.00),
        volatility=0.32,
        event_probability=0.42,
        ood_probability=0.55,
        preferred_seasons=("wet", "dry", "inter_monsoon"),
        note="Dedicated stress-test rows containing extreme values and out-of-distribution combinations.",
    ),
}


def clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def choose_season(rng: random.Random, scenario: Scenario) -> str:
    return rng.choice(list(scenario.preferred_seasons))


def choose_weather(rng: random.Random, season: str, scenario_name: str, prior: str | None) -> str:
    options = list(WEATHER_BY_SEASON[season])
    if "overheated" in scenario_name:
        options.extend(["midday_heat", "midday_heat"])
    if "humidity" in scenario_name:
        options.extend(["humid_rain", "post_rain"])
    if "unstable" in scenario_name or "anomaly" in scenario_name or "outlier" in scenario_name:
        options.extend(["storm_front", "humid_rain", "midday_heat"])
    if prior and rng.random() < 0.62:
        return prior
    return rng.choice(options)


def rand_range(rng: random.Random, value_range: tuple[float, float]) -> float:
    return rng.uniform(value_range[0], value_range[1])


def smooth_step(start: float, end: float, fraction: float) -> float:
    eased = 3 * fraction ** 2 - 2 * fraction ** 3
    return start + (end - start) * eased


def normalized_excess(value: float, threshold: float, scale: float) -> float:
    return clamp((value - threshold) / scale, 0.0, 1.0)


def compute_threshold_warning_count(temp: float, humidity: float, mq2: float, mq3: float, mq5: float, mq135: float) -> int:
    checks = [
        temp >= 33.5,
        humidity >= 80.0,
        mq2 >= 180.0,
        mq3 >= 180.0,
        mq5 >= 260.0,
        mq135 >= 320.0,
    ]
    return sum(int(flag) for flag in checks)


def compute_indices(
    scenario: Scenario,
    temp: float,
    humidity: float,
    mq2: float,
    mq3: float,
    mq5: float,
    mq135: float,
    cycle_progress: float,
    hive_age_days: int,
    instability_index: float,
    threshold_warning_count: int,
    critical_stress_flag: bool,
    rng: random.Random,
) -> tuple[float, float, float]:
    age_factor = clamp((hive_age_days - 18) / 130.0, 0.0, 1.0)
    stability_bonus = 1.0 - instability_index

    temp_stress = max(
        normalized_excess(temp, 32.3, 3.8),
        normalized_excess(26.2 - temp, 0.0, 4.5),
    )
    humidity_stress = max(
        normalized_excess(humidity, 78.0, 16.0),
        normalized_excess(56.0 - humidity, 0.0, 12.0),
    )
    gas_stress = np.mean(
        [
            normalized_excess(mq2, 155.0, 95.0),
            normalized_excess(mq3, 155.0, 95.0),
            normalized_excess(mq5, 225.0, 140.0),
            normalized_excess(mq135, 275.0, 190.0),
        ]
    )
    warning_pressure = clamp(threshold_warning_count / 4.0, 0.0, 1.0)

    maturity_noise = rng.uniform(-0.035, 0.035)
    stress_noise = rng.uniform(-0.03, 0.03)

    maturity_index = clamp(
        0.10
        + 0.50 * cycle_progress
        + 0.17 * age_factor
        + 0.12 * stability_bonus
        + scenario.maturity_shift
        + maturity_noise,
        0.0,
        1.0,
    )

    stress_index = clamp(
        0.30 * temp_stress
        + 0.25 * humidity_stress
        + 0.25 * float(gas_stress)
        + 0.12 * instability_index
        + 0.08 * warning_pressure
        + (0.12 if critical_stress_flag else 0.0)
        + scenario.stress_shift
        + stress_noise,
        0.0,
        1.0,
    )

    readiness_score = clamp(
        0.05
        + 0.88 * maturity_index
        - 0.55 * stress_index
        - 0.06 * float(critical_stress_flag)
        + 0.03 * stability_bonus,
        0.0,
        1.0,
    )
    return maturity_index, stress_index, readiness_score


def classify_readiness(readiness_score: float) -> str:
    for lower, upper, label in LABEL_BOUNDS:
        if lower <= readiness_score < upper:
            return label
    return "ready"


def scenario_catalog() -> list[str]:
    return [scenario.name for scenario in SCENARIOS.values()]


def simulate_hive(
    rng: random.Random,
    hive_index: int,
    scenario: Scenario,
    periods: int,
    start_timestamp: pd.Timestamp,
    interval_hours: int,
) -> list[dict]:
    season = choose_season(rng, scenario)
    base_weather = choose_weather(rng, season, scenario.name, None)
    season_effect = SEASON_EFFECTS[season]

    start_age = rng.randint(*scenario.age_range)
    end_age = min(start_age + rng.randint(10, 36), 165)
    start_cycle = rand_range(rng, scenario.cycle_range)
    end_cycle = clamp(start_cycle + rng.uniform(0.08, 0.30), 0.0, 1.0)

    base_temp = rand_range(rng, scenario.temp_range) + rng.uniform(-0.3, 0.3)
    base_humidity = rand_range(rng, scenario.humidity_range) + rng.uniform(-1.2, 1.2)
    base_mq2 = rand_range(rng, scenario.mq2_range)
    base_mq3 = rand_range(rng, scenario.mq3_range)
    base_mq5 = rand_range(rng, scenario.mq5_range)
    base_mq135 = rand_range(rng, scenario.mq135_range)

    temp = base_temp
    humidity = base_humidity
    mq2 = base_mq2
    mq3 = base_mq3
    mq5 = base_mq5
    mq135 = base_mq135
    previous = None
    rows: list[dict] = []

    event_remaining = 0
    event_profile = {"temp": 0.0, "humidity": 0.0, "gas": 0.0}

    for step in range(periods):
        fraction = step / max(periods - 1, 1)
        timestamp = start_timestamp + pd.Timedelta(hours=interval_hours * step)
        hive_age_days = int(round(smooth_step(start_age, end_age, fraction)))
        days_since_last_harvest = max(0, hive_age_days - max(14, start_age - rng.randint(8, 18)))
        cycle_progress = clamp(smooth_step(start_cycle, end_cycle, fraction) + rng.uniform(-0.02, 0.02), 0.0, 1.0)

        if event_remaining <= 0 and rng.random() < scenario.event_probability:
            event_remaining = rng.randint(2, 6)
            if "overheated" in scenario.name:
                event_profile = {"temp": rng.uniform(1.8, 3.8), "humidity": rng.uniform(-3.0, 2.0), "gas": rng.uniform(8.0, 18.0)}
            elif "humidity" in scenario.name:
                event_profile = {"temp": rng.uniform(-1.0, 0.8), "humidity": rng.uniform(6.0, 12.0), "gas": rng.uniform(8.0, 18.0)}
            elif "gas" in scenario.name:
                event_profile = {"temp": rng.uniform(0.0, 1.2), "humidity": rng.uniform(0.0, 4.0), "gas": rng.uniform(18.0, 34.0)}
            elif "unstable" in scenario.name or "anomaly" in scenario.name or "outlier" in scenario.name:
                event_profile = {"temp": rng.uniform(-2.8, 3.4), "humidity": rng.uniform(-8.0, 10.0), "gas": rng.uniform(10.0, 40.0)}
            else:
                event_profile = {"temp": rng.uniform(-0.8, 1.6), "humidity": rng.uniform(-3.5, 4.5), "gas": rng.uniform(4.0, 12.0)}
        elif event_remaining > 0:
            event_remaining -= 1

        weather_state = choose_weather(rng, season, scenario.name, base_weather)
        base_weather = weather_state
        weather_effect = WEATHER_EFFECTS[weather_state]
        event_multiplier = 1.0 if event_remaining > 0 else 0.0

        temp_target = clamp(
            base_temp
            + season_effect["temp"]
            + weather_effect["temp"]
            + event_profile["temp"] * event_multiplier
            + 0.9 * cycle_progress,
            21.0,
            43.0,
        )
        humidity_target = clamp(
            base_humidity
            + season_effect["humidity"]
            + weather_effect["humidity"]
            + event_profile["humidity"] * event_multiplier
            - 1.2 * cycle_progress,
            32.0,
            99.0,
        )
        gas_target_shift = season_effect["gas"] + weather_effect["gas"] + event_profile["gas"] * event_multiplier + 20.0 * cycle_progress

        motion = 0.45 + scenario.volatility
        temp = clamp(temp + (temp_target - temp) * motion + rng.gauss(0.0, 0.18 + scenario.volatility * 0.8), 20.0, 43.0)
        humidity = clamp(humidity + (humidity_target - humidity) * motion + rng.gauss(0.0, 0.45 + scenario.volatility * 2.0), 30.0, 100.0)
        mq2 = clamp(mq2 + (base_mq2 + gas_target_shift - mq2) * motion + rng.gauss(0.0, 3.0 + scenario.volatility * 18.0), 5.0, 420.0)
        mq3 = clamp(mq3 + (base_mq3 + gas_target_shift - mq3) * motion + rng.gauss(0.0, 3.0 + scenario.volatility * 18.0), 5.0, 430.0)
        mq5 = clamp(mq5 + (base_mq5 + gas_target_shift * 1.15 - mq5) * motion + rng.gauss(0.0, 4.0 + scenario.volatility * 24.0), 35.0, 560.0)
        mq135 = clamp(mq135 + (base_mq135 + gas_target_shift * 1.30 - mq135) * motion + rng.gauss(0.0, 5.0 + scenario.volatility * 26.0), 45.0, 640.0)

        out_of_distribution_case = False
        if rng.random() < scenario.ood_probability:
            temp = clamp(temp + rng.uniform(-4.5, 5.0), 18.0, 44.0)
            humidity = clamp(humidity + rng.uniform(-14.0, 14.0), 25.0, 100.0)
            mq2 = clamp(mq2 + rng.uniform(-40.0, 80.0), 5.0, 420.0)
            mq3 = clamp(mq3 + rng.uniform(-40.0, 80.0), 5.0, 430.0)
            mq5 = clamp(mq5 + rng.uniform(-50.0, 120.0), 35.0, 560.0)
            mq135 = clamp(mq135 + rng.uniform(-60.0, 140.0), 45.0, 640.0)
            out_of_distribution_case = True

        if previous is None:
            instability_index = 0.05 + scenario.volatility * 0.4
        else:
            delta_temp = abs(temp - previous["temp"]) / 6.0
            delta_humidity = abs(humidity - previous["humidity"]) / 18.0
            delta_gas = np.mean(
                [
                    abs(mq2 - previous["mq2"]) / 120.0,
                    abs(mq3 - previous["mq3"]) / 120.0,
                    abs(mq5 - previous["mq5"]) / 180.0,
                    abs(mq135 - previous["mq135"]) / 220.0,
                ]
            )
            instability_index = clamp(0.40 * delta_temp + 0.28 * delta_humidity + 0.32 * float(delta_gas), 0.0, 1.0)

        threshold_warning_count = compute_threshold_warning_count(temp, humidity, mq2, mq3, mq5, mq135)
        critical_stress_flag = (
            threshold_warning_count >= 3
            or temp >= 35.5
            or humidity >= 88.0
            or mq135 >= 365.0
            or mq5 >= 305.0
        )
        if critical_stress_flag and scenario.name == "late_stage_ready" and temp < 34.0:
            critical_stress_flag = False

        maturity_index, stress_index, readiness_score = compute_indices(
            scenario=scenario,
            temp=temp,
            humidity=humidity,
            mq2=mq2,
            mq3=mq3,
            mq5=mq5,
            mq135=mq135,
            cycle_progress=cycle_progress,
            hive_age_days=hive_age_days,
            instability_index=instability_index,
            threshold_warning_count=threshold_warning_count,
            critical_stress_flag=critical_stress_flag,
            rng=rng,
        )
        readiness_level = classify_readiness(readiness_score)

        row = {
            "sample_id": f"BH-{scenario.name[:3].upper()}-{hive_index:03d}-{step:03d}",
            "hive_id": f"HIVE-{hive_index:03d}",
            "device_id": f"ESP32-{1000 + hive_index:04d}",
            "timestamp": timestamp.isoformat(),
            "hive_age_days": hive_age_days,
            "days_since_last_harvest": days_since_last_harvest,
            "cycle_progress": round(cycle_progress, 4),
            "scenario_type": scenario.name,
            "season": season,
            "weather_state": weather_state,
            "temp": round(temp, 2),
            "humidity": round(humidity, 2),
            "mq2_value": int(round(mq2)),
            "mq3_value": int(round(mq3)),
            "mq5_value": int(round(mq5)),
            "mq135_value": int(round(mq135)),
            "maturity_index": round(maturity_index, 4),
            "stress_index": round(stress_index, 4),
            "readiness_score": round(readiness_score, 4),
            "readiness_level": readiness_level,
            "out_of_distribution_case": out_of_distribution_case,
            "threshold_warning_count": threshold_warning_count,
            "critical_stress_flag": critical_stress_flag,
        }
        rows.append(row)
        previous = {"temp": temp, "humidity": humidity, "mq2": mq2, "mq3": mq3, "mq5": mq5, "mq135": mq135}

    return rows


def build_pool() -> pd.DataFrame:
    rng = random.Random(SEED)
    rows: list[dict] = []
    scenario_mix = [
        ("early_stage_healthy", 9, 80),
        ("mid_stage_stable", 10, 84),
        ("late_stage_nearly_ready", 10, 92),
        ("late_stage_ready", 8, 84),
        ("late_stage_overheated", 7, 86),
        ("high_humidity_fermentation_risk", 7, 84),
        ("high_gas_stress", 7, 82),
        ("environmentally_unstable", 8, 90),
        ("sensor_anomaly_case", 4, 70),
    ]
    hive_index = 1
    for scenario_name, hive_count, periods in scenario_mix:
        scenario = SCENARIOS[scenario_name]
        for _ in range(hive_count):
            start_day = rng.randint(0, 120)
            start_hour = rng.choice([0, 4, 8, 12, 16, 20])
            start_timestamp = pd.Timestamp("2026-01-01") + pd.Timedelta(days=start_day, hours=start_hour)
            rows.extend(simulate_hive(rng, hive_index, scenario, periods, start_timestamp, interval_hours=6))
            hive_index += 1
    return pd.DataFrame(rows)


def build_stress_test() -> pd.DataFrame:
    rng = random.Random(SEED + 11)
    rows: list[dict] = []
    hive_index = 900
    stress_mix = [
        ("late_stage_overheated", 3, 28),
        ("high_humidity_fermentation_risk", 3, 28),
        ("high_gas_stress", 3, 28),
        ("environmentally_unstable", 3, 28),
        ("sensor_anomaly_case", 5, 24),
        ("extreme_outlier_case", 6, 24),
    ]
    for scenario_name, hive_count, periods in stress_mix:
        scenario = SCENARIOS[scenario_name]
        for _ in range(hive_count):
            start_day = rng.randint(0, 150)
            start_hour = rng.choice([0, 3, 6, 9, 12, 15, 18, 21])
            start_timestamp = pd.Timestamp("2026-01-01") + pd.Timedelta(days=start_day, hours=start_hour)
            rows.extend(simulate_hive(rng, hive_index, scenario, periods, start_timestamp, interval_hours=3))
            hive_index += 1
    frame = pd.DataFrame(rows)
    frame["out_of_distribution_case"] = True
    return frame


def sample_balanced(frame: pd.DataFrame, per_class: int = 400) -> pd.DataFrame:
    sampled = []
    for label in ["not_ready", "approaching", "nearly_ready", "ready"]:
        subset = frame[frame["readiness_level"] == label]
        if len(subset) < per_class:
            raise ValueError(f"Insufficient rows for label {label}: found {len(subset)}, need {per_class}")
        sampled.append(subset.sample(n=per_class, random_state=SEED, replace=False))
    balanced = pd.concat(sampled, ignore_index=True)
    return balanced.sample(frac=1.0, random_state=SEED).reset_index(drop=True)


def select_main_pool(frame: pd.DataFrame) -> pd.DataFrame:
    return frame[
        (~frame["out_of_distribution_case"])
        & (frame["scenario_type"] != "sensor_anomaly_case")
        & (frame["temp"] <= 38.5)
        & (frame["humidity"] <= 95.0)
        & (frame["mq135_value"] <= 380)
        & (frame["mq5_value"] <= 320)
        & (frame["mq2_value"] <= 250)
        & (frame["mq3_value"] <= 250)
    ].copy()


def build_deployment_timeseries(frame: pd.DataFrame) -> pd.DataFrame:
    return frame.sort_values(["hive_id", "timestamp"]).reset_index(drop=True)


def to_training_flat(frame: pd.DataFrame) -> pd.DataFrame:
    return frame[
        [
            "mq2_value",
            "mq3_value",
            "mq5_value",
            "mq135_value",
            "temp",
            "humidity",
            "readiness_level",
        ]
    ].rename(columns={"readiness_level": "label"})


def build_data_dictionary() -> str:
    rows = [
        ("sample_id", "Synthetic reading identifier", "string"),
        ("hive_id", "Synthetic hive identifier", "string"),
        ("device_id", "Synthetic ESP32-style device identifier", "string"),
        ("timestamp", "Timestamp for the simulated reading", "ISO 8601 datetime"),
        ("hive_age_days", "Approximate hive age at the reading", "days"),
        ("days_since_last_harvest", "Approximate progression since the previous harvest cycle", "days"),
        ("cycle_progress", "Normalized harvest-cycle progression used as a hidden maturity driver", "0.0-1.0"),
        ("scenario_type", "Scenario family used to generate the row", "categorical"),
        ("season", "Synthetic Malaysia-oriented season context", "dry|wet|inter_monsoon"),
        ("weather_state", "Short-term weather state affecting the reading", "categorical"),
        ("temp", "Temperature reading", "degrees Celsius"),
        ("humidity", "Relative humidity reading", "percent"),
        ("mq2_value", "MQ-2 sensor proxy reading", "arbitrary unit"),
        ("mq3_value", "MQ-3 sensor proxy reading", "arbitrary unit"),
        ("mq5_value", "MQ-5 sensor proxy reading", "arbitrary unit"),
        ("mq135_value", "MQ-135 sensor proxy reading", "arbitrary unit"),
        ("maturity_index", "Hidden synthetic maturity variable", "0.0-1.0"),
        ("stress_index", "Hidden synthetic stress variable", "0.0-1.0"),
        ("readiness_score", "Synthetic readiness score derived from maturity and stress", "0.0-1.0"),
        ("readiness_level", "Final categorical readiness label", "not_ready|approaching|nearly_ready|ready"),
        ("out_of_distribution_case", "Flag for anomaly or stress-test rows", "boolean"),
        ("threshold_warning_count", "Count of threshold exceedances across key sensor features", "integer"),
        ("critical_stress_flag", "Flag for severe environmental or gas stress", "boolean"),
    ]
    lines = [
        "# Synthetic Readiness Data Dictionary v1",
        "",
        "This dictionary documents the rule-informed synthetic prototype dataset for kelulut harvest readiness work.",
        "",
        "| Column | Meaning | Unit / Type |",
        "| --- | --- | --- |",
    ]
    for column, meaning, unit in rows:
        lines.append(f"| `{column}` | {meaning} | {unit} |")
    lines.extend(
        [
            "",
            "## Label Mapping",
            "",
            "- `0.00` to `<0.35` -> `not_ready`",
            "- `0.35` to `<0.60` -> `approaching`",
            "- `0.60` to `<0.80` -> `nearly_ready`",
            "- `0.80` to `1.00` -> `ready`",
            "",
            "These boundaries are project heuristics for prototyping and not biological ground truth.",
        ]
    )
    return "\n".join(lines) + "\n"


def build_assumptions_note() -> str:
    lines = [
        "# Synthetic Readiness Generation Assumptions v1",
        "",
        "## Dataset Positioning",
        "",
        "- This dataset is a `rule-informed synthetic prototype dataset` for pipeline prototyping, UI integration, and warning-flow simulation.",
        "- It is not real harvest-readiness ground truth and should not be presented as validated biological evidence.",
        "",
        "## Literature-Informed Elements",
        "",
        f"- {PLAIN_LANGUAGE_RATIONALE['temperature']}",
        f"- {PLAIN_LANGUAGE_RATIONALE['humidity']}",
        f"- {PLAIN_LANGUAGE_RATIONALE['gas']}",
        "- The literature review emphasizes multi-sensor integration, tropical deployment constraints, and the need for calibration under Malaysian conditions. Those themes guided the use of scenario families, season context, and controlled sensor noise.",
        "",
        "## Threshold-Informed Elements",
        "",
        "- High temperature, very high humidity, and elevated gas readings increase `threshold_warning_count` and can trigger `critical_stress_flag`.",
        "- Rows with strong warning signals are discouraged from landing in the `ready` class because the plan called for consistency with the app’s rule-based interpretation.",
        "",
        "## Project Heuristics",
        "",
        f"- {PLAIN_LANGUAGE_RATIONALE['time_series']}",
        f"- {PLAIN_LANGUAGE_RATIONALE['labels']}",
        "- `maturity_index`, `stress_index`, and `readiness_score` are latent variables created for smoother class transitions and more realistic model-prototyping behavior.",
        "- Scenario families were used instead of pure random sampling so the dataset can express meaningful states such as overheating, humidity risk, gas stress, and instability.",
        "",
        "## Stress-Test Rows",
        "",
        "- `sensor_anomaly_case` and `extreme_outlier_case` are intended for warning logic, out-of-distribution handling, and robustness checks.",
        "- Stress-test rows should not be mixed into normal prototype training without a deliberate experiment design.",
        "",
        "## Recommended Use",
        "",
        "- Use the balanced dataset for first-pass model training experiments.",
        "- Use the time-series dataset for sequence-aware testing, UI playback, and end-to-end monitoring flows.",
        "- Use the stress-test dataset for safety checks, anomaly handling, and threshold-warning validation.",
    ]
    return "\n".join(lines) + "\n"


def write_outputs(files: Dict[str, pd.DataFrame]) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for name, frame in files.items():
        frame.to_csv(OUTPUT_DIR / name, index=False)
    (OUTPUT_DIR / "synthetic_readiness_data_dictionary_v1.md").write_text(build_data_dictionary(), encoding="utf-8")
    (OUTPUT_DIR / "synthetic_readiness_generation_assumptions_v1.md").write_text(build_assumptions_note(), encoding="utf-8")


def print_validation(name: str, frame: pd.DataFrame) -> None:
    counts = frame["readiness_level"].value_counts().to_dict()
    scenario_counts = frame["scenario_type"].value_counts().head(5).to_dict()
    min_max = {
        "temp": (round(frame["temp"].min(), 2), round(frame["temp"].max(), 2)),
        "humidity": (round(frame["humidity"].min(), 2), round(frame["humidity"].max(), 2)),
        "mq135_value": (int(frame["mq135_value"].min()), int(frame["mq135_value"].max())),
        "readiness_score": (round(frame["readiness_score"].min(), 4), round(frame["readiness_score"].max(), 4)),
    }
    print(f"\n{name}")
    print(f"rows={len(frame)}")
    print(f"class_balance={counts}")
    print(f"top_scenarios={scenario_counts}")
    print(f"ranges={min_max}")


def main() -> None:
    pool = build_pool()
    main_pool = select_main_pool(pool)
    balanced = sample_balanced(main_pool, per_class=400)
    timeseries = build_deployment_timeseries(main_pool)
    stress_test = build_stress_test()
    training_flat = to_training_flat(balanced)

    write_outputs(
        {
            "synthetic_readiness_balanced_v1.csv": balanced,
            "synthetic_readiness_timeseries_v1.csv": timeseries,
            "synthetic_readiness_stress_test_v1.csv": stress_test,
            "synthetic_readiness_training_flat_v1.csv": training_flat,
        }
    )

    print_validation("balanced", balanced)
    print_validation("timeseries", timeseries)
    print_validation("stress_test", stress_test)
    print(f"\noutput_dir={OUTPUT_DIR}")
    print(f"scenarios={scenario_catalog()}")


if __name__ == "__main__":
    main()
