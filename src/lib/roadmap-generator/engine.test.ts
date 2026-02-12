import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateRoadmaps } from './engine';
import { CourseModularOverview, RoadmapGeneratorInput } from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const courseFixturePath = path.resolve(__dirname, '../../data/roadmap-course-overview.json');
const courseFixture = JSON.parse(fs.readFileSync(courseFixturePath, 'utf-8'));
const courseOverview = courseFixture.course_modular_overview as CourseModularOverview;

const makeLevels = (level: number): Record<string, number> => {
  const result: Record<string, number> = {};
  for (const section of courseOverview.sections) {
    result[section.title] = level;
  }
  return result;
};

const makeInput = (overrides: Partial<RoadmapGeneratorInput> = {}): RoadmapGeneratorInput => ({
  weeks_to_exam: 20,
  levels_by_section: makeLevels(3),
  course_modular_overview: courseOverview,
  checkpoint_history: [],
  config_overrides: {
    MINUTES_ROUNDING: 'none'
  },
  ...overrides
});

function makeCapDominatedCourse(): CourseModularOverview {
  return {
    sections: [
      {
        title: 'Text Comprehension',
        submodules: [
          {
            name: 'Reading Basics',
            stats: {
              lessons_video_minutes: 10,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 10
            }
          }
        ]
      },
      {
        title: 'Logical reasoning',
        submodules: [
          {
            name: 'Logic Basics',
            stats: {
              lessons_video_minutes: 10,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 10
            }
          }
        ]
      },
      {
        title: 'Drawing & Representation',
        submodules: [
          {
            name: 'Drawing Basics',
            stats: {
              lessons_video_minutes: 10,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 10
            }
          }
        ]
      },
      {
        title: 'Math',
        submodules: [
          {
            name: 'Math Basics',
            stats: {
              lessons_video_minutes: 10,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 10
            }
          }
        ]
      },
      {
        title: 'General culture',
        submodules: [
          {
            name: 'Massive Culture Block',
            stats: {
              lessons_video_minutes: 300,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 900
            }
          }
        ]
      }
    ]
  };
}

function makeHistoryArtUnlockCourse(): CourseModularOverview {
  return {
    sections: [
      {
        title: 'Text Comprehension',
        submodules: [
          {
            name: 'Reading Basics',
            stats: {
              lessons_video_minutes: 10,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 10
            }
          }
        ]
      },
      {
        title: 'Logical reasoning',
        submodules: [
          {
            name: 'Logic Basics',
            stats: {
              lessons_video_minutes: 10,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 10
            }
          }
        ]
      },
      {
        title: 'Drawing & Representation',
        submodules: [
          {
            name: 'Drawing Basics',
            stats: {
              lessons_video_minutes: 10,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 10
            }
          }
        ]
      },
      {
        title: 'Math',
        submodules: [
          {
            name: 'Math Basics',
            stats: {
              lessons_video_minutes: 10,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 10
            }
          }
        ]
      },
      {
        title: 'General culture',
        submodules: [
          {
            name: 'General Culture Intro',
            stats: {
              lessons_video_minutes: 10,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 10
            }
          }
        ]
      },
      {
        title: 'History',
        submodules: [
          {
            name: 'History Core Block',
            stats: {
              lessons_video_minutes: 260,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 90
            }
          }
        ]
      },
      {
        title: 'History of Art & Architecture',
        submodules: [
          {
            name: 'Art Core Block',
            stats: {
              lessons_video_minutes: 40,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 20
            }
          }
        ]
      }
    ]
  };
}

