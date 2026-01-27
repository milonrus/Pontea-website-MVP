'use client';

import { useState } from 'react';
import { SubjectModel, TopicModel } from '@/types';
import Button from '@/components/shared/Button';

interface CSVImportConfigProps {
  subjects: SubjectModel[];
  topics: TopicModel[];
  onConfigComplete: (config: {
    defaultSubjectId: string;
    defaultTopicId: string | null;
  }) => void;
  onCancel: () => void;
}

export default function CSVImportConfig({
  subjects,
  topics,
  onConfigComplete,
  onCancel
}: CSVImportConfigProps) {
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');

  const filteredTopics = topics.filter(t => t.subjectId === selectedSubject);

  const handleContinue = () => {
    if (!selectedSubject) return;

    onConfigComplete({
      defaultSubjectId: selectedSubject,
      defaultTopicId: selectedTopic || null
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          LearnWorlds Format Detected
        </h2>
        <p className="text-gray-600">
          Configure default settings for imported questions. Difficulty will be
          automatically detected using AI.
        </p>
      </div>

      <div className="space-y-4">
        {/* Subject Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Subject <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setSelectedTopic('');
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a subject...</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>

        {/* Topic Selection (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Default Topic (Optional)
          </label>
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            disabled={!selectedSubject}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">None (General)</option>
            {filteredTopics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.name}
              </option>
            ))}
          </select>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            Auto-Detection Features:
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Difficulty levels will be analyzed using AI</li>
            <li>✓ Group values will be stored in tags</li>
            <li>✓ Type values will be stored in tags</li>
            <li>✓ All 5 answer options will be imported</li>
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Button onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedSubject}
          className="flex-1"
        >
          Continue to Preview
        </Button>
      </div>
    </div>
  );
}
