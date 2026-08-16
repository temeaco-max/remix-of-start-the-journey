#!/usr/bin/env python3
"""Generate candidate Kurukoo conversational trajectories for offline curation.

The teacher only generates candidate text. It never executes tools, changes
canonical state, invents external facts, or promotes training data.

Provider selection:
  KURUKOO_TEACHER_PROVIDER=mistral | gemini | openai
  KURUKOO_TEACHER_MODEL=<provider model>

Examples are intentionally small and reproducible per seed. Scale can be
increased after quality controls are established.
"""
import hashlib
import json
import os
import pathlib
import random
from urllib.request import Request, urlopen

ROOT = pathlib.Path(__file__).resolve().parents[2]
SCENARIO_PATH = ROOT / "data" / "scenario-lab" / "provider-outcome-scenarios.jsonl"
OUTPUT_PATH = ROOT / "ml" / "datasets" / "kurukoo-teacher-candidates.jsonl"
PROVIDER = os.environ.get("KURUKOO_TEACHER_PROVIDER", "mistral").lower()
MODEL = os.environ.get("KURUKOO_TEACHER_MODEL", "mistral-small-latest")
LIMIT = max(1, min(int(os.environ.get("KURUKOO_TEACHER_LIMIT", "25")), 500))
SEED = int(os.environ.get("KURUKOO_TEACHER_SEED", "42"))
TIMEOUT = max(10, min(int(os.environ.get("KURUKOO_TEACHER_TIMEOUT", "120")), 600))

SYSTEM = """You are an offline teacher creating candidate conversational training data for Kurukoo.
Kurukoo is a conversation-first coordination system. Natural language is the primary user interface.
Rules:
- Talk naturally and helpfully; do not sound like a menu or a classifier.
- Preserve current goals and contexts across interruptions.
- Ask only for information that is actually missing.
- Distinguish discussing an idea from authorizing an action.
- Never invent provider availability, prices, payment, evidence, inventory, delivery, completion, identities, or external results.
- If a capability is unavailable, explain that truthfully and continue helping.
- A model may propose an action, but canonical Kurukoo services own execution and state.
- Never output internal IDs, router names, model names, governance labels, or implementation details to the user unless specifically asked.
- Candidate examples are training material only and must never mutate production state.
Return JSON only."""