function makeHistoryArtIntroCourse(): CourseModularOverview {
  return {
    sections: [
      {
        title: 'Text Comprehension',
        submodules: [
          {
            name: 'Reading Basics',
            stats: {
              lessons_video_minutes: 10,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 10
            }
          }
        ]
      },
      {
        title: 'Logical reasoning',
        submodules: [
          {
            name: 'Logic Basics',
            stats: {
              lessons_video_minutes: 10,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 10
            }
          }
        ]
      },
      {
        title: 'Drawing & Representation',
        submodules: [
          {
            name: 'Drawing Basics',
            stats: {
              lessons_video_minutes: 10,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 10
            }
          }
        ]
      },
      {
        title: 'Math',
        submodules: [
          {
            name: 'Math Basics',
            stats: {
              lessons_video_minutes: 10,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 10
            }
          }
        ]
      },
      {
        title: 'General culture',
        submodules: [
          {
            name: 'General Culture Intro',
            stats: {
              lessons_video_minutes: 10,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 10
            }
          }
        ]
      },
      {
        title: 'History',
        submodules: [
          {
            name: 'History Core 1',
            stats: {
              lessons_video_minutes: 140,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 50
            }
          },
          {
            name: 'History Core 2',
            stats: {
              lessons_video_minutes: 140,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 50
            }
          }
        ]
      },
      {
        title: 'History of Art & Architecture',
        submodules: [
          {
            name: 'Intro references',
            stats: {
              lessons_video_minutes: 10,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 0
            }
          },
          {
            name: 'Art Core Block',
            stats: {
              lessons_video_minutes: 80,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 30
            }
          }
        ]
      }
    ]
  };
}

function makeSingleModulePerPartCourse(questionsTotal: number, learnMinutes: number): CourseModularOverview {
  return {
    sections: [
      {
        title: 'Text Comprehension',
        submodules: [
          {
            name: 'Reading Core',
            stats: {
              lessons_video_minutes: learnMinutes,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: questionsTotal
            }
          }
        ]
      },
      {
        title: 'Logical reasoning',
        submodules: [
          {
            name: 'Logic Core',
            stats: {
              lessons_video_minutes: learnMinutes,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: questionsTotal
            }
          }
        ]
      },
      {
        title: 'Drawing & Representation',
        submodules: [
          {
            name: 'Drawing Core',
            stats: {
              lessons_video_minutes: learnMinutes,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: questionsTotal
            }
          }
        ]
      },
      {
        title: 'Math',
        submodules: [
          {
            name: 'Math Core',
            stats: {
              lessons_video_minutes: learnMinutes,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: questionsTotal
            }
          }
        ]
      },
      {
        title: 'General culture',
        submodules: [
          {
            name: 'General Culture Core',
            stats: {
              lessons_video_minutes: learnMinutes,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: questionsTotal
            }
          }
        ]
      }
    ]
  };
}

test('optimal hours are derived and full coverage completes with zero backlog', () => {
  const result = generateRoadmaps(makeInput());
  assert.equal(result.roadmaps.length, 1);
  const roadmap = result.roadmaps[0];

  assert.equal(roadmap.metadata.generated_mode, 'full');
  assert.ok((roadmap.metadata.optimal_hours_per_week || 0) > 0);
  assert.equal(roadmap.metadata.optimal_hours_source, 'derived_from_material_and_caps');
  assert.ok((roadmap.metadata.required_core_minutes_total || 0) > 0);
  assert.ok((roadmap.metadata.required_minutes_due_to_cap_profile || 0) > 0);

  const remainingTotal = Object.values(
    roadmap.end_state.remaining_backlog_minutes_by_exam_part
  ).reduce((acc, value) => acc + value, 0);
  assert.equal(remainingTotal, 0);
});

test('cap-aware minimum can dominate required planning minutes', () => {
  const capCourse = makeCapDominatedCourse();
  const levels = {
    'Text Comprehension': 3,
    'Logical reasoning': 3,
    'Drawing & Representation': 3,
    Math: 3,
    'General culture': 3
  };

  const result = generateRoadmaps({
    weeks_to_exam: 10,
    levels_by_section: levels,
    course_modular_overview: capCourse,
    checkpoint_history: [],
    config_overrides: {
      MINUTES_ROUNDING: 'none',
      MAX_PART_SHARE: 0.3
    }
  });

  const roadmap = result.roadmaps[0];
  const core = roadmap.metadata.required_core_minutes_total || 0;
  const capDriven = roadmap.metadata.required_minutes_due_to_cap_profile || 0;
  assert.ok(capDriven > core);
});

