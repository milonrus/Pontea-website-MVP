# Roadmap Generator Algorithm Spec (Sprint-based, deterministic)

This document is the canonical product specification for the roadmap generator implemented in the admin playground.

## 1) Purpose & Non-goals

### Purpose

Generate a deterministic **2-week sprint exam-prep roadmap** from:
- levels (1-5) per section,
- weeks to exam,
- course JSON (`course_modular_overview.sections[].submodules[].stats`).

The generator now **derives optimal hours per week** from required material and cap constraints.
`hours_per_week` can still be passed as an optional debug override, but the default workflow is hours-as-output.

For each sprint, output:
- sprint goal,
- ranked focus exam parts,
- exact course items (`section.title -> submodule.name`),
- estimated hours per item and totals,
- planned practice volumes sourced from JSON,
- checkpoint definition and deterministic adaptation rules.

### Non-goals

- No daily schedule/micro-task decomposition.
- No invented topics beyond provided JSON.
- No probabilistic/creative planning behavior.
- No external curriculum/resources.
- No exam score prediction.

## 2) Inputs

### Required

1. `weeks_to_exam: int`, `>= 1`
2. `levels_by_section: dict[str -> int]`
   - key: section title (case-insensitive after normalization)
   - value: level in `[1..5]`
3. `course_modular_overview`
   - `sections[]`
   - `section.title`
   - `submodules[]`
   - `submodule.stats.lessons_video_minutes`
   - `submodule.stats.timed_text_minutes`
   - `submodule.stats.untimed_text_items`
   - `submodule.stats.questions_total`

### Optional

4. `hours_per_week: float` (debug/manual override only; used only when `USE_INPUT_HOURS_IF_PROVIDED=true`)
5. `checkpoint_history: list[CheckpointResult]`
6. `config_overrides: dict`

### Derived hours output

- `required_core_minutes_total = sum(learning + unique practice across selected backlog)`
- `required_minutes_due_to_cap_profile = max_p(required_part_minutes[p] / MAX_PART_SHARE)`
- v4 non-fill strategy:
  - `required_planning_minutes = required_core_minutes_total * (1 + HIGH_LEVEL_REVIEW_BUFFER_PCT)`
- fill-to-plan strategy:
  - `required_planning_minutes = max(required_core_minutes_total, required_minutes_due_to_cap_profile)`
- `optimal_hours_per_week_raw = required_planning_minutes / (weeks_to_exam * 60 * (1 - SPRINT_BUFFER_PCT))`
- `optimal_hours_per_week = ceil_to_step(optimal_hours_per_week_raw, HOURS_ROUNDING_STEP)`
- Deterministic completion loop: rerun with `+HOURS_ROUNDING_STEP` while **core backlog** remains.
- Downshift pass (v4): reduce by `HOURS_ROUNDING_STEP` while keeping zero core backlog.

## 3) Configurable Parameters

### 3.1 Time/workload knobs

- `UNTIMED_TEXT_MIN_PER_ITEM = 8`
- `BASE_MIN_PER_QUESTION = 2.5`
- `PRACTICE_REVIEW_OVERHEAD_PCT = 0.20`
- `SPRINT_BUFFER_PCT = 0.05`

### 3.2 Subject multipliers

Default by normalized section title:
- text comprehension: `1.10`
- logical reasoning: `1.00`
- drawing & representation: `1.30`
- math: `1.40`
- physics: `1.50`
- general culture/history/history of art & architecture: `1.00`

### 3.3 Level tables

`LEVEL_TIME_MULTIPLIER`
- 1: 1.80
- 2: 1.55
- 3: 1.30
- 4: 1.10
- 5: 1.00

`LEVEL_LEARNING_SHARE`
- 1: 0.70
- 2: 0.60
- 3: 0.50
- 4: 0.35
- 5: 0.20

`LEVEL_PRACTICE_SHARE`
- 1: 0.30
- 2: 0.40
- 3: 0.50
- 4: 0.65
- 5: 0.80

Constraint: learning + practice = 1 per level.

### 3.4 Allocation knobs

- `BASELINE_PART_SHARE = 0.20`
- `TARGET_LEVEL_FOR_GAP = 4`
- `ALLOC_GAP_WEIGHT = 0.25`
- `ALLOC_BACKLOG_WEIGHT = 0.25`
- `MIN_PART_SHARE = 0.12`
- `MAX_PART_SHARE = 0.30`
- `MAX_SHARE_CHANGE_PER_SPRINT = 0.05`

Constraints:
- `5 * MIN_PART_SHARE <= 1`
- `MAX_PART_SHARE >= BASELINE_PART_SHARE`
- `MIN_PART_SHARE <= BASELINE_PART_SHARE`

