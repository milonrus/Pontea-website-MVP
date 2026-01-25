'use client';

import React, { useState, useEffect } from 'react';
import { BrainCircuit, Sliders, Target, Zap } from 'lucide-react';
import Button from '@/components/shared/Button';
import { SubjectModel, QuestionDifficulty } from '@/types';
import { getSubjects } from '@/lib/db';

interface PracticeSetupProps {
  onStart: (config: PracticeConfig) => void;
  isLoading?: boolean;
  error?: string;
}

export interface PracticeConfig {
  subjectId: string;
  topicId?: string;
  difficulty: QuestionDifficulty | 'any';
  count: number;
}

const difficultyOptions = [
  { value: 'any', label: 'Any', icon: Zap },
  { value: 'easy', label: 'Easy', icon: Target },
  { value: 'medium', label: 'Medium', icon: BrainCircuit },
  { value: 'hard', label: 'Hard', icon: Zap }
] as const;

const questionCounts = [5, 10, 15, 20, 25, 30, 40, 50];

export const PracticeSetup: React.FC<PracticeSetupProps> = ({
  onStart,
  isLoading = false,
  error
}) => {
  const [subjects, setSubjects] = useState<SubjectModel[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [config, setConfig] = useState<PracticeConfig>({
    subjectId: 'all',
    difficulty: 'any',
    count: 10
  });

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const data = await getSubjects();
      setSubjects(data);
    } catch (err) {
      console.error('Error loading subjects:', err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleStart = () => {
    onStart(config);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex justify-center items-center w-14 h-14 bg-primary/10 rounded-full mb-4 text-primary">
          <BrainCircuit className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Practice Session</h1>
        <p className="text-gray-500 mt-2">
          Customize your practice to focus on areas that need improvement.
        </p>
      </div>

      {/* Setup Form */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="space-y-6">
          {/* Subject Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-accent" />
              Subject
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setConfig({ ...config, subjectId: 'all' })}
                className={`
                  py-3 px-4 rounded-lg text-sm font-medium border transition-all
                  ${config.subjectId === 'all'
                    ? 'bg-primary text-white border-primary shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50'
                  }
                `}
              >
                All Subjects
              </button>
              {subjects.map(subject => (
                <button
                  key={subject.id}
                  onClick={() => setConfig({ ...config, subjectId: subject.id })}
                  className={`
                    py-3 px-4 rounded-lg text-sm font-medium border transition-all capitalize
                    ${config.subjectId === subject.id
                      ? 'bg-primary text-white border-primary shadow-md'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50'
                    }
                  `}
                >
                  {subject.name}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Difficulty
            </label>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {difficultyOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setConfig({ ...config, difficulty: option.value as any })}
                  className={`
                    flex-1 py-2.5 text-sm font-medium rounded-md capitalize transition-all
                    ${config.difficulty === option.value
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Number of Questions: <span className="text-primary">{config.count}</span>
            </label>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={config.count}
              onChange={e => setConfig({ ...config, count: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>5</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">
              Quick Presets
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setConfig({ subjectId: 'all', difficulty: 'easy', count: 10 })}
                className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
              >
                Quick Easy (10)
              </button>
              <button
                onClick={() => setConfig({ subjectId: 'all', difficulty: 'medium', count: 20 })}
                className="px-3 py-1.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 transition-colors"
              >
                Standard (20)
              </button>
              <button
                onClick={() => setConfig({ subjectId: 'all', difficulty: 'hard', count: 30 })}
                className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
              >
                Challenge (30)
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {/* Start Button */}
          <Button
            onClick={handleStart}
            fullWidth
            size="lg"
            isLoading={isLoading}
            className="mt-4"
          >
            Start Practice
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PracticeSetup;
