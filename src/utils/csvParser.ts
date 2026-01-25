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
  correctAnswer: string;
  explanation: string;
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
          
          const correctAnswer = row.correctAnswer?.toLowerCase().trim() as OptionId;
          if (!['a', 'b', 'c', 'd'].includes(correctAnswer)) {
            errors.push('Invalid correctAnswer (must be a, b, c, or d)');
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
              options: [
                { id: 'a', text: row.optionA?.trim() },
                { id: 'b', text: row.optionB?.trim() },
                { id: 'c', text: row.optionC?.trim() },
                { id: 'd', text: row.optionD?.trim() }
              ],
              correctAnswer,
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
