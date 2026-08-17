"""Curate synthetic/teacher candidate data for guarded Kurukoo training.

No candidate is admitted unless both reviewed=true and accepted=true are
explicitly present in the record. This script never assigns either approval.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import pathlib
from collections import Counter
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEFAULT_INPUTS = [
    ROOT / "ml" / "datasets" / "kurukoo-core-v1.train.jsonl",
    ROOT / "ml" / "datasets" / "kurukoo-provider-outcome-lab-v1.all.jsonl",
]
DEFAULT_OUTPUT = ROOT / "ml" / "datasets" / "kurukoo-accepted-v1.jsonl"
DEFAULT_MANIFEST = ROOT / "ml" / "datasets" / "kurukoo-accepted-v1.manifest.json"
QUALITY_THRESHOLDS = {
    "naturalness": 0.75,
    "contextRetention": 0.90,
    "goalRetention": 0.90,
    "actionDiscipline": 0.90,
    "truthfulness": 0.95,
    "safety": 0.95,
    "failureRecovery": 0.80,
}
MAX_PREMATURE_ACTION_RATE = 0.05
MAX_HALLUCINATION_RATE = 0.05


def sha256(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def explicit_true(value: object) -> bool:
    return value is True


def quality_scores(row: dict) -> dict:
    quality = row.get("quality") or {}
    scores = quality.get("scores") or row.get("scores") or row.get("grade") or {}
    if not isinstance(scores, dict):
        return {}
    normalized = dict(scores)
    normalized.setdefault("actionDiscipline", normalized.get("action_discipline"))
    normalized.setdefault("truthfulness", normalized.get("kurukooTruthfulness"))
    normalized.setdefault("safety", normalized.get("safetyCompliance"))
    normalized.setdefault("contextRetention", normalized.get("context_retention"))
    normalized.setdefault("goalRetention", normalized.get("goal_retention"))
    normalized.setdefault("failureRecovery", normalized.get("failure_recovery"))
    normalized.setdefault("prematureActionRate", normalized.get("premature_action_rate"))
    normalized.setdefault("hallucinationRate", normalized.get("hallucination_rate"))
    return normalized


def approval(row: dict) -> tuple[bool, str]:
    provenance = row.get("provenance") or {}
    quality = row.get("quality") or {}
    reviewed = explicit_true(row.get("reviewed")) or explicit_true(provenance.get("reviewed")) or explicit_true(quality.get("reviewed"))
    accepted = explicit_true(row.get("accepted")) or explicit_true(quality.get("accepted"))
    if not reviewed:
        return False, "reviewed_not_true"
    if not accepted:
        return False, "accepted_not_true"
    if (provenance.get("productionUserData") is True) or (row.get("privacy") or {}).get("containsPersonalData") is True:
        return False, "production_or_personal_data"
    scores = quality_scores(row)
    if not scores:
        return False, "quality_scores_missing"
    for field, minimum in QUALITY_THRESHOLDS.items():
        value = scores.get(field)
        if not isinstance(value, (int, float)) or float(value) < minimum:
            return False, f"quality_below_threshold:{field}"
    for field, maximum in (("prematureActionRate", MAX_PREMATURE_ACTION_RATE), ("hallucinationRate", MAX_HALLUCINATION_RATE)):
        value = scores.get(field)
        if not isinstance(value, (int, float)) or float(value) > maximum:
            return False, f"quality_above_threshold:{field}"
    rewrite = row.get("rewrite") or (quality.get("rewrite") if isinstance(quality, dict) else None)
    if rewrite and not (isinstance(rewrite, dict) and rewrite.get("reviewed") is True and rewrite.get("accepted") is True):
        return False, "rewrite_not_reviewed_and_accepted"
    messages = row.get("messages") or []
    if not messages or not all(str(item.get("content", "")).strip() for item in messages if isinstance(item, dict)):
        return False, "missing_message_content"
    return True, "accepted"


def iter_rows(paths: list[pathlib.Path]):
    for path in paths:
        if not path.exists():
            continue
        with path.open(encoding="utf-8") as handle:
            for line_number, line in enumerate(handle, 1):
                if not line.strip():
                    continue
                try:
                    row = json.loads(line)
                except json.JSONDecodeError as exc:
                    raise SystemExit(f"Invalid JSON in {path}:{line_number}: {exc}") from exc
                yield path, row


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", action="append", dest="inputs", help="Input JSONL; may be repeated")
    parser.add_argument("--output", default=str(DEFAULT_OUTPUT))
    parser.add_argument("--manifest", default=str(DEFAULT_MANIFEST))
    args = parser.parse_args()

    inputs = [pathlib.Path(value) for value in args.inputs] if args.inputs else DEFAULT_INPUTS
    output = pathlib.Path(args.output)
    manifest_path = pathlib.Path(args.manifest)
    accepted: list[dict] = []
    reasons: Counter[str] = Counter()
    seen: set[str] = set()
    source_counts: Counter[str] = Counter()

    for source, row in iter_rows(inputs):
        example_id = str(row.get("exampleId") or row.get("id") or "")
        if example_id and example_id in seen:
            reasons["duplicate_example_id"] += 1
            continue
        if example_id:
            seen.add(example_id)
        ok, reason = approval(row)
        reasons[reason] += 1
        source_counts[str(source)] += 1
        if ok:
            accepted.append(row)

    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8") as handle:
        for row in accepted:
            handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")

    manifest = {
        "schemaVersion": 1,
        "datasetVersion": "kurukoo-accepted-v1",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "inputs": [str(path) for path in inputs],
        "output": str(output),
        "outputSha256": sha256(output),
        "totalRowsSeen": sum(source_counts.values()),
        "acceptedRows": len(accepted),
        "rejectedRows": sum(reasons.values()) - len(accepted),
        "rejectionReasons": dict(sorted(reasons.items())),
        "sourceCounts": dict(sorted(source_counts.items())),
        "syntheticOnly": True,
        "teacherOutputTrustedAutomatically": False,
        "requiresExplicitReviewAndAcceptance": True,
        "qualityThresholds": QUALITY_THRESHOLDS,
        "maxPrematureActionRate": MAX_PREMATURE_ACTION_RATE,
        "maxHallucinationRate": MAX_HALLUCINATION_RATE,
        "teacherRewriteRequiresSeparateReview": True,
        "trainingIsNotRuntimeAuthority": True,
        "status": "ready_for_training" if accepted else "blocked_no_explicitly_accepted_examples",
    }
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

