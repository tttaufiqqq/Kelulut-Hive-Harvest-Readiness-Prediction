#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

from training_pipeline import DATASET_PRESETS, BENCHMARK_CANDIDATES, train_and_save_model


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description='Train a BuzzyHive readiness model from a repeatable script.',
    )
    parser.add_argument(
        '--dataset',
        default='legacy',
        help='Dataset preset name or CSV path. Presets: legacy, synthetic_flat.',
    )
    parser.add_argument(
        '--candidate',
        default='knn_k5_distance',
        choices=[spec.key for spec in BENCHMARK_CANDIDATES],
        help='Model candidate to train.',
    )
    parser.add_argument(
        '--output-dir',
        default=str(Path(__file__).resolve().parent / 'artifacts' / 'generated'),
        help='Directory for model.pkl, scaler.pkl, and model_metadata.json.',
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    output_dir = Path(args.output_dir).resolve()
    metadata = train_and_save_model(
        dataset=args.dataset,
        candidate_key=args.candidate,
        output_model=output_dir / 'model.pkl',
        output_scaler=output_dir / 'scaler.pkl',
        output_metadata=output_dir / 'model_metadata.json',
    )

    print(f"dataset={args.dataset}")
    print(f"resolved_dataset={DATASET_PRESETS.get(args.dataset, Path(args.dataset).resolve())}")
    print(f"candidate={args.candidate}")
    print(f"output_dir={output_dir}")
    print(f"model_version={metadata['model_version']}")


if __name__ == '__main__':
    main()