test('strict json order is preserved within each section', () => {
  const result = generateRoadmaps(
    makeInput({
      weeks_to_exam: 8
    })
  );
  const roadmap = result.roadmaps[0];

  const sectionToOrder = new Map<string, string[]>();
  for (const section of courseOverview.sections) {
    sectionToOrder.set(section.title, section.submodules.map((submodule) => submodule.name));
  }

  const seenIndicesBySection = new Map<string, number[]>();

  for (const sprint of roadmap.sprints) {
    for (const item of sprint.items) {
      const hasCoreWorkInThisChunk =
        item.planned_learning_minutes > 0 || item.planned_practice_questions_unique > 0;
      if (!hasCoreWorkInThisChunk) {
        continue;
      }
      const order = sectionToOrder.get(item.section_title);
      if (!order) continue;
      const idx = order.indexOf(item.submodule_name);
      assert.ok(idx >= 0, `Unknown submodule '${item.submodule_name}' for section '${item.section_title}'`);
      const arr = seenIndicesBySection.get(item.section_title) || [];
      arr.push(idx);
      seenIndicesBySection.set(item.section_title, arr);
    }
  }

  for (const [sectionTitle, indices] of seenIndicesBySection.entries()) {
    let prev = indices[0] ?? 0;
    for (let i = 1; i < indices.length; i += 1) {
      const current = indices[i];
      assert.ok(
        current >= prev,
        `Section '${sectionTitle}' regressed from index ${prev} to ${current}`
      );
      if (current > prev) {
        assert.equal(
          current,
          prev + 1,
          `Section '${sectionTitle}' skipped ahead from ${prev} to ${current}`
        );
      }
      prev = current;
    }
  }
});

test('per-sprint module contract includes time, questions, untimed, and russian summary', () => {
  const result = generateRoadmaps(makeInput());
  const roadmap = result.roadmaps[0];

  for (const sprint of roadmap.sprints) {
    assert.ok(
      typeof sprint.sprint_summary_ru === 'string' && sprint.sprint_summary_ru.length > 0,
      `Sprint ${sprint.sprint_number} summary is missing`
    );
    for (const item of sprint.items) {
      assert.ok(item.total_minutes_est > 0);
      assert.ok(Number.isFinite(item.planned_practice_questions_unique));
      assert.ok(Number.isFinite(item.planned_practice_questions_retake));
      assert.ok(Number.isFinite(item.planned_untimed_items ?? 0));
    }
  }
});

test('split modules are labeled as part k/n when spanning multiple sprints', () => {
  const result = generateRoadmaps(
    makeInput({
      weeks_to_exam: 10
    })
  );
  const roadmap = result.roadmaps[0];

  const chunked = roadmap.sprints.flatMap((sprint) =>
    sprint.items.filter((item) => Boolean(item.module_chunk_label))
  );
  assert.ok(chunked.length > 0, 'Expected at least one chunk-labeled module');
  assert.ok(
    chunked.some((item) => /^part \d+\/\d+$/.test(item.module_chunk_label || '')),
    'Chunk label format must be part k/n'
  );
});

test('russian sprint summary totals match canonical item totals', () => {
  const result = generateRoadmaps(makeInput());
  const roadmap = result.roadmaps[0];

  for (const sprint of roadmap.sprints) {
    const summary = sprint.sprint_summary_ru || '';
    assert.ok(summary.includes(`Sprint ${sprint.sprint_number} Что изучаем`));
    const match = summary.match(/Практика: ~(\d+)(?:-(\d+))? вопросов, ~(\d+) untimed items\./);
    assert.ok(match, `Sprint ${sprint.sprint_number} summary footer not found`);

    const expectedQ = sprint.items.reduce(
      (acc, item) => acc + item.planned_practice_questions_unique + item.planned_practice_questions_retake,
      0
    );
    const expectedUntimed = sprint.items.reduce((acc, item) => acc + (item.planned_untimed_items || 0), 0);

    const low = Number(match![1]);
    const high = match![2] ? Number(match![2]) : low;
    const untimed = Number(match![3]);
    assert.ok(
      expectedQ >= low && expectedQ <= high,
      `Sprint ${sprint.sprint_number} expected questions ${expectedQ} outside summary range ${low}-${high}`
    );
    assert.equal(untimed, expectedUntimed);
  }
});

