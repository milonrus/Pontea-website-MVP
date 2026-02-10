# Roadmap Generator Module

This module implements a deterministic sprint-based roadmap generator for exam preparation.

## Entrypoint

- `generateRoadmaps(input)` from `engine.ts`
- `hours_per_week` is optional/deprecated input. The engine now derives `optimal_hours_per_week` from material volume and cap profile.
- Input hours are ignored by default; set `USE_INPUT_HOURS_IF_PROVIDED=true` to apply manual override for debugging.
- Default strategy mode is `ROADMAP_STRATEGY_MODE="high_level_v4"` (legacy fallback: `legacy_v3`).

## Determinism Guarantees

- Explicit normalization and stable sorting for section/submodule matching
- Strict section submodule sequencing in original JSON order (`SECTION_ORDER_MODE="json_strict"`)
- Pointer-based section scheduling: no later submodule can be planned while an earlier submodule in the same section still has remaining core work
- Strict JSON-order pointer scheduling inside each section
- Weak-subject-first part scoring in v4 (`0.65*gap + 0.35*backlog`)
- History of Art core unlock after History core completion (`HISTORY_ART_UNLOCK_HISTORY_PROGRESS_PCT=1.0`), with optional intro scaffolding
- Retakes are gated late: final phase + global core progress threshold (`RETAKES_GLOBAL_CORE_PROGRESS_PCT`)
- In non-fill v4 mode, per-part caps are soft for core scheduling and hard for maintenance/retakes
- Stable `part_level` derivation from resolved input levels (independent of mode and checkpoint adaptation)
- Fill-to-plan is conditional: if coverage is complete early, policy remains feasible and unused time is explicitly annotated
- Deterministic tie-breakers using fixed exam-part order
- Integer minute allocation via floor + largest remainder
- Bounded share normalization with deterministic iteration order
- Deterministic hours derivation:
  - v4 non-fill: `required_core * (1 + HIGH_LEVEL_REVIEW_BUFFER_PCT)`
  - fill mode: cap-aware requirement remains
- Completion loop increases hours only while core backlog remains
- Downshift pass reduces hours by `HOURS_ROUNDING_STEP` while preserving zero core backlog
- Manual override guardrail: when `USE_INPUT_HOURS_IF_PROVIDED=true`, the completion loop does not auto-increase user-provided hours
- Per-sprint module contract includes:
  - module chunk labels (`part k/n`) with max chunk cap and minimum chunk duration
  - time, planned untimed items, exact questions, and high-level question ranges
  - optional `practice_blocks` for high-level exercise flow
- Retake invariant: retakes are allowed only after unique questions for that submodule are exhausted

## Files

- `types.ts`: canonical I/O contracts and output schema
- `defaults.ts`: all default parameters and fixed mappings
- `helpers.ts`: normalization, clamping, rounding, allocation helpers
- `validators.ts`: fail-fast input/config validation
- `engine.ts`: orchestration, feasibility modes, sprint planning
