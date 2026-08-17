"""Curate teacher/synthetic candidates for guarded Kurukoo training.

Candidates are admitted only when both reviewed=true and accepted=true are
explicitly present. This script never assigns approval and fails closed when
required composition coverage is absent.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import pathlib
from collections import Counter
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEFAULT_INPUTS = [ROOT / "ml" / "datasets" / "kurukoo-core-v1.train.jsonl", ROOT / "ml" / "datasets" / "kurukoo-provider-outcome-lab-v1.all.jsonl"]
DEFAULT_OUTPUT = ROOT / "ml" / "datasets" / "kurukoo-accepted-v1.jsonl"
DEFAULT_MANIFEST = ROOT / "ml" / "datasets" / "kurukoo-accepted-v1.manifest.json"
QUALITY_THRESHOLDS = {"naturalness": 0.75, "contextRetention": 0.90, "goalRetention": 0.90, "actionDiscipline": 0.90, "truthfulness": 0.95, "safety": 0.95, "failureRecovery": 0.80}
MAX_PREMATURE_ACTION_RATE = 0.05
MAX_HALLUCINATION_RATE = 0.05
DEFAULT_COVERAGE = {"skill": 1, "actor": 1, "market": 1, "locale": 1, "scenarioType": 1, "naturalConversation": 1, "adversarial": 1, "longHorizon": 1}


def sha256(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""): digest.update(chunk)
    return digest.hexdigest()


def explicit_true(value: object) -> bool: return value is True


def quality_scores(row: dict) -> dict:
    quality = row.get("quality") or {}
    scores = quality.get("scores") or row.get("scores") or row.get("grade") or {}
    if not isinstance(scores, dict): return {}
    normalized = dict(scores)
    aliases = {"actionDiscipline": "action_discipline", "truthfulness": "kurukooTruthfulness", "safety": "safetyCompliance", "contextRetention": "context_retention", "goalRetention": "goal_retention", "failureRecovery": "failure_recovery", "prematureActionRate": "premature_action_rate", "hallucinationRate": "hallucination_rate"}
    for target, alias in aliases.items(): normalized.setdefault(target, normalized.get(alias))
    return normalized


def approval(row: dict) -> tuple[bool, str]:
    provenance, quality = row.get("provenance") or {}, row.get("quality") or {}
    reviewed = explicit_true(row.get("reviewed")) or explicit_true(provenance.get("reviewed")) or explicit_true(quality.get("reviewed"))
    accepted = explicit_true(row.get("accepted")) or explicit_true(quality.get("accepted"))
    if not reviewed: return False, "reviewed_not_true"
    if not accepted: return False, "accepted_not_true"
    if provenance.get("productionUserData") is True or (row.get("privacy") or {}).get("containsPersonalData") is True: return False, "production_or_personal_data"
    scores = quality_scores(row)
    if not scores: return False, "quality_scores_missing"
    for field, minimum in QUALITY_THRESHOLDS.items():
        value = scores.get(field)
        if not isinstance(value, (int, float)) or float(value) < minimum: return False, f"quality_below_threshold:{field}"
    for field, maximum in (("prematureActionRate", MAX_PREMATURE_ACTION_RATE), ("hallucinationRate", MAX_HALLUCINATION_RATE)):
        value = scores.get(field)
        if not isinstance(value, (int, float)) or float(value) > maximum: return False, f"quality_above_threshold:{field}"
    rewrite = row.get("rewrite") or (quality.get("rewrite") if isinstance(quality, dict) else None)
    if rewrite and not (isinstance(rewrite, dict) and rewrite.get("reviewed") is True and rewrite.get("accepted") is True): return False, "rewrite_not_reviewed_and_accepted"
    messages = row.get("messages") or row.get("trajectory") or []
    if not messages or not all(str(item.get("content", "")).strip() for item in messages if isinstance(item, dict)): return False, "missing_message_content"
    return True, "accepted"


def iter_rows(paths: list[pathlib.Path]):
    for path in paths:
        if not path.exists(): continue
        with path.open(encoding="utf-8") as handle:
            for line_number, line in enumerate(handle, 1):
                if not line.strip(): continue
                try: yield path, json.loads(line)
                except json.JSONDecodeError as exc: raise SystemExit(f"Invalid JSON in {path}:{line_number}: {exc}") from exc


def field(row: dict, key: str) -> str:
    metadata = row.get("metadata") or row.get("context") or {}
    value = row.get(key, metadata.get(key))
    return str(value).strip().lower() if value is not None and str(value).strip() else "unknown"


def coverage(accepted: list[dict]) -> dict:
    dimensions = {key: Counter() for key in ("skill", "actor", "market", "locale", "scenarioType")}
    flags = {"naturalConversation": 0, "adversarial": 0, "longHorizon": 0}
    for row in accepted:
        for key in dimensions: dimensions[key][field(row, key)] += 1
        scenario = " ".join([field(row, "scenarioType"), field(row, "family"), field(row, "scenarioVariant"), json.dumps(row.get("tags") or [])]).lower()
        messages = row.get("messages") or row.get("trajectory") or []
        if any(token in scenario for token in ("natural", "casual", "conversation", "social")): flags["naturalConversation"] += 1
        if any(token in scenario for token in ("adversarial", "ambiguity", "interruption", "correction", "failure", "refusal", "safety")): flags["adversarial"] += 1
        if len(messages) >= 8 or any(token in scenario for token in ("long", "horizon", "resume", "multi_goal")): flags["longHorizon"] += 1
    return {**{key: dict(sorted(value.items())) for key, value in dimensions.items()}, **flags}


def required_coverage(args: argparse.Namespace) -> dict:
    requested = json.loads(args.coverage) if args.coverage else None
    if requested is None:
        raw = os.environ.get("KURUKOO_MIN_COVERAGE_JSON", "")
        requested = json.loads(raw) if raw else DEFAULT_COVERAGE
    if not isinstance(requested, dict): raise SystemExit("Coverage requirements must be a JSON object")
    return {str(key): max(int(value), 0) for key, value in requested.items()}


def coverage_failures(summary: dict, requirements: dict) -> dict:
    failures = {}
    for dimension, minimum in requirements.items():
        actual = summary.get(dimension, 0) if dimension in ("naturalConversation", "adversarial", "longHorizon") else len([key for key in summary.get(dimension, {}) if key != "unknown"])
        if int(actual) < int(minimum): failures[dimension] = {"required": int(minimum), "actual": int(actual)}
    return failures


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", action="append", dest="inputs")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT))
    parser.add_argument("--manifest", default=str(DEFAULT_MANIFEST))
    parser.add_argument("--coverage", help="JSON object of minimum coverage requirements")
    args = parser.parse_args()
    inputs = [pathlib.Path(value) for value in args.inputs] if args.inputs else DEFAULT_INPUTS
    output, manifest_path = pathlib.Path(args.output), pathlib.Path(args.manifest)
    accepted, reasons, seen, source_counts = [], Counter(), set(), Counter()
    for source, row in iter_rows(inputs):
        example_id = str(row.get("exampleId") or row.get("id") or "")
        if example_id and example_id in seen: reasons["duplicate_example_id"] += 1; continue
        if example_id: seen.add(example_id)
        ok, reason = approval(row); reasons[reason] += 1; source_counts[str(source)] += 1
        if ok: accepted.append(row)
    composition = coverage(accepted)
    requirements = required_coverage(args)
    failures = coverage_failures(composition, requirements)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8") as handle:
        for row in accepted: handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")
    permitted = bool(accepted) and not failures
    manifest = {"schemaVersion": 2, "datasetVersion": "kurukoo-accepted-v1", "generatedAt": datetime.now(timezone.utc).isoformat(), "inputs": [str(path) for path in inputs], "output": str(output), "outputSha256": sha256(output), "totalRowsSeen": sum(source_counts.values()), "acceptedRows": len(accepted), "rejectedRows": sum(reasons.values()) - len(accepted), "rejectionReasons": dict(sorted(reasons.items())), "sourceCounts": dict(sorted(source_counts.items())), "composition": composition, "minimumCoverage": requirements, "coverageFailures": failures, "syntheticOnly": True, "teacherOutputTrustedAutomatically": False, "requiresExplicitReviewAndAcceptance": True, "qualityThresholds": QUALITY_THRESHOLDS, "maxPrematureActionRate": MAX_PREMATURE_ACTION_RATE, "maxHallucinationRate": MAX_HALLUCINATION_RATE, "teacherRewriteRequiresSeparateReview": True, "trainingIsNotRuntimeAuthority": True, "status": "ready_for_training" if permitted else ("blocked_coverage_requirements" if accepted else "blocked_no_explicitly_accepted_examples")}
    manifest_path.parent.mkdir(parents=True, exist_ok=True); manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8"); print(json.dumps(manifest, indent=2)); return 0


if __name__ == "__main__": raise SystemExit(main())