test('determinism: identical input yields byte-identical roadmap JSON', () => {
  const input = makeInput();
  const first = generateRoadmaps(input);
  const second = generateRoadmaps(input);

  assert.equal(JSON.stringify(first.roadmaps), JSON.stringify(second.roadmaps));

  for (const sprint of first.roadmaps[0].sprints) {
    assert.ok(Array.isArray(sprint.practice_blocks), 'Expected practice_blocks field on every sprint');
    for (const item of sprint.items) {
      const qTotal = item.planned_practice_questions_unique + item.planned_practice_questions_retake;
      if (qTotal > 0) {
        assert.ok(item.planned_practice_questions_range);
      }
      assert.ok(item.exercise_priority);
    }
  }
});

test('retakes are scheduled only after unique questions are exhausted for that module', () => {
  const result = generateRoadmaps(makeInput());
  const roadmap = result.roadmaps[0];

  for (const sprint of roadmap.sprints) {
    for (const item of sprint.items) {
      if (item.planned_practice_questions_retake <= 0) continue;
      assert.equal(
        item.remaining_after_sprint.questions_remaining_unique,
        0,
        `${item.section_title} -> ${item.submodule_name} has retakes while unique questions remain`
      );
    }
  }
});

test('checkpoint confidence is low_sample for checkpoint_questions below 15', () => {
  const tinyCourse: CourseModularOverview = {
    sections: [
      {
        title: 'Text Comprehension',
        submodules: [
          {
            name: 'Tiny Reading',
            stats: {
              lessons_video_minutes: 0,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 5
            }
          }
        ]
      },
      {
        title: 'Logical reasoning',
        submodules: [
          {
            name: 'Tiny Logic',
            stats: {
              lessons_video_minutes: 0,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 5
            }
          }
        ]
      },
      {
        title: 'Drawing & Representation',
        submodules: [
          {
            name: 'Tiny Drawing',
            stats: {
              lessons_video_minutes: 0,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 5
            }
          }
        ]
      },
      {
        title: 'Math',
        submodules: [
          {
            name: 'Tiny Math',
            stats: {
              lessons_video_minutes: 0,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 5
            }
          }
        ]
      },
      {
        title: 'General culture',
        submodules: [
          {
            name: 'Tiny GK',
            stats: {
              lessons_video_minutes: 0,
              timed_text_minutes: 0,
              untimed_text_items: 0,
              questions_total: 5
            }
          }
        ]
      }
    ]
  };

  const result = generateRoadmaps({
    weeks_to_exam: 4,
    levels_by_section: {
      'Text Comprehension': 3,
      'Logical reasoning': 3,
      'Drawing & Representation': 3,
      Math: 3,
      'General culture': 3
    },
    course_modular_overview: tinyCourse,
    checkpoint_history: [],
    config_overrides: {
      MINUTES_ROUNDING: 'none',
      ENABLE_RETAKES: false
    }
  });
  const roadmap = result.roadmaps[0];

  let sawLowSample = false;

  for (const sprint of roadmap.sprints) {
    for (const entry of sprint.checkpoint.definition_by_part) {
      if (entry.checkpoint_questions < 15) {
        sawLowSample = true;
        assert.equal(
          entry.confidence,
          'low_sample',
          `Expected low_sample for ${entry.exam_part} with ${entry.checkpoint_questions} questions`
        );
      }
    }
  }

  assert.equal(sawLowSample, true);
});

test('input hours are ignored unless USE_INPUT_HOURS_IF_PROVIDED is enabled', () => {
  const noOverride = generateRoadmaps(
    makeInput({
      hours_per_week: 30
    })
  ).roadmaps[0];
  assert.equal(noOverride.metadata.manual_hours_override_applied, false);
  assert.ok(
    (noOverride.metadata.hours_per_week || 0) >=
      (noOverride.metadata.optimal_hours_per_week || 0)
  );

  const withOverride = generateRoadmaps(
    makeInput({
      hours_per_week: 30,
      config_overrides: {
        MINUTES_ROUNDING: 'none',
        USE_INPUT_HOURS_IF_PROVIDED: true
      }
    })
  ).roadmaps[0];
  assert.equal(withOverride.metadata.manual_hours_override_applied, true);
  assert.equal(withOverride.metadata.hours_per_week, 30);
});

