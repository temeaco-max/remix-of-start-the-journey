#!/usr/bin/env python3
"""Dependency-light tests for the guarded student-model training boundaries."""
import json
import os
import pathlib
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
TRAIN = ROOT / "ml" / "train_smollm2_qlora.py"
VERIFY = ROOT / "ml" / "verify_smollm2_artifact.py"
DATASET = ROOT / "ml" / "datasets" / "kurukoo-core-v1.train.jsonl"


def test_training_disabled():
    result = subprocess.run(
        [sys.executable, str(TRAIN)],
        cwd=ROOT,
        env={**os.environ, "KURUKOO_ENABLE_TRAINING": "false"},
        text=True,
        capture_output=True,
    )
    if result.returncode != 0:
        raise AssertionError(result.stderr or result.stdout)
    if "No model weights were created or promoted." not in result.stdout:
        raise AssertionError("training-disabled guard did not report safe no-op")


def test_missing_artifact_fails_closed():
    with tempfile.TemporaryDirectory() as tmp:
        result = subprocess.run(
            [sys.executable, str(VERIFY)],
            cwd=ROOT,
            env={**os.environ, "KURUKOO_SMOLLM2_ARTIFACT": str(pathlib.Path(tmp) / "missing")},
            text=True,
            capture_output=True,
        )
        if result.returncode == 0:
            raise AssertionError("missing artifact unexpectedly passed verification")
        payload = json.loads(result.stdout)
        if payload.get("status") != "ineligible_for_registry_review":
            raise AssertionError("artifact verifier did not fail closed")


def test_dataset_exists():
    if not DATASET.exists():
        raise AssertionError(f"expected generated training dataset: {DATASET}")


if __name__ == "__main__":
    test_dataset_exists()
    test_training_disabled()
    test_missing_artifact_fails_closed()
    print("Kurukoo student-model training boundary tests passed.")
