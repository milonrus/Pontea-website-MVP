import { MinutesRoundingMode, NameCategory, NameCategoryPattern, RoadmapConfig } from './types';
import { EXAM_PART_ORDER, NAME_CATEGORY_RANK } from './defaults';

export function normalizeTitle(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function roundHalfUp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.floor(value + 0.5);
}

export function roundToNearestStep(value: number, step: number): number {
  if (step <= 0) return value;
  const ratio = value / step;
  return roundHalfUp(ratio) * step;
}

export function roundMinutes(value: number, mode: MinutesRoundingMode): number {
  switch (mode) {
    case 'none':
      return value;
    case 'ceil':
      return Math.ceil(value);
    case 'floor':
      return Math.floor(value);
    case 'nearest_1':
      return roundToNearestStep(value, 1);
    case 'nearest_5':
      return roundToNearestStep(value, 5);
    case 'nearest_15':
      return roundToNearestStep(value, 15);
    default:
      return value;
  }
}

export function deepMergeConfig(
  defaults: RoadmapConfig,
  overrides?: Partial<RoadmapConfig>
): RoadmapConfig {
  if (!overrides) {
    return structuredClone(defaults);
  }

  const merged: RoadmapConfig = {
    ...defaults,
    ...overrides,
    SUBJECT_MULTIPLIER_BY_SECTION_TITLE: {
      ...defaults.SUBJECT_MULTIPLIER_BY_SECTION_TITLE,
      ...(overrides.SUBJECT_MULTIPLIER_BY_SECTION_TITLE || {})
    },
    LEVEL_TIME_MULTIPLIER: {
      ...defaults.LEVEL_TIME_MULTIPLIER,
      ...(overrides.LEVEL_TIME_MULTIPLIER || {})
    },
    LEVEL_LEARNING_SHARE: {
      ...defaults.LEVEL_LEARNING_SHARE,
      ...(overrides.LEVEL_LEARNING_SHARE || {})
    },
    LEVEL_PRACTICE_SHARE: {
      ...defaults.LEVEL_PRACTICE_SHARE,
      ...(overrides.LEVEL_PRACTICE_SHARE || {})
    },
    TARGET_TIME_PER_Q_BY_PART: {
      ...defaults.TARGET_TIME_PER_Q_BY_PART,
      ...(overrides.TARGET_TIME_PER_Q_BY_PART || {})
    },
    MIN_SECTION_SHARE_WITHIN_PART: {
      ...defaults.MIN_SECTION_SHARE_WITHIN_PART,
      ...(overrides.MIN_SECTION_SHARE_WITHIN_PART || {})
    },
    SECTION_TO_EXAM_PART_OVERRIDE: {
      ...defaults.SECTION_TO_EXAM_PART_OVERRIDE,
      ...(overrides.SECTION_TO_EXAM_PART_OVERRIDE || {})
    }
  };

  if (overrides.NAME_CATEGORY_PATTERNS) {
    merged.NAME_CATEGORY_PATTERNS = overrides.NAME_CATEGORY_PATTERNS;
  }

  return merged;
}

export function classifySubmoduleName(
  submoduleName: string,
  orderedPatterns: NameCategoryPattern[]
): NameCategory {
  const haystack = submoduleName.toLowerCase();

  for (const entry of orderedPatterns) {
    for (const pattern of entry.patterns) {
      const lowerPattern = pattern.toLowerCase();
      const includes = haystack.includes(lowerPattern);
      if (includes) {
        return entry.category;
      }

      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(submoduleName)) {
          return entry.category;
        }
      } catch {
        // Ignore invalid regex patterns and continue deterministic substring matching.
      }
    }
  }

  return 'CORE';
}

export function getCategoryRank(category: NameCategory): number {
  return NAME_CATEGORY_RANK[category] ?? NAME_CATEGORY_RANK.CORE;
}