test('derived hours are used consistently when manual override is disabled', () => {
  const roadmap = generateRoadmaps(
    makeInput({
      hours_per_week: 16,
      config_overrides: {
        MINUTES_ROUNDING: 'none',
        USE_INPUT_HOURS_IF_PROVIDED: false
      }
    })
  ).roadmaps[0];

  assert.equal(roadmap.metadata.manual_hours_override_applied, false);
  assert.ok(
    Math.abs((roadmap.metadata.hours_per_week || 0) - (roadmap.metadata.optimal_hours_per_week || 0)) <
      1e-9
  );
});

test('manual hours override is not auto-increased by completion loop', () => {
  const roadmap = generateRoadmaps(
    makeInput({
      hours_per_week: 2,
      config_overrides: {
        MINUTES_ROUNDING: 'none',
        USE_INPUT_HOURS_IF_PROVIDED: true
      }
    })
  ).roadmaps[0];

  assert.equal(roadmap.metadata.manual_hours_override_applied, true);
  assert.equal(roadmap.metadata.hours_per_week, 2);
});

test('v3 default does not enforce fill target and does not emit fill_target_minutes', () => {
  const roadmap = generateRoadmaps(makeInput()).roadmaps[0];
  for (const sprint of roadmap.sprints) {
    assert.equal(sprint.totals.fill_target_minutes, undefined);
  }
});

test('part budgets reflect executed allocation and primary budgets are preserved separately', () => {
  const roadmap = generateRoadmaps(makeInput()).roadmaps[0];
  for (const sprint of roadmap.sprints) {
    assert.deepEqual(sprint.part_budgets_minutes, sprint.part_executed_minutes);
    assert.ok(sprint.part_budgets_primary_minutes);
  }
});

test('retake-only maintenance chunks do not receive part k/n labels', () => {
  const roadmap = generateRoadmaps(makeInput()).roadmaps[0];
  const retakeOnlyItems = roadmap.sprints.flatMap((sprint) =>
    sprint.items.filter(
      (item) =>
        item.planned_learning_minutes === 0 &&
        item.planned_practice_questions_unique === 0 &&
        item.planned_practice_questions_retake > 0 &&
        item.remaining_after_sprint.learning_minutes_remaining === 0 &&
        item.remaining_after_sprint.questions_remaining_unique === 0
    )
  );

  for (const item of retakeOnlyItems) {
    assert.equal(item.module_chunk_label, undefined);
  }
});

test('weak parts are prioritized over strong parts in early sprint redistribution', () => {
  const roadmap = generateRoadmaps(
    makeInput({
      levels_by_section: {
        'Text Comprehension': 3,
        'Logical reasoning': 3,
        'Drawing & Representation': 3,
        Math: 5,
        Physics: 5,
        'General culture': 1,
        History: 1,
        'History of Art & Architecture': 1
      }
    })
  ).roadmaps[0];

  const sprint1 = roadmap.sprints[0];
  assert.equal(sprint1.focus_exam_parts_ranked[0], 'GENERAL_KNOWLEDGE');
  assert.ok((sprint1.part_executed_minutes?.GENERAL_KNOWLEDGE || 0) >= (sprint1.part_executed_minutes?.MATH_PHYSICS || 0));
  assert.equal(sprint1.items[0]?.exam_part, 'GENERAL_KNOWLEDGE');
  const historyCoreItems = sprint1.items.filter(
    (item) =>
      item.section_title === 'History' &&
      (item.planned_learning_minutes > 0 || item.planned_practice_questions_unique > 0)
  );
  assert.ok(historyCoreItems.length > 0, 'Expected sprint 1 to include History core work for weak GK setup');
});

