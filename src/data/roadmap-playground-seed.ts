import courseFixture from '@/data/roadmap-course-overview.json';
import { DEFAULT_ROADMAP_CONFIG } from '@/lib/roadmap-generator/defaults';

const sections = courseFixture.course_modular_overview.sections || [];

const defaultLevels = sections.reduce((acc, section) => {
  acc[section.title] = 3;
  return acc;
}, {} as Record<string, number>);

export const ROADMAP_PLAYGROUND_STORAGE_KEY = 'roadmap-playground-v1';

export const ROADMAP_PLAYGROUND_SEED = {
  weeks_to_exam: 20,
  hours_per_week: 10,
  levels_by_section: defaultLevels,
  course_modular_overview: courseFixture.course_modular_overview,
  checkpoint_history: [] as any[],
  config_overrides: DEFAULT_ROADMAP_CONFIG
};

export const ROADMAP_PLAYGROUND_SEED_TEXT = {
  weeks_to_exam: String(ROADMAP_PLAYGROUND_SEED.weeks_to_exam),
  hours_per_week: String(ROADMAP_PLAYGROUND_SEED.hours_per_week),
  levels_by_section: JSON.stringify(ROADMAP_PLAYGROUND_SEED.levels_by_section, null, 2),
  course_modular_overview: JSON.stringify(ROADMAP_PLAYGROUND_SEED.course_modular_overview, null, 2),
  checkpoint_history: JSON.stringify(ROADMAP_PLAYGROUND_SEED.checkpoint_history, null, 2),
  config_overrides: JSON.stringify(ROADMAP_PLAYGROUND_SEED.config_overrides, null, 2)
};
