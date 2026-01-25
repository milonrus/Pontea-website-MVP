'use client';

import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, Settings, Clock, List } from 'lucide-react';
import Button from '@/components/shared/Button';
import { TestTemplate, TestSection, QuestionDifficulty } from '@/types';

interface TestBuilderProps {
  onSave: (template: Partial<TestTemplate>) => void;
  initialTemplate?: TestTemplate;
  isLoading?: boolean;
}

interface SectionConfig {
  id: string;
  name: string;
  description: string;
  timeLimitMinutes: number;
  questionCount: number;
  subjectId: string;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export const TestBuilder: React.FC<TestBuilderProps> = ({
  onSave,
  initialTemplate,
  isLoading = false
}) => {
  const [name, setName] = useState(initialTemplate?.name || '');
  const [description, setDescription] = useState(initialTemplate?.description || '');
  const [totalTimeMinutes, setTotalTimeMinutes] = useState(initialTemplate?.totalTimeMinutes || 60);
  const [sections, setSections] = useState<SectionConfig[]>(() => {
    if (initialTemplate?.sections) {
      return initialTemplate.sections.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description || '',
        timeLimitMinutes: s.timeLimitMinutes || 15,
        questionCount: s.questionCount,
        subjectId: s.subjectId || 'all',
        difficultyDistribution: {
          easy: s.difficultyDistribution?.easy ?? 30,
          medium: s.difficultyDistribution?.medium ?? 50,
          hard: s.difficultyDistribution?.hard ?? 20
        }
      }));
    }
    return [];
  });

  const addSection = () => {
    setSections([
      ...sections,
      {
        id: `temp-${Date.now()}`,
        name: `Section ${sections.length + 1}`,
        description: '',
        timeLimitMinutes: 15,
        questionCount: 10,
        subjectId: 'all',
        difficultyDistribution: { easy: 30, medium: 50, hard: 20 }
      }
    ]);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const updateSection = (index: number, updates: Partial<SectionConfig>) => {
    setSections(sections.map((section, i) =>
      i === index ? { ...section, ...updates } : section
    ));
  };

  const handleSave = () => {
    onSave({
      name,
      description,
      totalTimeMinutes,
      sections: sections.map((s, index) => ({
        id: s.id.startsWith('temp-') ? '' : s.id,
        templateId: initialTemplate?.id || '',
        name: s.name,
        description: s.description,
        timeLimitMinutes: s.timeLimitMinutes,
        questionCount: s.questionCount,
        subjectId: s.subjectId,
        difficultyDistribution: s.difficultyDistribution,
        orderIndex: index
      }))
    });
  };

  const totalQuestions = sections.reduce((sum, s) => sum + s.questionCount, 0);
  const totalSectionTime = sections.reduce((sum, s) => sum + s.timeLimitMinutes, 0);

  return (
    <div className="space-y-6">
      {/* Test Details */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Test Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Architecture Mock Test 1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Time (minutes)
            </label>
            <input
              type="number"
              value={totalTimeMinutes}
              onChange={e => setTotalTimeMinutes(parseInt(e.target.value) || 0)}
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the test purpose and format..."
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <List className="w-4 h-4" />
            <span>{totalQuestions} questions</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{totalSectionTime} min (sections)</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{sections.length} sections</span>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Test Sections</h3>
          <Button variant="outline" size="sm" onClick={addSection}>
            <Plus className="w-4 h-4 mr-1" />
            Add Section
          </Button>
        </div>

        {sections.length === 0 ? (
          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
            <p className="text-gray-500 mb-4">No sections added yet.</p>
            <Button variant="outline" onClick={addSection}>
              <Plus className="w-4 h-4 mr-1" />
              Add First Section
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((section, index) => (
              <div
                key={section.id}
                className="bg-white p-5 rounded-xl border border-gray-200"
              >
                <div className="flex items-start gap-3">
                  <div className="text-gray-400 cursor-move">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Section Name
                        </label>
                        <input
                          type="text"
                          value={section.name}
                          onChange={e => updateSection(index, { name: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Questions
                        </label>
                        <input
                          type="number"
                          value={section.questionCount}
                          onChange={e => updateSection(index, { questionCount: parseInt(e.target.value) || 0 })}
                          min="1"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Time Limit (min)
                        </label>
                        <input
                          type="number"
                          value={section.timeLimitMinutes}
                          onChange={e => updateSection(index, { timeLimitMinutes: parseInt(e.target.value) || 0 })}
                          min="1"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        />
                      </div>
                    </div>

                    {/* Difficulty Distribution */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-2">
                        Difficulty Distribution
                      </label>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-green-600">Easy</span>
                          <input
                            type="number"
                            value={section.difficultyDistribution.easy}
                            onChange={e => updateSection(index, {
                              difficultyDistribution: { ...section.difficultyDistribution, easy: parseInt(e.target.value) || 0 }
                            })}
                            min="0"
                            max="100"
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary/50"
                          />
                          <span className="text-xs text-gray-400">%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-yellow-600">Medium</span>
                          <input
                            type="number"
                            value={section.difficultyDistribution.medium}
                            onChange={e => updateSection(index, {
                              difficultyDistribution: { ...section.difficultyDistribution, medium: parseInt(e.target.value) || 0 }
                            })}
                            min="0"
                            max="100"
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary/50"
                          />
                          <span className="text-xs text-gray-400">%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-600">Hard</span>
                          <input
                            type="number"
                            value={section.difficultyDistribution.hard}
                            onChange={e => updateSection(index, {
                              difficultyDistribution: { ...section.difficultyDistribution, hard: parseInt(e.target.value) || 0 }
                            })}
                            min="0"
                            max="100"
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary/50"
                          />
                          <span className="text-xs text-gray-400">%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => removeSection(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleSave}
          isLoading={isLoading}
          disabled={!name || sections.length === 0}
        >
          {initialTemplate ? 'Update Test' : 'Create Test'}
        </Button>
      </div>
    </div>
  );
};

export default TestBuilder;