test('history of art is deferred until history reaches unlock threshold', () => {
  const course = makeHistoryArtUnlockCourse();
  const roadmap = generateRoadmaps({
    weeks_to_exam: 8,
    levels_by_section: {
      'Text Comprehension': 3,
      'Logical reasoning': 3,
      'Drawing & Representation': 3,
      Math: 3,
      'General culture': 3,
      History: 1,
      'History of Art & Architecture': 1
    },
    course_modular_overview: course,
    checkpoint_history: [],
    config_overrides: {
      MINUTES_ROUNDING: 'none',
      HISTORY_ART_UNLOCK_HISTORY_PROGRESS_PCT: 1
    }
  }).roadmaps[0];

  const firstArtSprintIndex = roadmap.sprints.findIndex((sprint) =>
    sprint.items.some(
      (item) =>
        item.section_title === 'History of Art & Architecture' &&
        (item.planned_learning_minutes > 0 || item.planned_practice_questions_unique > 0)
    )
  );
  assert.ok(firstArtSprintIndex >= 0, 'Expected at least one Art sprint once History unlocks');

  for (let i = 0; i < firstArtSprintIndex; i += 1) {
    const artCoreCount = roadmap.sprints[i].items.filter(
      (item) =>
        item.section_title === 'History of Art & Architecture' &&
        (item.planned_learning_minutes > 0 || item.planned_practice_questions_unique > 0)
    ).length;
    assert.equal(artCoreCount, 0, `Art module appeared too early in sprint ${i + 1}`);
  }
});

test('art intro scaffolding can appear before history completion but art core stays locked', () => {
  const course = makeHistoryArtIntroCourse();
  const roadmap = generateRoadmaps({
    weeks_to_exam: 8,
    levels_by_section: {
      'Text Comprehension': 3,
      'Logical reasoning': 3,
      'Drawing & Representation': 3,
      Math: 3,
      'General culture': 3,
      History: 1,
      'History of Art & Architecture': 1
    },
    course_modular_overview: course,
    checkpoint_history: [],
    config_overrides: {
      MINUTES_ROUNDING: 'none',
      HISTORY_ART_UNLOCK_HISTORY_PROGRESS_PCT: 1,
      HISTORY_ART_ALLOW_INTRO_SCAFFOLDING: true
    }
  }).roadmaps[0];

  const isArtIntro = (submoduleName: string) => /intro|reference/i.test(submoduleName);
  const isArtCoreItem = (item: { section_title: string; submodule_name: string; planned_learning_minutes: number; planned_practice_questions_unique: number; }) =>
    item.section_title === 'History of Art & Architecture' &&
    !isArtIntro(item.submodule_name) &&
    (item.planned_learning_minutes > 0 || item.planned_practice_questions_unique > 0);

  const firstArtCoreSprintIndex = roadmap.sprints.findIndex((sprint) =>
    sprint.items.some((item) => isArtCoreItem(item))
  );
  assert.ok(firstArtCoreSprintIndex >= 0, 'Expected Art core to appear eventually');

  const introBeforeCore = roadmap.sprints
    .slice(0, firstArtCoreSprintIndex + 1)
    .some((sprint) =>
      sprint.items.some(
        (item) =>
          item.section_title === 'History of Art & Architecture' &&
          isArtIntro(item.submodule_name)
      )
    );
  assert.equal(introBeforeCore, true, 'Expected Art intro scaffolding before or at unlock sprint');

  for (let i = 0; i < firstArtCoreSprintIndex; i += 1) {
    const artCoreCount = roadmap.sprints[i].items.filter((item) => isArtCoreItem(item)).length;
    assert.equal(artCoreCount, 0, `Art core appeared too early in sprint ${i + 1}`);
  }
});

