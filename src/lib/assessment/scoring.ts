import {
  AssessmentAnswer,
  AssessmentDomain,
  DomainGrade,
  DomainResult,
} from '@/types';
import { DOMAIN_LABELS } from '@/data/assessmentQuestions';

const ALL_DOMAINS: AssessmentDomain[] = [
  'reading_en',
  'logic',
  'drawing_spatial',
  'math',
  'physics',
  'humanities',
];

export function scoreToGrade(score: number): DomainGrade {
  if (score <= 0) return 'A';
  if (score === 1) return 'B';
  if (score === 2) return 'C';
  return 'D';
}

export function getDifficultyForScore(
  selfScore: number
): 'easy' | 'medium' | 'hard' {
  if (selfScore <= 1) return 'easy';   // A or B
  if (selfScore === 2) return 'medium'; // C
  return 'hard';                        // D
}

export function computeDomainResults(
  answers: AssessmentAnswer[]
): DomainResult[] {
  return ALL_DOMAINS.map((domain) => {
    const selfAnswer = answers.find(
      (a) => a.domain === domain && a.type === 'self_assessment'
    );
    const microAnswer = answers.find(
      (a) => a.domain === domain && a.type === 'micro_check'
    );

    const selfScore = selfAnswer?.selfAssessmentScore ?? 0;
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

      // D-confirmation rule: if user said D (score 3) but got micro-check wrong,
      // cap at C (score 2)
      if (selfScore === 3 && !microAnswer.microCheckCorrect) {
        finalScore = 2;
        adjustment = -1;
      }
    }

    // Clamp 0-3
    finalScore = Math.max(0, Math.min(3, finalScore));

    return {
      domain,
      domainLabel: DOMAIN_LABELS[domain],
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