SCHEMA = {
    "type": "object",
    "properties": {
        "assistantTurns": {"type": "array", "items": {"type": "string"}},
        "nextPosture": {"type": "string", "enum": ["conversation", "clarify", "propose", "control", "present"]},
        "actionProposal": {"type": ["object", "null"]},
        "qualityNotes": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["assistantTurns", "nextPosture", "actionProposal", "qualityNotes"],
}


def post_json(url, payload, headers):
    request = Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={**headers, "Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(request, timeout=TIMEOUT) as response:
        return json.loads(response.read().decode("utf-8"))


def call_teacher(prompt):
    if PROVIDER == "mistral":
        key = os.environ.get("MISTRAL_API_KEY")
        if not key:
            raise RuntimeError("MISTRAL_API_KEY is required")
        payload = {
            "model": MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
            "max_tokens": 700,
            "response_format": {"type": "json_object"},
        }
        data = post_json("https://api.mistral.ai/v1/chat/completions", payload, {"Authorization": f"Bearer {key}"})
        return json.loads(data["choices"][0]["message"].get("content") or "{}")

    if PROVIDER == "openai":
        key = os.environ.get("OPENAI_API_KEY")
        if not key:
            raise RuntimeError("OPENAI_API_KEY is required")
        payload = {
            "model": MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }
        data = post_json("https://api.openai.com/v1/chat/completions", payload, {"Authorization": f"Bearer {key}"})
        return json.loads(data["choices"][0]["message"].get("content") or "{}")

    if PROVIDER == "gemini":
        key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if not key:
            raise RuntimeError("GEMINI_API_KEY or GOOGLE_API_KEY is required")
        payload = {
            "systemInstruction": {"parts": [{"text": SYSTEM}]},
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json",
                "responseSchema": SCHEMA,
            },
        }
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={key}"
        data = post_json(url, payload, {"Accept": "application/json"})
        parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        text = "".join(str(part.get("text", "")) for part in parts if isinstance(part, dict))
        return json.loads(text or "{}")

    raise RuntimeError(f"Unsupported teacher provider: {PROVIDER}")


def load_rows():
    if not SCENARIO_PATH.exists():
        raise SystemExit("Run npm run scenario-lab:generate before generating teacher candidates.")
    rows = [json.loads(line) for line in SCENARIO_PATH.read_text(encoding="utf-8").splitlines() if line.strip()]
    random.Random(SEED).shuffle(rows)
    return rows[:LIMIT]


def candidate_id(row, index):
    raw = f"{row.get('scenarioId', index)}:{PROVIDER}:{MODEL}:{SEED}"
    return hashlib.sha256(raw.encode()).hexdigest()[:24]


def normalize_turn(turn):
    if not isinstance(turn, dict):
        return {"role": "user", "content": str(turn)}
    role = str(turn.get("role") or "user").lower()
    if role not in ("user", "assistant", "system"):
        role = "user"
    return {"role": role, "content": str(turn.get("content") or "").strip()}


def main():
    rows = load_rows()
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    records = []
    errors = []

    for index, row in enumerate(rows):
        trajectory = row.get("trajectory") or []
        normalized_trajectory = [normalize_turn(turn) for turn in trajectory if normalize_turn(turn)["content"]]
        compact = "\n".join(f"{turn['role']}: {turn['content']}" for turn in normalized_trajectory[-12:])
        prompt = (
            "Generate the next 1-4 assistant turns for this synthetic Kurukoo trajectory. "
            "The turns should feel like one continuous human conversation. If the user interrupts, preserve the paused goal. "
            "If the user merely discusses an option, do not act. If action is justified, emit a bounded actionProposal using only the stated facts. "
            "Do not invent availability, prices or completion. "
            f"\nScenario: skill={row.get('skill')} family={row.get('family')} variant={row.get('lifecycleVariant')} market={row.get('market')} actor={row.get('actor')} channel={row.get('channel')}\n"
            f"Recent trajectory:\n{compact}\n"
            "Return candidate assistant turns and a concise quality note."
        )
        try:
            result = call_teacher(prompt)
            turns = result.get("assistantTurns") or []
            turns = [str(turn).strip() for turn in turns if str(turn).strip()][:4]
            if not turns:
                raise ValueError("teacher returned no assistant turns")
            record = {
                "exampleId": candidate_id(row, index),
                "scenarioId": row.get("scenarioId"),
                "messages": normalized_trajectory + [{"role": "assistant", "content": turn} for turn in turns],
                "labels": {
                    "skill": row.get("skill"),
                    "family": row.get("family"),
                    "variant": row.get("lifecycleVariant"),
                    "market": row.get("market"),
                    "actor": row.get("actor"),
                    "channel": row.get("channel"),
                    "nextPosture": result.get("nextPosture", "conversation"),
                    "actionProposal": result.get("actionProposal"),
                },
                "provenance": {
                    "source": "teacher-model-candidate",
                    "teacherProvider": PROVIDER,
                    "teacherModel": MODEL,
                    "candidateOnly": True,
                    "reviewed": False,
                    "productionUserData": False,
                    "mutatesCanonicalState": False,
                },
                "quality": {
                    "status": "candidate_requires_review",
                    "notes": [str(note)[:500] for note in (result.get("qualityNotes") or [])[:8]],
                },
            }
            records.append(record)
        except Exception as exc:
            errors.append({"scenarioId": row.get("scenarioId"), "error": str(exc)[:500]})

    OUTPUT_PATH.write_text("\n".join(json.dumps(record) for record in records) + ("\n" if records else ""), encoding="utf-8")
    summary = {
        "status": "candidate_generation_complete" if records else "candidate_generation_failed",
        "provider": PROVIDER,
        "model": MODEL,
        "seed": SEED,
        "requested": LIMIT,
        "generated": len(records),
        "errors": errors,
        "candidateOnly": True,
        "trainingAuthorized": False,
        "canonicalMutationAllowed": False,
        "output": str(OUTPUT_PATH),
    }
    (OUTPUT_PATH.with_suffix(".summary.json")).write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, indent=2))
    if not records:
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