test('retakes are gated to late phase and global progress threshold in v4', () => {
  const input = makeInput({
    config_overrides: {
      MINUTES_ROUNDING: 'none',
      RETAKES_FINAL_PHASE_ONLY: true,
      RETAKES_GLOBAL_CORE_PROGRESS_PCT: 0.9
    }
  });
  const roadmap = generateRoadmaps(input).roadmaps[0];
  const finalPhaseWeeks = roadmap.metadata.config_used.final_phase.FINAL_PRACTICE_WEEKS;
  const finalPhaseStartSprint = Math.max(1, roadmap.sprints.length - finalPhaseWeeks + 1);

  for (const sprint of roadmap.sprints) {
    const retakes = sprint.items.reduce((acc, item) => acc + item.planned_practice_questions_retake, 0);
    if (sprint.sprint_number < finalPhaseStartSprint) {
      assert.equal(
        retakes,
        0,
        `Retakes leaked before final phase in sprint ${sprint.sprint_number}`
      );
    }
  }

  const thresholdRoadmap = generateRoadmaps(
    makeInput({
      config_overrides: {
        MINUTES_ROUNDING: 'none',
        RETAKES_FINAL_PHASE_ONLY: false,
        RETAKES_GLOBAL_CORE_PROGRESS_PCT: 1
      }
    })
  ).roadmaps[0];
  for (let i = 0; i < thresholdRoadmap.sprints.length - 1; i += 1) {
    const retakes = thresholdRoadmap.sprints[i].items.reduce(
      (acc, item) => acc + item.planned_practice_questions_retake,
      0
    );
    assert.equal(retakes, 0, `Retakes should not appear before 100% core progress (sprint ${i + 1})`);
  }
});

test('non-fill high-level mode is not inflated by cap-only requirements', () => {
  const capCourse = makeCapDominatedCourse();
  const result = generateRoadmaps({
    weeks_to_exam: 10,
    levels_by_section: {
      'Text Comprehension': 3,
      'Logical reasoning': 3,
      'Drawing & Representation': 3,
      Math: 3,
      'General culture': 3
    },
    course_modular_overview: capCourse,
    checkpoint_history: [],
    config_overrides: {
      MINUTES_ROUNDING: 'none',
      MAX_PART_SHARE: 0.3,
      ENFORCE_FILL_TO_PLAN_IN_V3: false
    }
  }).roadmaps[0];

  const requiredCoreMinutes = result.metadata.required_core_minutes_total || 0;
  const step = result.metadata.final_hours_rounding_step || 0.1;
  const sprintBufferPct = result.metadata.config_used.SPRINT_BUFFER_PCT;
  const reviewBufferPct = result.metadata.config_used.hours_policy.HIGH_LEVEL_REVIEW_BUFFER_PCT || 0;
  const expected =
    Math.ceil(
      ((requiredCoreMinutes * (1 + reviewBufferPct)) / (10 * 60 * (1 - sprintBufferPct))) / step
    ) * step;

  assert.ok((result.metadata.required_minutes_due_to_cap_profile || 0) > (result.metadata.required_core_minutes_total || 0));
  assert.ok(
    Math.abs((result.metadata.hours_per_week || 0) - expected) < 1e-9,
    `Expected non-fill hours ${expected}, got ${result.metadata.hours_per_week}`
  );
});

test('completion loop downshifts hours but stays at minimal feasible step', () => {
  const course = makeSingleModulePerPartCourse(40, 80);
  const levels = {
    'Text Comprehension': 3,
    'Logical reasoning': 3,
    'Drawing & Representation': 3,
    Math: 3,
    'General culture': 3
  };

  const roadmap = generateRoadmaps({
    weeks_to_exam: 16,
    levels_by_section: levels,
    course_modular_overview: course,
    checkpoint_history: [],
    config_overrides: {
      MINUTES_ROUNDING: 'none'
    }
  }).roadmaps[0];

  const remaining = Object.values(roadmap.end_state.remaining_backlog_minutes_by_exam_part).reduce(
    (acc, value) => acc + value,
    0
  );
  assert.equal(remaining, 0);

  const step = roadmap.metadata.final_hours_rounding_step || 0.1;
  const lowerHours = Number(((roadmap.metadata.hours_per_week || 0) - step).toFixed(1));
  assert.ok(lowerHours > 0);

  const lowerRoadmap = generateRoadmaps({
    weeks_to_exam: 16,
    hours_per_week: lowerHours,
    levels_by_section: levels,
    course_modular_overview: course,
    checkpoint_history: [],
    config_overrides: {
      MINUTES_ROUNDING: 'none',
      USE_INPUT_HOURS_IF_PROVIDED: true
    }
  }).roadmaps[0];

  const lowerRemaining = Object.values(lowerRoadmap.end_state.remaining_backlog_minutes_by_exam_part).reduce(
    (acc, value) => acc + value,
    0
  );
  assert.ok(lowerRemaining > 0, 'Expected one-step lower manual hours to leave non-zero core backlog');
});