### 3.5 Final phase knobs

- `FINAL_PRACTICE_WEEKS = 3`
- `FINAL_PHASE_LEARNING_MULTIPLIER = 0.50`
- `ALLOW_NEW_LEARNING_IN_FINAL_PHASE = true`

### 3.6 Section ordering mode

- `SECTION_ORDER_MODE = "json_strict"` (hard mode in v2)
- Submodules are planned only in original JSON order within each section.
- Keyword categories are disabled for ordering decisions.

### 3.8 Optimal-hours controls

- `ROADMAP_STRATEGY_MODE = "high_level_v4"` (fallback: `"legacy_v3"`)
- `HOURS_ROUNDING_STEP = 0.1`
- `MAX_OPTIMAL_HOURS_PER_WEEK = 80`
- `USE_INPUT_HOURS_IF_PROVIDED = false`
- `HIGH_LEVEL_REVIEW_BUFFER_PCT = 0.12`
- `RETAKES_GLOBAL_CORE_PROGRESS_PCT = 0.9`
- `RETAKES_FINAL_PHASE_ONLY = true`
- `MAX_MODULE_CHUNKS = 2`
- `MIN_CHUNK_MIN = 45`
- `HISTORY_ART_ALLOW_INTRO_SCAFFOLDING = true`

### 3.7 Input fallback defaults

- `DEFAULT_LEVEL_IF_MISSING = 3`
- `IGNORE_UNKNOWN_LEVEL_KEYS = true`
- `MINUTES_ROUNDING = nearest_5`

## 4) Data Model & Mappings

### 4.1 Normalization

`normalize(s) = lower(trim(s))` and collapse internal whitespace.

### 4.2 Fixed exam parts

1. `READING`
2. `LOGIC`
3. `DRAWING`
4. `MATH_PHYSICS`
5. `GENERAL_KNOWLEDGE`

### 4.3 Section -> part mapping

- text comprehension -> READING
- logical reasoning -> LOGIC
- drawing & representation -> DRAWING
- math/physics -> MATH_PHYSICS
- general culture/history/history of art & architecture -> GENERAL_KNOWLEDGE

Unknown section behavior:
- use config override if present,
- else mark unmapped, exclude, emit warning.

### 4.4 Part level from section levels

`PART_LEVEL_COMBINE_METHOD`:
- `workload_weighted` (default)
- `equal_weighted`

If no mapped sections in part:
- mark inactive,
- `part_level = 5`,
- `part_backlog = 0`.

## 5) Workload Estimation

For each submodule `m`:

`learn_min(m) = lessons_video_minutes + timed_text_minutes + untimed_text_items * UNTIMED_TEXT_MIN_PER_ITEM`

`practice_min(m) = questions_total * BASE_MIN_PER_QUESTION * subject_multiplier(section) * level_multiplier(level) * (1 + PRACTICE_REVIEW_OVERHEAD_PCT)`

`total_min(m) = learn_min(m) + practice_min(m)`

Section and part totals are sums over children.

## 6) Prioritization Model

- `gap(level)` from target level (`TARGET_LEVEL_FOR_GAP`) clamped to [0..1]
- `gap_part` uses `part_level`
- `backlog_share(part) = rem_min(part) / total_rem`
- v4 weak-first core priority:
  - `priority_core(part) = 0.65 * gap_norm + 0.35 * backlog_norm`
  - strong parts are suppressed while weak parts still have core backlog.
- legacy mode:
  - `priority(part) = gap_part + backlog_share`

Tie-breaks:
1. higher priority
2. higher remaining minutes
3. fixed part order

## 7) Time Allocation Across Parts

Per sprint:

`share_raw(part) = BASELINE_PART_SHARE + ALLOC_GAP_WEIGHT*(gap_part - mean_gap) + ALLOC_BACKLOG_WEIGHT*(backlog_share - BASELINE_PART_SHARE)`

Then:
- apply checkpoint adaptation delta,
- clamp to `[MIN_PART_SHARE, MAX_PART_SHARE]`,
- bounded renormalize to sum 1 over active parts.
- enforce per-sprint cap on all executed minutes:
  - `part_cap_sprint = floor(MAX_PART_SHARE * planning_minutes)`
  - applies to primary fill, redistribution, and retakes.

v4 override:
- in non-fill mode, per-part caps are soft for **core** scheduling in primary + redistribution;
- caps remain hard for maintenance/retake scheduling.

