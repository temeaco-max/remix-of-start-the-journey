# Kurukoo Skill Outcome Convergence

## Canonical count

The repository's original catalogue contains 205 canonical skills. The current convergence layer adds 34 local/market/device-specialist skill extensions, making the active conversational catalogue 239 skills.

The original 205 remain the canonical base skill IDs. The 34 additions are data-driven extensions that reuse existing canonical execution owners where appropriate rather than creating duplicate service architectures.

## Every skill now has a generated outcome contract

For every skill in the 239-skill conversational catalogue, Kurukoo derives a behaviour contract containing:

- mission/outcome;
- required context;
- optional context;
- preferred question order;
- validation rules;
- provider/source matching rules;
- capability composition;
- completion evidence;
- failure/recovery states;
- behaviour instructions;
- Memory Profile usage policy.

Explicit special-case packs remain authoritative where the behaviour is materially distinct. All other skills receive a deterministic family-aware contract from the existing skill flow, category and capability registries.

## Memory Profile invariant

Skill conversation must use Memory Profile only as relevant context. User-declared/current-turn facts outrank stale profile facts. Verified memory outranks inferred/observed memory. Ambiguous or high-impact facts require clarification. The assistant must never expose memory provenance or internal profile data.

## Device and repair taxonomy

Repair skills use a reusable device taxonomy covering phones, tablets, laptops, consoles, TVs, smartwatches, earbuds, speakers, appliances, bicycles, motorbikes and vehicles. Brand/model families are represented as data so a repair behaviour can request the exact model/variant without creating a separate chatbot for every device.

## Local-market extensions

The current 34 additions include UK civic/appointment/vehicle/property services, Canadian weather/vehicle/utilities and local commerce services, and Nigerian POS/fuel/water/gas/market logistics services. They reuse the existing capabilities and lifecycle owners.

## FastText

FastText remains a cheap routing signal, not the conversational authority. Its training additions now include the new local/device behaviours and Memory/support acts. Rebuilding the FastText model consumes the merged training corpus. The canonical conversational generator also independently resolves converged skill behaviour, so a stale/absent FastText binary cannot prevent skill-specific behaviour from being applied.

## Truth boundary

A complete skill contract does not imply live external availability. A skill is repository-complete when its behaviour, requirements, capability composition, evidence and recovery rules exist. Live council schedules, real provider availability, parts inventory, payment settlement, dispatch or other external execution remain deployment/integration evidence gates.