export function fixedPartOrderIndex(part: string): number {
  const index = EXAM_PART_ORDER.indexOf(part as any);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export function stableSortBy<T>(items: T[], compare: (a: T, b: T) => number): T[] {
  return items
    .map((value, index) => ({ value, index }))
    .sort((a, b) => {
      const delta = compare(a.value, b.value);
      return delta !== 0 ? delta : a.index - b.index;
    })
    .map((entry) => entry.value);
}

export function allocateByLargestRemainder<K extends string>(
  exact: Record<K, number>,
  total: number,
  tiePriorityScore?: Partial<Record<K, number>>,
  tieOrder?: K[]
): Record<K, number> {
  const keys = Object.keys(exact) as K[];
  const floors: Record<K, number> = {} as Record<K, number>;
  const remainders: Array<{ key: K; remainder: number; score: number; order: number }> = [];

  let floorSum = 0;

  keys.forEach((key) => {
    const floorValue = Math.floor(exact[key] || 0);
    floors[key] = floorValue;
    floorSum += floorValue;
    const order = tieOrder ? Math.max(0, tieOrder.indexOf(key)) : keys.indexOf(key);
    remainders.push({
      key,
      remainder: (exact[key] || 0) - floorValue,
      score: tiePriorityScore?.[key] ?? 0,
      order
    });
  });

  let remaining = Math.max(0, total - floorSum);

  remainders.sort((a, b) => {
    if (b.remainder !== a.remainder) return b.remainder - a.remainder;
    if (b.score !== a.score) return b.score - a.score;
    return a.order - b.order;
  });

  for (let i = 0; i < remainders.length && remaining > 0; i += 1) {
    floors[remainders[i].key] += 1;
    remaining -= 1;
  }

  return floors;
}

export function normalizeSharesWithBounds<K extends string>(
  rawShares: Record<K, number>,
  activeKeys: K[],
  minShare: number,
  maxShare: number,
  order: K[]
): Record<K, number> {
  const result: Record<K, number> = {} as Record<K, number>;

  const activeSet = new Set(activeKeys);
  (Object.keys(rawShares) as K[]).forEach((key) => {
    if (!activeSet.has(key)) {
      result[key] = 0;
    }
  });

  if (activeKeys.length === 0) {
    return result;
  }

  const fixed: Partial<Record<K, number>> = {};
  let free = [...activeKeys].sort((a, b) => order.indexOf(a) - order.indexOf(b));

  const getRaw = (k: K) => rawShares[k] ?? 0;

  for (let iter = 0; iter < 32; iter += 1) {
    const sumFixed = (Object.values(fixed) as Array<number | undefined>).reduce(
      (acc, val) => acc + (val ?? 0),
      0
    );
    const targetFreeSum = 1 - sumFixed;

    if (free.length === 0) {
      break;
    }

    const rawFreeSum = free.reduce((acc, key) => acc + getRaw(key), 0);
    const tentative: Partial<Record<K, number>> = {};

    if (rawFreeSum <= 0) {
      const equal = targetFreeSum / free.length;
      free.forEach((key) => {
        tentative[key] = equal;
      });
    } else {
      free.forEach((key) => {
        tentative[key] = (getRaw(key) * targetFreeSum) / rawFreeSum;
      });
    }

    let changed = false;
    const stillFree: K[] = [];

    free.forEach((key) => {
      const val = tentative[key] ?? 0;
      if (val < minShare) {
        fixed[key] = minShare;
        changed = true;
      } else if (val > maxShare) {
        fixed[key] = maxShare;
        changed = true;
      } else {
        stillFree.push(key);
      }
    });

    if (!changed) {
      stillFree.forEach((key) => {
        fixed[key] = tentative[key] ?? 0;
      });
      free = [];
      break;
    }

    free = stillFree;
  }

  activeKeys.forEach((key) => {
    result[key] = fixed[key] ?? 0;
  });

  const sum = activeKeys.reduce((acc, key) => acc + (result[key] || 0), 0);
  if (sum > 0) {
    activeKeys.forEach((key) => {
      result[key] = result[key] / sum;
    });
  }

  return result;
}

export function sortObjectKeysDeterministic<T>(input: Record<string, T>): Record<string, T> {
  const sortedKeys = Object.keys(input).sort((a, b) => a.localeCompare(b));
  const result: Record<string, T> = {};
  sortedKeys.forEach((k) => {
    result[k] = input[k];
  });
  return result;
}