Checkpoint adaptation uses:
- `TARGET_ACCURACY = 0.70`
- `TARGET_TIME_PER_Q_BY_PART`
- EMA smoothing (`PERFORMANCE_EMA_ALPHA = 0.5`)
- step size `ADAPT_STEP = 0.04`
- per-sprint cap `MAX_SHARE_CHANGE_PER_SPRINT`

## 8) Sprint Construction (2-week)

- `N_full = weeks_to_exam // 2`
- optional last 1-week sprint when odd
- `available_min = sprint_weeks * hours_per_week * 60`
- `planning_min = floor(available_min * (1 - SPRINT_BUFFER_PCT))`
- `buffer_min = available_min - planning_min`

Final phase uses last `ceil(FINAL_PRACTICE_WEEKS / 2)` sprints.

## 9) Module Selection & Ordering

- `SECTION_ORDER_MODE` default is `"json_strict"`.
- Submodules are processed only in original JSON order (`json_index` ascending).
- Hard sequencing invariant:
  - never schedule minutes/questions from submodule `j` if any earlier submodule `i < j` in the same section still has remaining core work.
  - core work remaining means `learn_min_remaining > 0` or `questions_remaining_unique > 0`.
- Section filling is pointer-based:
  - for each section, schedule only the current first unfinished submodule until it is complete, then advance.
- Practice unlock gate by `PRACTICE_UNLOCK_PCT` applies only to the current pointer submodule.
- Retakes are allowed only after unique questions of the same submodule are exhausted.
- Combined parts split budget to sections by deterministic need score:
  - `0.5 * gap_section + 0.5 * rem_share_section`
  - GK override while History core remains:
    - `History x3.0`, `General culture x1.2`, `Art non-intro x0`, `Art intro scaffolding allowed`.

Per section fill order:
1. learning/practice allocation only on current pointer submodule,
2. move pointer only when current submodule core work is complete.

No cross-part reassignment of unused time by default.

## 10) Practice & Checkpoint Rules

Per scheduled item report:
- unique practice questions,
- retake questions,
- practice minutes,
- total estimated minutes.

Checkpoint per part picks source item deterministically:
- prefer a single practiced item meeting minimum sample size,
- else construct a mixed checkpoint from deterministic top candidates,
- else use timed-drill fallback.

`Q_checkpoint = min(CHECKPOINT_SAMPLE_QUESTIONS_PER_PART, Q_scheduled)`

Confidence:
- `low_sample` when below `CHECKPOINT_MIN_QUESTIONS_PER_PART`
- else `ok`.

## 11) Feasibility & Modes

Compute:
- `avail_plan_min` from all sprint planning minutes,
- `required_full_min` from all learn + unique practice,
- cap feasibility by `MAX_PART_SHARE * avail_plan_min` per part.

Policy-feasibility semantics:
- fill target per sprint: `planning_minutes * (1 - MAX_UNUSED_PCT)`
- `policy_feasible=true` when fill target is met OR coverage is complete early.
- if fill target is missed:
  - `cap_limited` when remaining work exists but all parts are at cap,
  - `no_eligible_work` when nothing schedulable remains under policy.
- metadata includes `cap_scope = "all_minutes"`.

Generation mode in v3:
- single roadmap mode: `full` (hours are increased deterministically until full coverage is achieved).

## 12) Validation & Edge Cases

Fail-fast errors:
- invalid weeks/manual-hours,
- invalid levels,
- invalid share constraints,
- negative JSON workload fields.

Warnings:
- missing levels (default applied),
- unmapped sections excluded,
- empty mapped sections.

Determinism requirements:
- explicit tie-breaks,
- floor + largest remainder for integerized minute allocations,
- deterministic goal templates.

## 13) Canonical Output Schema

Output follows canonical structure with:
- `metadata`
- `exam_parts_summary`
- `sprints[]`
- `end_state`

Mode:
- `full`

Additive metadata/output fields (v4 superset):
- `metadata.optimal_hours_per_week`
- `metadata.optimal_hours_source = "derived_from_material_and_caps"`
- `metadata.required_core_minutes_total`
- `metadata.required_minutes_due_to_cap_profile`
- `metadata.final_hours_rounding_step`
- `sprints[].sprint_summary_ru`
- `sprints[].items[].module_chunk_label` (for split modules)
- `sprints[].items[].planned_untimed_items`
- `sprints[].items[].planned_practice_questions_range`
- `sprints[].items[].exercise_priority`
- `sprints[].practice_blocks[]`

## 14) Deterministic Sprint Goal Templates

If final phase:

`Final-phase consolidation: prioritize {top2_parts}; complete exam-style practice and error review; close remaining gaps.`

Else:

`Progress core learning and first-pass practice: prioritize {top2_parts}; maintain baseline coverage in all parts; start/continue highest-backlog part {top_backlog_part}.`

