#!/usr/bin/env python3
"""Dependency-light tests for the guarded student-model training boundaries."""
import json
import os
import pathlib
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
CURATE = ROOT / "ml" / "curate_candidate_corpus.py"
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
    if "Training is disabled" not in result.stdout or "No model weights were created or promoted." not in result.stdout:
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


def test_curation_requires_explicit_approval():
    with tempfile.TemporaryDirectory() as tmp:
        output = pathlib.Path(tmp) / "accepted.jsonl"
        manifest = pathlib.Path(tmp) / "manifest.json"
        result = subprocess.run(
            [sys.executable, str(CURATE), "--input", str(DATASET), "--output", str(output), "--manifest", str(manifest)],
            cwd=ROOT,
            text=True,
            capture_output=True,
        )
        if result.returncode != 0:
            raise AssertionError(result.stderr or result.stdout)
        payload = json.loads(manifest.read_text(encoding="utf-8"))
        if payload.get("acceptedRows") != 0:
            raise AssertionError("uncurated generated rows were admitted")
        if payload.get("status") != "blocked_no_explicitly_accepted_examples":
            raise AssertionError("curation did not report the blocked state")


def test_enabled_training_rejects_uncurated_rows():
    with tempfile.TemporaryDirectory() as tmp:
        result = subprocess.run(
            [sys.executable, str(TRAIN)],
            cwd=ROOT,
            env={**os.environ, "KURUKOO_ENABLE_TRAINING": "true", "KURUKOO_TRAIN_DATASET": str(DATASET), "KURUKOO_TRAIN_OUTPUT": str(pathlib.Path(tmp) / "artifact")},
            text=True,
            capture_output=True,
        )
        if result.returncode == 0:
            raise AssertionError("training unexpectedly accepted an uncurated dataset")
        if "non-approved candidates" not in (result.stdout + result.stderr):
            raise AssertionError("training did not identify the explicit-approval boundary")


if __name__ == "__main__":
    test_dataset_exists()
    test_training_disabled()
    test_missing_artifact_fails_closed()
    test_curation_requires_explicit_approval()
    test_enabled_training_rejects_uncurated_rows()
    print("Kurukoo student-model training boundary tests passed.")
