#!/usr/bin/env python3
"""Compose reviewed teacher trajectories into a reproducible Kurukoo training corpus.

Teacher output is never trusted automatically. By default only records explicitly
marked reviewed=true and accepted=true are admitted. The deterministic canonical
corpus is preserved as a separate source and may be merged with accepted teacher
examples using --include-canonical.
"""
import argparse
import hashlib
import json
import pathlib
from typing import Any

ROOT = pathlib.Path(__file__).resolve().parents[2]
DEFAULT_TEACHER = ROOT / "ml" / "datasets" / "kurukoo-teacher-candidates.jsonl"
DEFAULT_CANONICAL = ROOT / "ml" / "datasets" / "kurukoo-core-v1.train.jsonl"
DEFAULT_OUTPUT = ROOT / "ml" / "datasets" / "kurukoo-core-v2.accepted.jsonl"


def rows(path: pathlib.Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    result = []
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.strip():
            result.append(json.loads(line))
    return result


def accepted_teacher(row: dict[str, Any]) -> bool:
    quality = row.get("quality") or {}
    provenance = row.get("provenance") or {}
    return (
        quality.get("reviewed") is True
        and quality.get("accepted") is True
        and provenance.get("candidateOnly") is True
        and provenance.get("productionUserData") is False
        and provenance.get("mutatesCanonicalState") is False
    )


def normalize(row: dict[str, Any], source: str) -> dict[str, Any]:
    messages = []
    for message in row.get("messages") or []:
        role = str(message.get("role", "user"))
        content = str(message.get("content", "")).strip()
        if content:
            messages.append({"role": role, "content": content})
    if not messages:
        raise ValueError(f"empty messages in {row.get('exampleId', 'unknown')}")
    base = dict(row)
    base["messages"] = messages
    base["training"] = {
        "source": source,
        "acceptedForTraining": True,
        "teacherTrustedAutomatically": False,
        "canonicalStateAuthority": "canonical_domain_services",
    }
    return base


def digest(rows_out: list[dict[str, Any]]) -> str:
    payload = "\n".join(json.dumps(row, sort_keys=True, ensure_ascii=False) for row in rows_out) + "\n"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--teacher", type=pathlib.Path, default=DEFAULT_TEACHER)
    parser.add_argument("--canonical", type=pathlib.Path, default=DEFAULT_CANONICAL)
    parser.add_argument("--output", type=pathlib.Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--include-canonical", action="store_true")
    args = parser.parse_args()

    teacher = rows(args.teacher)
    accepted = [normalize(row, "teacher-reviewed") for row in teacher if accepted_teacher(row)]
    canonical = [normalize(row, "canonical-deterministic") for row in rows(args.canonical)] if args.include_canonical else []

    combined = canonical + accepted
    seen = set()
    unique = []
    for row in combined:
        key = str(row.get("exampleId"))
        if key in seen:
            continue
        seen.add(key)
        unique.append(row)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text("\n".join(json.dumps(row, ensure_ascii=False) for row in unique) + ("\n" if unique else ""), encoding="utf-8")
    summary = {
        "output": str(args.output),
        "canonicalIncluded": args.include_canonical,
        "canonicalCount": len(canonical),
        "teacherCandidates": len(teacher),
        "acceptedTeacherCount": len(accepted),
        "acceptedTrainingCount": len(unique),
        "sha256": digest(unique),
        "status": "ready_for_training" if unique else "no_accepted_training_examples",
    }
    args.output.with_suffix(".summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