Substitutions are deterministic.

---

## v2 Additions (Implemented)

- Fill-to-plan invariant: each sprint targets at least `98%` utilization unless no eligible work remains.
- Three-phase sprint fill: primary allocation, per-part fill, deterministic slack redistribution.
- Maintenance practice with retakes enabled by default.
- Chunk guards: minimum item/learning/practice thresholds to avoid micro-fragments and zero-minute items.
- Checkpoint robustness:
  - preferred sample size (`CHECKPOINT_PREFERRED_Q=25`)
  - mixed checkpoint fallback (up to 3 submodules)
  - low-sample checkpoints do not influence adaptation when configured.
- Feasibility semantics split into:
  - `time_infeasible`
  - `cap_infeasible_by_part`
  - `policy_feasible`
  while preserving legacy fields (`cap_infeasible`, `overall_infeasible`) for compatibility.
- Added audit fields:
  - `unused_minutes_total`
  - `unused_minutes_by_sprint`
  - per-sprint executed/reallocation/unused breakdown.

## v3 Additions (Implemented)

- Hours-as-output planning: derive optimal weekly hours from material and cap profile.
- Deterministic completion loop with `HOURS_ROUNDING_STEP` increments.
- Module-first sprint rendering:
  - each module row includes time, planned questions, planned untimed items.
  - split modules are labeled `part k/n` across sprints.
- Deterministic Russian sprint summary block:
  - `Sprint N Что изучаем ...`
  - per-module lines
  - `Практика: ~Q вопросов, ~U untimed items.`

## v4 Additions (Implemented)

- Strategy-first high-level scheduler (`ROADMAP_STRATEGY_MODE="high_level_v4"`).
- Weak-subject-first core sequencing and reduced early strong-part noise.
- Strict History -> Art core unlock at 100% History core completion (optional intro scaffolding allowed).
- Retake-heavy work gated to late phase and global core-progress threshold.
- High-level module rendering defaults to question ranges with compatibility-preserved exact counts.
- Practice blocks per sprint (`exam_10q`, `full_mock_50q`, `weak_area_review`) for deterministic review flow.

---

## Canonical Course JSON Fixture

