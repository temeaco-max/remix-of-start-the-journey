#!/usr/bin/env python3
"""Run the existing Kurukoo teacher adapters against the OS-driven Behaviour Pack corpus.

This is intentionally a thin wrapper around generate_trajectory_candidates.py so the
provider adapters, free-first routing, JSON validation and provenance rules remain
single-source. The wrapper only changes the scenario source and adds the current
Behaviour Pack context to the teacher system contract.
"""
from __future__ import annotations

import importlib.util
import json
import os
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
PACK_PATH = ROOT / "ml" / "behaviour" / "latest.json"
SCENARIO_PATH = ROOT / "ml" / "datasets" / "kurukoo-os-v1.all.jsonl"
TEACHER_MODULE_PATH = ROOT / "ml" / "teachers" / "generate_trajectory_candidates.py"

if not PACK_PATH.exists():
    raise SystemExit("Behaviour Pack missing. Run npx tsx scripts/compile-kurukoo-behaviour-pack.ts first.")
if not SCENARIO_PATH.exists():
    raise SystemExit("OS-driven scenarios missing. Run npx tsx scripts/compile-kurukoo-scenarios.ts first.")

pack = json.loads(PACK_PATH.read_text(encoding="utf-8"))

spec = importlib.util.spec_from_file_location("kurukoo_teacher", TEACHER_MODULE_PATH)
if spec is None or spec.loader is None:
    raise SystemExit("Unable to load the canonical teacher implementation.")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

behaviour_context = {
    "packVersion": pack.get("packVersion"),
    "packHash": pack.get("packHash"),
    "constitution": pack.get("constitution", {}),
    "behaviourFamilies": pack.get("behaviourFamilies", []),
    "truthBoundary": pack.get("truthBoundary", {}),
    "safetyBoundary": pack.get("safetyBoundary", {}),
    "activationStates": pack.get("activationStates", {}),
}

module.SCENARIO_PATH = SCENARIO_PATH
module.SYSTEM = module.SYSTEM + "\n\nCURRENT KURUKOO BEHAVIOUR PACK (authoritative teaching context; do not expose internal labels to users):\n" + json.dumps(behaviour_context, separators=(",", ":"))
module.LIMIT = max(1, min(int(os.environ.get("KURUKOO_TEACHER_LIMIT", "25")), 500))

# Ensure the imported teacher emits the same provenance plus the Behaviour Pack identity.
original_candidate_id = module.candidate_id

def candidate_id(row, index, provider, model):
    return original_candidate_id(row, index, provider, model) + ":" + str(pack.get("packHash", ""))[:12]

module.candidate_id = candidate_id

sys.exit(module.main())
