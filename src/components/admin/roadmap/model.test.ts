import test from 'node:test';
import assert from 'node:assert/strict';
import { ROADMAP_PLAYGROUND_SEED } from '@/data/roadmap-playground-seed';
import { generateRoadmaps } from '@/lib/roadmap-generator/engine';
import { SprintCheckpointByPart } from '@/lib/roadmap-generator/types';
import {
  buildVisualRoadmapModel,
  checkpointSourceText,
  summarizeHero
} from '@/components/admin/roadmap/model';

const makeRoadmap = () => {
  const result = generateRoadmaps({
    ...ROADMAP_PLAYGROUND_SEED,
    weeks_to_exam: 20
  });

  return result.roadmaps[0];
};

test('buildVisualRoadmapModel groups ten sprints into 3/3/2/2 phases', () => {
  const roadmap = makeRoadmap();
  const model = buildVisualRoadmapModel(roadmap);

  assert.equal(model.sprints.length, 10);

  const counts = model.phases.reduce(
    (acc, phase) => {
      acc[phase.id] = phase.sprints.length;
      return acc;
    },
    {
      launch: 0,
      build: 0,
      focus: 0,
      final: 0
    }
  );

  assert.deepEqual(counts, {
    launch: 3,
    build: 3,
    focus: 2,
    final: 2
  });
});

test('checkpointSourceText supports single, mixed, and time_drill checkpoints', () => {
  const single: SprintCheckpointByPart = {
    exam_part: 'READING',
    source_item: {
      section_title: 'Text Comprehension',
      submodule_name: 'Real exam texts'
    },
    checkpoint_type: 'single',
    checkpoint_questions: 25,
    target_metrics: {
      accuracy: 0.7,
      avg_time_per_question_min: 2
    },
    confidence: 'ok'
  };

  const mixed: SprintCheckpointByPart = {
    exam_part: 'GENERAL_KNOWLEDGE',
    source_item: {
      section_title: 'History',
      submodule_name: '20th century'
    },
    source_items_mixed: [
      {
        section_title: 'History',
        submodule_name: '20th century',
        questions: 14
      },
      {
        section_title: 'History',
        submodule_name: '19th century',
        questions: 10
      }
    ],
    checkpoint_type: 'mixed',
    checkpoint_questions: 24,
    target_metrics: {
      accuracy: 0.7,
      avg_time_per_question_min: 2
    },
    confidence: 'ok'
  };

  const timeDrill: SprintCheckpointByPart = {
    exam_part: 'LOGIC',
    source_item: {
      section_title: 'N/A',
      submodule_name: 'Timed drill fallback'
    },
    checkpoint_type: 'time_drill',
    timed_drill_minutes: 25,
    checkpoint_questions: 0,
    target_metrics: {
      accuracy: 0.7,
      avg_time_per_question_min: 2
    },
    confidence: 'low_sample'
  };

  assert.equal(checkpointSourceText(single), '25Q from Real exam texts');
  assert.equal(checkpointSourceText(mixed), '24Q mixed checkpoint across 2 modules');
  assert.equal(checkpointSourceText(timeDrill), '25 min timed drill');
});

test('summarizeHero prefers question range text when available', () => {
  const text = summarizeHero({
    examPart: 'GENERAL_KNOWLEDGE',
    sectionTitle: 'History',
    submoduleName: '20th century',
    totalMinutes: 180,
    questionCount: 24,
    questionRange: '20-28',
    isRetakeOnly: false
  });

  assert.ok(text.includes('20-28Q'));
});
