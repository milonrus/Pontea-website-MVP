import React, { useState } from 'react';
import { ImageParseItem, ParsedImageQuestion, SubjectModel, TopicModel, QuestionDifficulty } from '@/types';
import { ChevronDown, ChevronUp, Trash2, AlertCircle } from 'lucide-react';
import LaTeXRenderer from '@/components/shared/LaTeXRenderer';
import Button from '@/components/shared/Button';

interface ParsedQuestionEditorProps {
  items: ImageParseItem[];
  subjects: SubjectModel[];
  topics: TopicModel[];
  onItemsChange: (items: ImageParseItem[]) => void;
}

const AutoDetectedBadge: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded ml-2">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z"/>
      </svg>
      Auto-detected
    </span>
  );
};

const ParsedQuestionEditor: React.FC<ParsedQuestionEditorProps> = ({
  items,
  subjects,
  topics,
  onItemsChange
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(items[0]?.id || null);
  const [editingFields, setEditingFields] = useState<Record<string, Record<string, any>>>({});

  const getTopicsForSubject = (subjectId: string | undefined) => {
    if (!subjectId) return [];
    return topics.filter((t) => t.subjectId === subjectId);
  };

  const isQuestionValid = (item: ImageParseItem) => {
    if (!item.parsedQuestion) return false;
    const q = item.parsedQuestion;
    const optionCount = q.options?.length || 0;
    return (
      q.questionText &&
      q.options &&
      optionCount >= 4 &&
      optionCount <= 5 &&
      q.options.every(o => o.text && o.text.trim()) &&
      q.correctAnswer &&
      q.difficulty &&
      q.subjectId
    );
  };

  const handleFieldChange = (itemId: string, field: string, value: any) => {
    const item = items.find((i) => i.id === itemId);
    if (!item || !item.parsedQuestion) return;

    const editing = editingFields[itemId] || {};
    setEditingFields({
      ...editingFields,
      [itemId]: { ...editing, [field]: value }
    });
  };

  const handleSaveField = (itemId: string, field: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item || !item.parsedQuestion) return;

    const editing = editingFields[itemId] || {};
    const value = editing[field];

    if (value === undefined || value === null) {
      const newEditing = { ...editing };
      delete newEditing[field];
      setEditingFields({ ...editingFields, [itemId]: newEditing });
      return;
    }

    const updatedItems = items.map((i) => {
      if (i.id === itemId && i.parsedQuestion) {
        const updates: any = { [field]: value };

        // Clear auto-detection flags when user edits
        if (field === 'subjectId') {
          updates.isSubjectAutoDetected = false;
        } else if (field === 'difficulty') {
          updates.isDifficultyAutoDetected = false;
        }

        return {
          ...i,
          parsedQuestion: {
            ...i.parsedQuestion,
            ...updates
          }
        };
      }
      return i;
    });

    onItemsChange(updatedItems);

    const newEditing = { ...editingFields[itemId] };
    delete newEditing[field];
    setEditingFields({ ...editingFields, [itemId]: newEditing });
  };

  const handleDeleteQuestion = (itemId: string) => {
    onItemsChange(items.filter((i) => i.id !== itemId));
    if (expandedId === itemId) {
      const nextItem = items.find((i) => i.id !== itemId);
      setExpandedId(nextItem?.id || null);
    }
  };

  const getDisplayValue = (item: ImageParseItem, field: string) => {
    const editing = editingFields[item.id] || {};
    if (field in editing) {
      return editing[field];
    }
    return (item.parsedQuestion as any)?.[field];
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No questions to review</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isExpanded = expandedId === item.id;
        const isValid = isQuestionValid(item);
        const subjectId = getDisplayValue(item, 'subjectId');
        const topicsForSubject = getTopicsForSubject(subjectId);

        if (!item.parsedQuestion) {
          return (
            <div key={item.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">Question {index + 1}: Parse failed or not yet parsed</p>
            </div>
          );
        }

        return (
          <div
            key={item.id}
            className={`border rounded-lg transition-all ${
              isValid ? 'border-gray-200 bg-white' : 'border-yellow-200 bg-yellow-50'
            }`}
          >
            {/* Header */}
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 text-left min-w-0">
                <span className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold text-sm">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate line-clamp-1">
                    <LaTeXRenderer text={item.parsedQuestion.questionText || '(No question text)'} />
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs">
                    {!isValid && (
                      <span className="flex items-center gap-1 text-yellow-700">
                        <AlertCircle className="w-3 h-3" /> Incomplete
                      </span>
                    )}
                    {subjectId && (
                      <span className="text-gray-500 flex items-center gap-1">
                        {subjects.find((s) => s.id === subjectId)?.name || 'Unknown'}
                        {item.parsedQuestion?.isSubjectAutoDetected && (
                          <span className="text-blue-500" title="Auto-detected">✨</span>
                        )}
                      </span>
                    )}
                    {item.parsedQuestion.difficulty && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${
                        item.parsedQuestion.difficulty === 'easy'
                          ? 'bg-green-100 text-green-700'
                          : item.parsedQuestion.difficulty === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {item.parsedQuestion.difficulty}
                        {item.parsedQuestion?.isDifficultyAutoDetected && (
                          <span title="Auto-detected">✨</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-gray-200 px-4 py-4 space-y-6 bg-gray-50">
                {/* Question Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Text
                  </label>
                  <textarea
                    value={getDisplayValue(item, 'questionText')}
                    onChange={(e) =>
                      handleFieldChange(item.id, 'questionText', e.target.value)
                    }
                    onBlur={() => handleSaveField(item.id, 'questionText')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    rows={3}
                  />
                  {getDisplayValue(item, 'questionText') && (
                    <div className="mt-2 p-3 bg-white border border-gray-200 rounded text-sm">
                      <p className="text-gray-600 font-medium mb-1">Preview:</p>
                      <LaTeXRenderer text={getDisplayValue(item, 'questionText')} />
                    </div>
                  )}
                </div>

                {/* Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options
                  </label>
                  <div className="space-y-2">
                    {(() => {
                      const currentOptions = getDisplayValue(item, 'options') || [];
                      const optionIds = currentOptions.map((opt: any) => opt.id);
                      return optionIds.map((optionId) => {
                        const opt = currentOptions.find((o: any) => o.id === optionId);
                        return (
                          <div key={optionId} className="flex items-start gap-2">
                            <span className="text-sm font-medium text-gray-700 w-8 flex-shrink-0 mt-2">
                              {optionId.toUpperCase()}.
                            </span>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={opt?.text || ''}
                                onChange={(e) => {
                                  const options = getDisplayValue(item, 'options') || [];
                                  const updated = options.map((o: any) =>
                                    o.id === optionId ? { ...o, text: e.target.value } : o
                                  );
                                  handleFieldChange(item.id, 'options', updated);
                                }}
                                onBlur={() => handleSaveField(item.id, 'options')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                placeholder={`Option ${optionId.toUpperCase()}`}
                              />
                              {opt?.text && (
                                <div className="mt-1 text-xs text-gray-600">
                                  <LaTeXRenderer text={opt.text} />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Correct Answer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correct Answer
                  </label>
                  <select
                    value={getDisplayValue(item, 'correctAnswer') || ''}
                    onChange={(e) =>
                      handleFieldChange(item.id, 'correctAnswer', e.target.value)
                    }
                    onBlur={() => handleSaveField(item.id, 'correctAnswer')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  >
                    <option value="">Select answer...</option>
                    {(() => {
                      const currentOptions = getDisplayValue(item, 'options') || [];
                      return currentOptions.map((opt: any) => (
                        <option key={opt.id} value={opt.id}>
                          Option {opt.id.toUpperCase()}
                        </option>
                      ));
                    })()}
                  </select>
                </div>

                {/* Explanation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Explanation
                  </label>
                  <textarea
                    value={getDisplayValue(item, 'explanation')}
                    onChange={(e) =>
                      handleFieldChange(item.id, 'explanation', e.target.value)
                    }
                    onBlur={() => handleSaveField(item.id, 'explanation')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    rows={2}
                  />
                  {getDisplayValue(item, 'explanation') && (
                    <div className="mt-2 p-3 bg-white border border-gray-200 rounded text-sm">
                      <p className="text-gray-600 font-medium mb-1">Preview:</p>
                      <LaTeXRenderer text={getDisplayValue(item, 'explanation')} />
                    </div>
                  )}
                </div>

                {/* Metadata */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                  <h4 className="font-medium text-gray-900 text-sm">Metadata</h4>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject *
                      <AutoDetectedBadge
                        show={!!item.parsedQuestion?.isSubjectAutoDetected}
                      />
                    </label>
                    <select
                      value={getDisplayValue(item, 'subjectId') || ''}
                      onChange={(e) =>
                        handleFieldChange(item.id, 'subjectId', e.target.value)
                      }
                      onBlur={() => handleSaveField(item.id, 'subjectId')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm ${
                        !getDisplayValue(item, 'subjectId')
                          ? 'border-red-300 bg-red-50'
                          : item.parsedQuestion?.isSubjectAutoDetected
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select subject...</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                    {item.parsedQuestion?.isSubjectAutoDetected && getDisplayValue(item, 'subjectId') && (
                      <p className="text-xs text-blue-600 mt-1">
                        AI detected this subject. You can change it if needed.
                      </p>
                    )}
                  </div>

                  {/* Topic */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Topic (Optional)
                    </label>
                    <select
                      value={getDisplayValue(item, 'topicId') || ''}
                      onChange={(e) =>
                        handleFieldChange(item.id, 'topicId', e.target.value || null)
                      }
                      onBlur={() => handleSaveField(item.id, 'topicId')}
                      disabled={!subjectId}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="">No topic</option>
                      {topicsForSubject.map((topic) => (
                        <option key={topic.id} value={topic.id}>
                          {topic.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty *
                      <AutoDetectedBadge
                        show={!!item.parsedQuestion?.isDifficultyAutoDetected}
                      />
                    </label>
                    <select
                      value={getDisplayValue(item, 'difficulty') || ''}
                      onChange={(e) =>
                        handleFieldChange(item.id, 'difficulty', e.target.value as QuestionDifficulty)
                      }
                      onBlur={() => handleSaveField(item.id, 'difficulty')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm ${
                        !getDisplayValue(item, 'difficulty')
                          ? 'border-red-300 bg-red-50'
                          : item.parsedQuestion?.isDifficultyAutoDetected
                          ? 'border-blue-300 bg-blue-50'
                          : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select difficulty...</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                    {item.parsedQuestion?.isDifficultyAutoDetected && getDisplayValue(item, 'difficulty') && (
                      <p className="text-xs text-blue-600 mt-1">
                        AI detected this difficulty level. You can change it if needed.
                      </p>
                    )}
                  </div>
                </div>

                {/* Delete button */}
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => handleDeleteQuestion(item.id)}
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Question
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <p className="text-sm text-blue-900">
          {items.filter(isQuestionValid).length} of {items.length} questions have all required fields
        </p>
      </div>
    </div>
  );
};

export default ParsedQuestionEditor;
