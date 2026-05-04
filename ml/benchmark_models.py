#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

from training_pipeline import benchmark_all_datasets, build_report_markdown


BASE = Path(__file__).resolve().parent
REPORT_DIR = BASE / 'reports'


def main() -> None:
    report = benchmark_all_datasets()
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    json_path = REPORT_DIR / 'model_benchmark_report.json'
    md_path = REPORT_DIR / 'model_benchmark_report.md'

    json_path.write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    md_path.write_text(build_report_markdown(report), encoding='utf-8')

    for dataset_name, payload in report['datasets'].items():
        best = payload['best_macro_f1_candidate']
        recommended = payload['recommended_candidate']
        recommended_candidate = recommended['candidate']
        print(
            f"{dataset_name}: highest_macro_f1={best['candidate']} "
            f"recommended={recommended_candidate['candidate']} "
            f"blocked={recommended['deployment_blocked']}"
        )

    print(f"json_report={json_path}")
    print(f"markdown_report={md_path}")


if __name__ == '__main__':
    main()
