import { normalizeHeaderForDetection } from '@/utils/csvHeaders';

export type CSVFormat = 'pontea' | 'learnworlds' | 'unknown';

export const detectCSVFormat = (headers: string[]): CSVFormat => {
  const headerSet = new Set(headers.map(normalizeHeaderForDetection));

  // LearnWorlds signature: Group, CorrectAns, Answer1
  if (headerSet.has('group') && headerSet.has('correctans') && headerSet.has('answer1')) {
    return 'learnworlds';
  }

  // Pontea signature: subjectId, optionA, optionB
  if (headerSet.has('subjectid') && headerSet.has('optiona') && headerSet.has('optionb')) {
    return 'pontea';
  }

  return 'unknown';
};
