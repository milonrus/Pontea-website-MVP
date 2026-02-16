import {
  AssessmentAnswer,
  AssessmentDomain,
  DomainGrade,
  DomainResult,
} from '@/types';
import { AssessmentLocale, getDomainLabels } from '@/data/assessmentQuestions';

const ALL_DOMAINS: AssessmentDomain[] = [
  'reading_en',
  'logic',
  'drawing_spatial',
  'math',
  'physics',
  'humanities',
];

export function scoreToGrade(score: number): DomainGrade {
  if (score <= 1) return 'A';
  if (score === 2) return 'B';
  if (score === 3) return 'C';
  if (score === 4) return 'D';
  return 'E';
}

export function getDifficultyForScore(
  selfScore: number
): 'easy' | 'medium' | 'hard' {
  if (selfScore <= 2) return 'easy';   // A or B
  if (selfScore === 3) return 'medium'; // C
  return 'hard';                        // D or E
}

export function computeDomainResults(
  answers: AssessmentAnswer[],
  locale: AssessmentLocale = 'ru'
): DomainResult[] {
  const domainLabels = getDomainLabels(locale);

  return ALL_DOMAINS.map((domain) => {
    const selfAnswer = answers.find(
      (a) => a.domain === domain && a.type === 'self_assessment'
    );
    const microAnswer = answers.find(
      (a) => a.domain === domain && a.type === 'micro_check'
    );

    const selfScore = selfAnswer?.selfAssessmentScore ?? 3;
    let finalScore = selfScore;
    let adjustment: number | undefined;

    if (microAnswer) {
      if (microAnswer.microCheckCorrect) {
        // Correct micro-check: no change (confirms self-assessment)
        adjustment = 0;
      } else {
        // Wrong micro-check: reduce by 1
        adjustment = -1;
        finalScore = selfScore - 1;
      }

      // High-confidence rule: if user said 5 but got micro-check wrong,
      // cap at 4
      if (selfScore === 5 && !microAnswer.microCheckCorrect) {
        finalScore = 4;
        adjustment = -1;
      }
    }

    // Clamp 1-5
    finalScore = Math.max(1, Math.min(5, finalScore));

    return {
      domain,
      domainLabel: domainLabels[domain],
      score: finalScore,
      grade: scoreToGrade(finalScore),
      selfAssessmentScore: selfScore,
      microCheckAdjustment: adjustment,
    };
  });
}

export function getWeakestDomains(results: DomainResult[]): DomainResult[] {
  const sorted = [...results].sort((a, b) => a.score - b.score);
  return sorted.slice(0, 2);
}

export function generateStudyPlan(results: DomainResult[]): DomainResult[] {
  return [...results].sort((a, b) => a.score - b.score);
}

export function domainResultsToLevelsBySection(
  domainResults: DomainResult[]
): Record<string, number> {
  const get = (domain: AssessmentDomain) =>
    domainResults.find((d) => d.domain === domain)?.score ?? 3;

  return {
    'Text Comprehension': get('reading_en'),
    'Logical reasoning': get('logic'),
    'Drawing & Representation': get('drawing_spatial'),
    'Math': get('math'),
    'Physics': get('physics'),
    'General culture': get('humanities'),
    'History': get('humanities'),
    'History of Art & Architecture': get('humanities'),
  };
}
