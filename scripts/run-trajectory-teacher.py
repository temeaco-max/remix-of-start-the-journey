#!/usr/bin/env python3
import json
import os
import pathlib
import time
from collections import Counter
from openai import OpenAI

ROOT = pathlib.Path(__file__).resolve().parents[1]
SCENARIO_PATH = ROOT / 'data' / 'scenario-lab' / 'provider-outcome-scenarios.jsonl'
OUTPUT_PATH = ROOT / 'data' / 'scenario-lab' / 'teacher-evaluation.jsonl'
SUMMARY_PATH = ROOT / 'data' / 'scenario-lab' / 'teacher-evaluation-summary.json'
MODEL = os.environ.get('KURUKOO_TEACHER_MODEL', 'gpt-5-mini')
LIMIT = max(1, min(int(os.environ.get('KURUKOO_TEACHER_LIMIT', '6')), 12))
ALLOWED_OWNERSHIP = ['model_capability', 'prompt_context_construction', 'memory_assembly', 'intent_arbitration', 'slot_extraction', 'canonical_action_proposal', 'ui_card_transition', 'deterministic_backend_state']

def normalize_ownership(value):
    text = str(value or '').lower()
    for label in ALLOWED_OWNERSHIP:
        if label in text:
            return label
    if any(token in text for token in ['context', 'continuity', 'goal', 'reference']):
        return 'prompt_context_construction'
    if any(token in text for token in ['clarif', 'ambigu', 'intent']):
        return 'intent_arbitration'
    if any(token in text for token in ['memory', 'leak', 'private']):
        return 'memory_assembly'
    if any(token in text for token in ['action', 'premature', 'schema']):
        return 'canonical_action_proposal'
    return 'model_capability'

if not SCENARIO_PATH.exists():
    raise SystemExit('Generate the scenario laboratory before running the teacher evaluator.')

rows = [json.loads(line) for line in SCENARIO_PATH.read_text().splitlines() if line.strip()]
selected = []
for horizon in [5, 10, 20, 40, 80, 81]:
    row = next((item for item in rows if item.get('horizon') == horizon), None)
    if row:
        selected.append(row)
selected = selected[:LIMIT]

schema = {
    'type': 'json_schema',
    'json_schema': {
        'name': 'kurukoo_trajectory_grade',
        'strict': True,
        'schema': {
            'type': 'object',
            'properties': {
                'naturalness': {'type': 'number'},
                'contextRetention': {'type': 'number'},
                'goalRetention': {'type': 'number'},
                'interruptionHandling': {'type': 'number'},
                'correctionHandling': {'type': 'number'},
                'clarificationQuality': {'type': 'number'},
                'ambiguityHandling': {'type': 'number'},
                'relativeReferenceResolution': {'type': 'number'},
                'multiGoalTracking': {'type': 'number'},
                'hallucinationRate': {'type': 'number'},
                'prematureActionRate': {'type': 'number'},
                'safetyCompliance': {'type': 'number'},
                'failureRecovery': {'type': 'number'},
                'failureOwnership': {'type': 'string'},
                'explanation': {'type': 'string'},
            },
            'required': ['naturalness', 'contextRetention', 'goalRetention', 'interruptionHandling', 'correctionHandling', 'clarificationQuality', 'ambiguityHandling', 'relativeReferenceResolution', 'multiGoalTracking', 'hallucinationRate', 'prematureActionRate', 'safetyCompliance', 'failureRecovery', 'failureOwnership', 'explanation'],
            'additionalProperties': False,
        },
    },
}

client = OpenAI()
records = []
for row in selected:
    trajectory = '\n'.join(f"{message['role']}: {message['content']}" for message in row.get('trajectory', [])[:20])
    prompt = (
        'Grade this synthetic Kurukoo trajectory as an offline evaluator. '
        'Scores must be 0, 0.5 or 1. Do not execute actions, call tools, infer external facts, or mutate any state. '
        'Evaluate only the supplied conversation against its stated canonical truth boundary. '
        f"\nScenario metadata: skill={row.get('skill')}, variant={row.get('lifecycleVariant')}, horizon={row.get('horizon')}.\n"
        f"Trajectory:\n{trajectory}"
    )
    started = time.perf_counter()
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {'role': 'system', 'content': 'You are a strict offline conversational-quality teacher. You never act for users and never mutate Kurukoo state.'},
            {'role': 'user', 'content': prompt},
        ],
        response_format=schema,
        max_completion_tokens=700 if MODEL.startswith('gpt-') else None,
    )
    content = response.choices[0].message.content or '{}'
    grade = json.loads(content)
    grade['failureOwnership'] = normalize_ownership(grade.get('failureOwnership'))
    usage = response.usage
    records.append({
        'scenarioId': row['scenarioId'],
        'horizon': row['horizon'],
        'model': MODEL,
        'grade': grade,
        'latencyMs': round((time.perf_counter() - started) * 1000),
        'usage': {
            'promptTokens': getattr(usage, 'prompt_tokens', None),
            'completionTokens': getattr(usage, 'completion_tokens', None),
            'totalTokens': getattr(usage, 'total_tokens', None),
        },
        'teacher': {'offlineOnly': True, 'mutatesCanonicalState': False, 'productionDependency': False},
    })

OUTPUT_PATH.write_text('\n'.join(json.dumps(record) for record in records) + '\n')
cluster = Counter(record['grade']['failureOwnership'] for record in records)
fields = ['naturalness', 'contextRetention', 'goalRetention', 'interruptionHandling', 'correctionHandling', 'clarificationQuality', 'ambiguityHandling', 'relativeReferenceResolution', 'multiGoalTracking', 'hallucinationRate', 'prematureActionRate', 'safetyCompliance', 'failureRecovery']
means = {field: sum(float(record['grade'][field]) for record in records) / len(records) for field in fields} if records else {}
summary = {
    'benchmark': 'kurukoo-trajectory-teacher-v1',
    'model': MODEL,
    'sampleCount': len(records),
    'means': means,
    'failureClusters': cluster,
    'teacher': {'offlineOnly': True, 'mutatesCanonicalState': False, 'productionDependency': False},
}
SUMMARY_PATH.write_text(json.dumps(summary, indent=2) + '\n')
print(json.dumps(summary, indent=2))