```json
{
  "course_modular_overview": {
    "sections": [
      {
        "section_id": 3,
        "title": "Text Comprehension",
        "submodules": [
          {
            "name": "Method & guidance",
            "stats": {
              "lessons_video_time_hms": "00:00:00",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 2,
              "questions_total": 0,
              "lessons_video_minutes": 0,
              "timed_text_minutes": 0,
              "total_time_minutes": 0
            }
          },
          {
            "name": "Warm-up practice (Text comprehension 1-5)",
            "stats": {
              "lessons_video_time_hms": "00:00:00",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 0,
              "questions_total": 25,
              "lessons_video_minutes": 0,
              "timed_text_minutes": 0,
              "total_time_minutes": 0
            }
          },
          {
            "name": "Real exam texts",
            "stats": {
              "lessons_video_time_hms": "00:00:00",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 0,
              "questions_total": 63,
              "lessons_video_minutes": 0,
              "timed_text_minutes": 0,
              "total_time_minutes": 0
            }
          }
        ],
        "section_total": {
          "lessons_video_time_hms": "00:00:00",
          "timed_text_time_hms": "00:00:00",
          "untimed_text_items": 2,
          "questions_total": 88,
          "lessons_video_minutes": 0,
          "timed_text_minutes": 0,
          "total_time_minutes": 0
        }
      },
      {
        "section_id": 4,
        "title": "Logical reasoning",
        "submodules": [
          {
            "name": "Verbal logic",
            "stats": {
              "lessons_video_time_hms": "00:00:00",
              "timed_text_time_hms": "00:11:51",
              "untimed_text_items": 0,
              "questions_total": 34,
              "lessons_video_minutes": 0,
              "timed_text_minutes": 11.85,
              "total_time_minutes": 11.85
            }
          },
          {
            "name": "Sequences (numbers & letters)",
            "stats": {
              "lessons_video_time_hms": "00:13:23",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 1,
              "questions_total": 16,
              "lessons_video_minutes": 13.38,
              "timed_text_minutes": 0,
              "total_time_minutes": 13.38
            }
          },
          {
            "name": "Mathematical & geometrical reasoning",
            "stats": {
              "lessons_video_time_hms": "00:14:57",
              "timed_text_time_hms": "00:10:20",
              "untimed_text_items": 1,
              "questions_total": 15,
              "lessons_video_minutes": 14.95,
              "timed_text_minutes": 10.33,
              "total_time_minutes": 25.28
            }
          },
          {
            "name": "Practice & revision",
            "stats": {
              "lessons_video_time_hms": "00:27:54",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 0,
              "questions_total": 17,
              "lessons_video_minutes": 27.9,
              "timed_text_minutes": 0,
              "total_time_minutes": 27.9
            }
          }
        ],
        "section_total": {
          "lessons_video_time_hms": "00:56:14",
          "timed_text_time_hms": "00:22:11",
          "untimed_text_items": 2,
          "questions_total": 82,
          "lessons_video_minutes": 56.23,
          "timed_text_minutes": 22.18,
          "total_time_minutes": 78.42
        }
      },
      {
        "section_id": 5,
        "title": "Drawing & Representation",
        "submodules": [
          {
            "name": "Orthogonal projections",
            "stats": {
              "lessons_video_time_hms": "00:43:17",
              "timed_text_time_hms": "00:04:10",
              "untimed_text_items": 0,
              "questions_total": 6,
              "lessons_video_minutes": 43.28,
              "timed_text_minutes": 4.17,
              "total_time_minutes": 47.45
            }
          },
          {
            "name": "Perspective",
            "stats": {
              "lessons_video_time_hms": "00:57:13",
              "timed_text_time_hms": "00:06:00",
              "untimed_text_items": 0,
              "questions_total": 14,
              "lessons_video_minutes": 57.22,
              "timed_text_minutes": 6,
              "total_time_minutes": 63.22
            }
          },
          {
            "name": "Understanding drawings (architectural drawings)",
            "stats": {
              "lessons_video_time_hms": "00:51:11",
              "timed_text_time_hms": "00:30:14",
              "untimed_text_items": 0,
              "questions_total": 35,
              "lessons_video_minutes": 51.18,
              "timed_text_minutes": 30.23,
              "total_time_minutes": 81.42
            }
          },
          {
            "name": "3D figures / spatial thinking",
            "stats": {
              "lessons_video_time_hms": "00:00:00",
              "timed_text_time_hms": "00:02:17",
              "untimed_text_items": 1,
              "questions_total": 25,
              "lessons_video_minutes": 0,
              "timed_text_minutes": 2.28,
              "total_time_minutes": 2.28
            }
          },
          {
            "name": "Old exams (Drawing representation)",
            "stats": {
              "lessons_video_time_hms": "00:00:00",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 0,
              "questions_total": 70,
              "lessons_video_minutes": 0,
              "timed_text_minutes": 0,
              "total_time_minutes": 0
            }
          },
          {
            "name": "Practice tests",
            "stats": {
              "lessons_video_time_hms": "00:00:00",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 0,
              "questions_total": 60,
              "lessons_video_minutes": 0,
              "timed_text_minutes": 0,
              "total_time_minutes": 0
            }
          }
        ],
        "section_total": {
          "lessons_video_time_hms": "02:31:41",
          "timed_text_time_hms": "00:42:41",
          "untimed_text_items": 1,
          "questions_total": 210,
          "lessons_video_minutes": 151.68,
          "timed_text_minutes": 42.68,
          "total_time_minutes": 194.37
        }
      },
      {
        "section_id": 6,
        "title": "Math",
        "submodules": [
          {
            "name": "Intro & math terminology",
            "stats": {
              "lessons_video_time_hms": "00:04:58",
              "timed_text_time_hms": "00:03:49",
              "untimed_text_items": 0,
              "questions_total": 14,
              "lessons_video_minutes": 4.97,
              "timed_text_minutes": 3.82,
              "total_time_minutes": 8.78
            }
          },
          {
            "name": "Numbers, powers, roots, inequalities (part 1)",
            "stats": {
              "lessons_video_time_hms": "00:23:10",
              "timed_text_time_hms": "00:14:36",
              "untimed_text_items": 0,
              "questions_total": 13,
              "lessons_video_minutes": 23.17,
              "timed_text_minutes": 14.6,
              "total_time_minutes": 37.77
            }
          },
          {
            "name": "Equations (quadratics)",
            "stats": {
              "lessons_video_time_hms": "00:04:56",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 1,
              "questions_total": 16,
              "lessons_video_minutes": 4.93,
              "timed_text_minutes": 0,
              "total_time_minutes": 4.93
            }
          },
          {
            "name": "Functions",
            "stats": {
              "lessons_video_time_hms": "00:16:58",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 1,
              "questions_total": 17,
              "lessons_video_minutes": 16.97,
              "timed_text_minutes": 0,
              "total_time_minutes": 16.97
            }
          },
          {
            "name": "Geometry basics (figures + triangle)",
            "stats": {
              "lessons_video_time_hms": "00:05:04",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 1,
              "questions_total": 23,
              "lessons_video_minutes": 5.07,
              "timed_text_minutes": 0,
              "total_time_minutes": 5.07
            }
          },
          {
            "name": "Geometry: quadrilateral & circle",
            "stats": {
              "lessons_video_time_hms": "00:08:03",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 1,
              "questions_total": 24,
              "lessons_video_minutes": 8.05,
              "timed_text_minutes": 0,
              "total_time_minutes": 8.05
            }
          },
          {
            "name": "3D figures",
            "stats": {
              "lessons_video_time_hms": "00:00:00",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 1,
              "questions_total": 15,
              "lessons_video_minutes": 0,
              "timed_text_minutes": 0,
              "total_time_minutes": 0
            }
          },
          {
            "name": "Mathematical & geometrical reasoning (logic)",
            "stats": {
              "lessons_video_time_hms": "00:14:57",
              "timed_text_time_hms": "00:10:20",
              "untimed_text_items": 0,
              "questions_total": 0,
              "lessons_video_minutes": 14.95,
              "timed_text_minutes": 10.33,
              "total_time_minutes": 25.28
            }
          },
          {
            "name": "Logarithms & inequalities (part 2)",
            "stats": {
              "lessons_video_time_hms": "00:08:24",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 1,
              "questions_total": 26,
              "lessons_video_minutes": 8.4,
              "timed_text_minutes": 0,
              "total_time_minutes": 8.4
            }
          },
          {
            "name": "Systems of equations & inequalities",
            "stats": {
              "lessons_video_time_hms": "00:16:43",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 1,
              "questions_total": 10,
              "lessons_video_minutes": 16.72,
              "timed_text_minutes": 0,
              "total_time_minutes": 16.72
            }
          },
          {
            "name": "Logarithms (final)",
            "stats": {
              "lessons_video_time_hms": "00:09:36",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 1,
              "questions_total": 18,
              "lessons_video_minutes": 9.6,
              "timed_text_minutes": 0,
              "total_time_minutes": 9.6
            }
          }
        ],
        "section_total": {
          "lessons_video_time_hms": "01:52:49",
          "timed_text_time_hms": "00:28:45",
          "untimed_text_items": 8,
          "questions_total": 176,
          "lessons_video_minutes": 112.82,
          "timed_text_minutes": 28.75,
          "total_time_minutes": 141.57
        }
      },
      {
        "section_id": 7,
        "title": "Physics",
        "submodules": [
          {
            "name": "Vectors",
            "stats": {
              "lessons_video_time_hms": "00:06:13",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 1,
              "questions_total": 16,
              "lessons_video_minutes": 6.22,
              "timed_text_minutes": 0,
              "total_time_minutes": 6.22
            }
          },
          {
            "name": "Kinematics",
            "stats": {
              "lessons_video_time_hms": "00:15:16",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 1,
              "questions_total": 19,
              "lessons_video_minutes": 15.27,
              "timed_text_minutes": 0,
              "total_time_minutes": 15.27
            }
          },
          {
            "name": "Statics I",
            "stats": {
              "lessons_video_time_hms": "00:10:59",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 1,
              "questions_total": 20,
              "lessons_video_minutes": 10.98,
              "timed_text_minutes": 0,
              "total_time_minutes": 10.98
            }
          },
          {
            "name": "Statics II",
            "stats": {
              "lessons_video_time_hms": "00:00:00",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 1,
              "questions_total": 10,
              "lessons_video_minutes": 0,
              "timed_text_minutes": 0,
              "total_time_minutes": 0
            }
          },
          {
            "name": "Fluids & states of matter",
            "stats": {
              "lessons_video_time_hms": "00:09:55",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 1,
              "questions_total": 17,
              "lessons_video_minutes": 9.92,
              "timed_text_minutes": 0,
              "total_time_minutes": 9.92
            }
          },
          {
            "name": "Dynamics",
            "stats": {
              "lessons_video_time_hms": "00:08:51",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 1,
              "questions_total": 9,
              "lessons_video_minutes": 8.85,
              "timed_text_minutes": 0,
              "total_time_minutes": 8.85
            }
          },
          {
            "name": "Work & energy",
            "stats": {
              "lessons_video_time_hms": "00:17:35",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 1,
              "questions_total": 34,
              "lessons_video_minutes": 17.58,
              "timed_text_minutes": 0,
              "total_time_minutes": 17.58
            }
          },
          {
            "name": "Thermodynamics",
            "stats": {
              "lessons_video_time_hms": "00:09:37",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 1,
              "questions_total": 20,
              "lessons_video_minutes": 9.62,
              "timed_text_minutes": 0,
              "total_time_minutes": 9.62
            }
          },
          {
            "name": "Electrostatics & electrodynamics",
            "stats": {
              "lessons_video_time_hms": "00:21:12",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 2,
              "questions_total": 25,
              "lessons_video_minutes": 21.2,
              "timed_text_minutes": 0,
              "total_time_minutes": 21.2
            }
          },
          {
            "name": "Magnetism & oscillations",
            "stats": {
              "lessons_video_time_hms": "00:10:36",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 1,
              "questions_total": 26,
              "lessons_video_minutes": 10.6,
              "timed_text_minutes": 0,
              "total_time_minutes": 10.6
            }
          },
          {
            "name": "Optics",
            "stats": {
              "lessons_video_time_hms": "00:13:48",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 1,
              "questions_total": 11,
              "lessons_video_minutes": 13.8,
              "timed_text_minutes": 0,
              "total_time_minutes": 13.8
            }
          }
        ],
        "section_total": {
          "lessons_video_time_hms": "02:04:02",
          "timed_text_time_hms": "00:00:00",
          "untimed_text_items": 12,
          "questions_total": 207,
          "lessons_video_minutes": 124.03,
          "timed_text_minutes": 0,
          "total_time_minutes": 124.03
        }
      },
      {
        "section_id": 8,
        "title": "General culture",
        "submodules": [
          {
            "name": "Section overview",
            "stats": {
              "lessons_video_time_hms": "00:32:59",
              "timed_text_time_hms": "00:13:18",
              "untimed_text_items": 0,
              "questions_total": 0,
              "lessons_video_minutes": 32.98,
              "timed_text_minutes": 13.3,
              "total_time_minutes": 46.28
            }
          },
          {
            "name": "Terminology (economics & sociology)",
            "stats": {
              "lessons_video_time_hms": "00:00:00",
              "timed_text_time_hms": "00:21:28",
              "untimed_text_items": 0,
              "questions_total": 22,
              "lessons_video_minutes": 0,
              "timed_text_minutes": 21.47,
              "total_time_minutes": 21.47
            }
          },
          {
            "name": "Literature (general)",
            "stats": {
              "lessons_video_time_hms": "00:00:00",
              "timed_text_time_hms": "00:16:40",
              "untimed_text_items": 0,
              "questions_total": 10,
              "lessons_video_minutes": 0,
              "timed_text_minutes": 16.67,
              "total_time_minutes": 16.67
            }
          },
          {
            "name": "Italian presidents",
            "stats": {
              "lessons_video_time_hms": "00:00:00",
              "timed_text_time_hms": "00:09:09",
              "untimed_text_items": 0,
              "questions_total": 20,
              "lessons_video_minutes": 0,
              "timed_text_minutes": 9.15,
              "total_time_minutes": 9.15
            }
          },
          {
            "name": "Italian literature (practice)",
            "stats": {
              "lessons_video_time_hms": "00:00:00",
              "timed_text_time_hms": "00:20:13",
              "untimed_text_items": 0,
              "questions_total": 40,
              "lessons_video_minutes": 0,
              "timed_text_minutes": 20.22,
              "total_time_minutes": 20.22
            }
          }
        ],
        "section_total": {
          "lessons_video_time_hms": "00:32:59",
          "timed_text_time_hms": "01:20:48",
          "untimed_text_items": 0,
          "questions_total": 92,
          "lessons_video_minutes": 32.98,
          "timed_text_minutes": 80.8,
          "total_time_minutes": 113.78
        }
      },
      {
        "section_id": 9,
        "title": "History",
        "submodules": [
          {
            "name": "Antiquity",
            "stats": {
              "lessons_video_time_hms": "02:06:06",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 0,
              "questions_total": 32,
              "lessons_video_minutes": 126.1,
              "timed_text_minutes": 0,
              "total_time_minutes": 126.1
            }
          },
          {
            "name": "Middle Ages",
            "stats": {
              "lessons_video_time_hms": "02:16:42",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 0,
              "questions_total": 60,
              "lessons_video_minutes": 136.7,
              "timed_text_minutes": 0,
              "total_time_minutes": 136.7
            }
          },
          {
            "name": "Early Modern + 17th century",
            "stats": {
              "lessons_video_time_hms": "02:18:26",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 0,
              "questions_total": 45,
              "lessons_video_minutes": 138.43,
              "timed_text_minutes": 0,
              "total_time_minutes": 138.43
            }
          },
          {
            "name": "18th century",
            "stats": {
              "lessons_video_time_hms": "01:41:10",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 0,
              "questions_total": 45,
              "lessons_video_minutes": 101.17,
              "timed_text_minutes": 0,
              "total_time_minutes": 101.17
            }
          },
          {
            "name": "19th century",
            "stats": {
              "lessons_video_time_hms": "02:28:32",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 0,
              "questions_total": 60,
              "lessons_video_minutes": 148.53,
              "timed_text_minutes": 0,
              "total_time_minutes": 148.53
            }
          },
          {
            "name": "20th century",
            "stats": {
              "lessons_video_time_hms": "06:30:17",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 0,
              "questions_total": 120,
              "lessons_video_minutes": 390.28,
              "timed_text_minutes": 0,
              "total_time_minutes": 390.28
            }
          },
          {
            "name": "Italy overview",
            "stats": {
              "lessons_video_time_hms": "01:08:57",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 0,
              "questions_total": 15,
              "lessons_video_minutes": 68.95,
              "timed_text_minutes": 0,
              "total_time_minutes": 68.95
            }
          },
          {
            "name": "Misc / likely misplaced items",
            "stats": {
              "lessons_video_time_hms": "00:00:00",
              "timed_text_time_hms": "00:00:00",
              "untimed_text_items": 0,
              "questions_total": 6,
              "lessons_video_minutes": 0,
              "timed_text_minutes": 0,
              "total_time_minutes": 0
            }
          }
        ],
        "section_total": {
          "lessons_video_time_hms": "18:30:10",
          "timed_text_time_hms": "00:00:00",
          "untimed_text_items": 0,
          "questions_total": 383,
          "lessons_video_minutes": 1110.17,
          "timed_text_minutes": 0,
          "total_time_minutes": 1110.17
        }
      },
      {
        "section_id": 10,
        "title": "History of Art & Architecture",
        "submodules": [
          {
            "name": "Ancient Greece & Rome",
            "stats": {
              "lessons_video_time_hms": "00:49:34",
              "timed_text_time_hms": "00:14:56",
              "untimed_text_items": 0,
              "questions_total": 20,
              "lessons_video_minutes": 49.57,
              "timed_text_minutes": 14.93,
              "total_time_minutes": 64.5
            }
          },
          {
            "name": "Medieval + Proto-Renaissance / Gothic",
            "stats": {
              "lessons_video_time_hms": "00:51:37",
              "timed_text_time_hms": "00:17:19",
              "untimed_text_items": 0,
              "questions_total": 20,
              "lessons_video_minutes": 51.62,
              "timed_text_minutes": 17.32,
              "total_time_minutes": 68.93
            }
          },
          {
            "name": "Renaissance",
            "stats": {
              "lessons_video_time_hms": "00:42:12",
              "timed_text_time_hms": "00:16:10",
              "untimed_text_items": 0,
              "questions_total": 0,
              "lessons_video_minutes": 42.2,
              "timed_text_minutes": 16.17,
              "total_time_minutes": 58.37
            }
          },
          {
            "name": "Baroque -> Realism",
            "stats": {
              "lessons_video_time_hms": "00:57:39",
              "timed_text_time_hms": "00:17:54",
              "untimed_text_items": 0,
              "questions_total": 15,
              "lessons_video_minutes": 57.65,
              "timed_text_minutes": 17.9,
              "total_time_minutes": 75.55
            }
          },
          {
            "name": "19-20th century",
            "stats": {
              "lessons_video_time_hms": "00:53:10",
              "timed_text_time_hms": "00:42:00",
              "untimed_text_items": 0,
              "questions_total": 30,
              "lessons_video_minutes": 53.17,
              "timed_text_minutes": 42,
              "total_time_minutes": 95.17
            }
          },
          {
            "name": "Spotlight + memory (Leonardo/Gaudi/cards)",
            "stats": {
              "lessons_video_time_hms": "00:00:00",
              "timed_text_time_hms": "00:11:00",
              "untimed_text_items": 0,
              "questions_total": 30,
              "lessons_video_minutes": 0,
              "timed_text_minutes": 11,
              "total_time_minutes": 11
            }
          }
        ],
        "section_total": {
          "lessons_video_time_hms": "04:14:12",
          "timed_text_time_hms": "01:59:19",
          "untimed_text_items": 0,
          "questions_total": 115,
          "lessons_video_minutes": 254.2,
          "timed_text_minutes": 119.32,
          "total_time_minutes": 373.52
        }
      }
    ],
    "grand_total": {
      "lessons_video_time_hms": "30:42:07",
      "timed_text_time_hms": "04:53:44",
      "untimed_text_items": 25,
      "questions_total": 1353,
      "lessons_video_minutes": 1842.12,
      "timed_text_minutes": 293.73,
      "total_time_minutes": 2135.85
    }
  }
}
```
