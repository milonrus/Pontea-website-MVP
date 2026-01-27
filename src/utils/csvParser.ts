import Papa from 'papaparse';
import { QuestionModel, QuestionDifficulty, OptionId, ParsedQuestion } from '@/types';

interface CSVRow {
  subjectId: string;
  topicId?: string;
  difficulty: string;
  tags: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string;
  correctAnswer: string;
  explanation: string;
}

interface LearnWorldsCSVRow {
  Group: string;
  Type: string;
  Question: string;
  CorrectAns: string;
  Answer1: string;
  Answer2: string;
  Answer3: string;
  Answer4: string;
  Answer5: string;
  CorrectExplanation: string;
  IncorrectExplanation: string;
}

export const parseQuestionsCSV = (file: File): Promise<ParsedQuestion[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const questions: ParsedQuestion[] = results.data.map((row, index) => {
          const errors: string[] = [];

          // Validation
          if (!row.subjectId?.trim()) errors.push('Missing subjectId');
          if (!row.questionText?.trim()) errors.push('Missing questionText');
          if (!row.optionA?.trim()) errors.push('Missing optionA');
          if (!row.optionB?.trim()) errors.push('Missing optionB');
          if (!row.optionC?.trim()) errors.push('Missing optionC');
          if (!row.optionD?.trim()) errors.push('Missing optionD');

          // Build options array including E if present
          const options = [
            { id: 'a', text: row.optionA?.trim() || '' },
            { id: 'b', text: row.optionB?.trim() || '' },
            { id: 'c', text: row.optionC?.trim() || '' },
            { id: 'd', text: row.optionD?.trim() || '' },
            ...(row.optionE?.trim() ? [{ id: 'e', text: row.optionE.trim() }] : [])
          ].filter(opt => opt.text);

          // Validate 4-5 options
          if (options.length < 4) errors.push('At least 4 options required');
          if (options.length > 5) errors.push('Maximum 5 options allowed');

          // Validate correctAnswer against actual options present
          const validOptionIds = options.map(o => o.id);
          const correctAnswer = row.correctAnswer?.toLowerCase().trim();
          if (!validOptionIds.includes(correctAnswer as any)) {
            errors.push(`Invalid correctAnswer (must be one of: ${validOptionIds.join(', ')})`);
          }
          
          const difficulty = row.difficulty?.toLowerCase().trim() as QuestionDifficulty;
          if (!['easy', 'medium', 'hard'].includes(difficulty)) {
            errors.push('Invalid difficulty (must be easy, medium, or hard)');
          }
          
          const rawTopicId = row.topicId?.trim();
          const normalizedTopicId =
            rawTopicId && rawTopicId.toLowerCase() !== 'general' ? rawTopicId : null;

          return {
            rowNumber: index + 2, // +2 accounting for header row and 0-based index
            data: {
              subjectId: row.subjectId?.trim(),
              topicId: normalizedTopicId,
              difficulty: difficulty || 'medium',
              tags: row.tags ? row.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
              questionText: row.questionText?.trim(),
              questionImageUrl: null,
              options,
              correctAnswer: correctAnswer as OptionId,
              explanation: row.explanation?.trim() || 'No explanation provided.',
              explanationImageUrl: null,
              isActive: true,
              stats: { totalAttempts: 0, totalTimeSpent: 0, correctCount: 0 }
            },
            isValid: errors.length === 0,
            errors
          };
        });
        
        resolve(questions);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export const parseLearnWorldsCSV = async (
  file: File,
  defaultSubjectId: string,
  defaultTopicId: string | null = null
): Promise<ParsedQuestion[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse<LearnWorldsCSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const questions: ParsedQuestion[] = [];

        for (const [index, row] of results.data.entries()) {
          const errors: string[] = [];

          // Validation
          if (!row.Question?.trim()) errors.push('Missing Question');
          if (!row.Answer1?.trim()) errors.push('Missing Answer1');
          if (!row.Answer2?.trim()) errors.push('Missing Answer2');
          if (!row.Answer3?.trim()) errors.push('Missing Answer3');
          if (!row.Answer4?.trim()) errors.push('Missing Answer4');
          if (!row.Answer5?.trim()) errors.push('Missing Answer5');

          // Map numeric answer (1-5) to letter (a-e)
          if (!row.CorrectAns?.trim()) {
            errors.push('Missing CorrectAns');
          }

          const numericAnswer = parseInt(row.CorrectAns?.trim() || '');
          const answerMap: Record<number, OptionId> = { 1: 'a', 2: 'b', 3: 'c', 4: 'd', 5: 'e' };
          let correctAnswer: OptionId | undefined = answerMap[numericAnswer];

          if (!correctAnswer || isNaN(numericAnswer) || numericAnswer < 1 || numericAnswer > 5) {
            errors.push('Invalid CorrectAns (must be 1, 2, 3, 4, or 5)');
            correctAnswer = undefined;
          }

          // Combine explanations
          const correctExpl = row.CorrectExplanation?.trim();
          const incorrectExpl = row.IncorrectExplanation?.trim();
          let explanation = 'No explanation provided.';

          if (correctExpl && incorrectExpl) {
            explanation = `Correct: ${correctExpl} | Incorrect: ${incorrectExpl}`;
          } else if (correctExpl) {
            explanation = correctExpl;
          } else if (incorrectExpl) {
            explanation = incorrectExpl;
          }

          // Build tags array
          const tags: string[] = [];
          if (row.Group?.trim()) tags.push(`group:${row.Group.trim()}`);
          if (row.Type?.trim()) tags.push(`type:${row.Type.trim()}`);

          // Build options array from 5 answers, filter out empty ones
          const allOptions = [
            { id: 'a' as OptionId, text: row.Answer1?.trim() || '' },
            { id: 'b' as OptionId, text: row.Answer2?.trim() || '' },
            { id: 'c' as OptionId, text: row.Answer3?.trim() || '' },
            { id: 'd' as OptionId, text: row.Answer4?.trim() || '' },
            { id: 'e' as OptionId, text: row.Answer5?.trim() || '' }
          ];

          // Filter out empty options
          const options = allOptions.filter(opt => opt.text);

          // Validate that correctAnswer matches an actual non-empty option
          if (correctAnswer && !options.some(opt => opt.id === correctAnswer)) {
            errors.push(`CorrectAns (${numericAnswer}) points to an empty option`);
            correctAnswer = undefined;
          }

          // Validate we have 4-5 options
          if (options.length < 4) {
            errors.push('At least 4 non-empty options required');
          }
          if (options.length > 5) {
            errors.push('Maximum 5 options allowed');
          }

          // AI-detect difficulty (placeholder - will be filled in by API call)
          const difficulty = 'medium' as QuestionDifficulty; // Temporary default

          // Use correctAnswer if valid, otherwise use first option (for invalid rows)
          const finalCorrectAnswer = (correctAnswer || options[0]?.id || 'a') as OptionId;

          questions.push({
            rowNumber: index + 2,
            data: {
              subjectId: defaultSubjectId,
              topicId: defaultTopicId,
              difficulty,
              tags,
              questionText: row.Question?.trim() || '',
              questionImageUrl: null,
              options,
              correctAnswer: finalCorrectAnswer,
              explanation,
              explanationImageUrl: null,
              isActive: true,
              stats: { totalAttempts: 0, totalTimeSpent: 0, correctCount: 0 }
            },
            isValid: errors.length === 0 && correctAnswer !== undefined,
            errors,
            sourceFormat: 'learnworlds',
            metadata: {
              originalGroup: row.Group?.trim(),
              questionType: row.Type?.trim()
            }
          });
        }

        resolve(questions);
      },
      error: (error) => reject(error)
    });
  });
};