test('split minimization keeps small modules unsplit and enforces max chunk count', () => {
  const roadmap = generateRoadmaps(
    makeInput({
      config_overrides: {
        MINUTES_ROUNDING: 'none',
        PREFER_UNSPLIT_MODULES: true,
        UNSPLIT_MODULE_MAX_MIN: 600,
        MAX_MODULE_CHUNKS: 2,
        MIN_CHUNK_MIN: 45
      }
    })
  ).roadmaps[0];

  const byModule = new Map<string, typeof roadmap.sprints[number]['items']>();
  for (const sprint of roadmap.sprints) {
    for (const item of sprint.items) {
      const key = `${item.section_title}::${item.submodule_name}`;
      const existing = byModule.get(key) || [];
      existing.push(item);
      byModule.set(key, existing);
      if (item.module_chunk_label) {
        const match = item.module_chunk_label.match(/^part (\d+)\/(\d+)$/);
        assert.ok(match, `Invalid chunk label format: ${item.module_chunk_label}`);
        assert.ok(Number(match[2]) <= 2, `Chunk count exceeds MAX_MODULE_CHUNKS: ${item.module_chunk_label}`);
      }
    }
  }

  for (const [moduleKey, items] of byModule.entries()) {
    const coreItems = items.filter(
      (item) =>
        item.planned_learning_minutes > 0 ||
        item.planned_practice_questions_unique > 0 ||
        item.is_partial
    );
    if (coreItems.length <= 1) continue;
    const totalCoreMinutes = coreItems.reduce((acc, item) => acc + item.total_minutes_est, 0);
    if (totalCoreMinutes <= 600) {
      const hasChunkLabels = coreItems.some((item) => Boolean(item.module_chunk_label));
      assert.equal(hasChunkLabels, false, `Small module should remain unsplit: ${moduleKey}`);
    }
  }
});

test('practice question range output is deterministic and attached to practiced items', () => {
  const first = generateRoadmaps(makeInput()).roadmaps[0];
  const second = generateRoadmaps(makeInput()).roadmaps[0];

  const practicedFirst = first.sprints.flatMap((sprint) =>
    sprint.items.filter(
      (item) =>
        item.planned_practice_questions_unique + item.planned_practice_questions_retake > 0
    )
  );
  const practicedSecond = second.sprints.flatMap((sprint) =>
    sprint.items.filter(
      (item) =>
        item.planned_practice_questions_unique + item.planned_practice_questions_retake > 0
    )
  );

  assert.equal(practicedFirst.length, practicedSecond.length);
  assert.ok(practicedFirst.length > 0);

  for (let i = 0; i < practicedFirst.length; i += 1) {
    const a = practicedFirst[i];
    const b = practicedSecond[i];
    assert.ok(a.planned_practice_questions_range, 'Missing planned_practice_questions_range');
    assert.match(a.planned_practice_questions_range!, /^\d+-\d+$/);
    assert.equal(a.planned_practice_questions_range, b.planned_practice_questions_range);
    assert.ok(a.exercise_priority, 'Missing exercise_priority');
  }
});

test('policy feasibility is true when roadmap finishes all core backlog', () => {
  const roadmap = generateRoadmaps(makeInput()).roadmaps[0];
  const remainingTotal = Object.values(
    roadmap.end_state.remaining_backlog_minutes_by_exam_part
  ).reduce((acc, value) => acc + value, 0);

  assert.equal(remainingTotal, 0);
  assert.equal(roadmap.metadata.feasibility.policy_feasible, true);
  const contradictoryNote = roadmap.metadata.feasibility.notes.find((note) =>
    /(infeasible|prevent full coverage|unable to)/i.test(note)
  );
  assert.equal(contradictoryNote, undefined);
});
