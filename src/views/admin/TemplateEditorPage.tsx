import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/shared/Header';
import Button from '@/components/shared/Button';
import { supabase } from '@/lib/supabase/client';
import { QuestionModel } from '@/types';
import {
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Clock,
  Search,
  X,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check
} from 'lucide-react';
import LaTeXRenderer from '@/components/shared/LaTeXRenderer';

interface SectionData {
  id?: string;
  name: string;
  timeLimitSeconds?: number;
  questionIds: string[];
  isExpanded?: boolean;
}

interface TemplateData {
  name: string;
  description: string;
  timeLimitSeconds?: number;
  sections: SectionData[];
}

const TemplateEditorPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const templateId = params?.id as string;
  const isNew = templateId === 'new';

  const [template, setTemplate] = useState<TemplateData>({
    name: '',
    description: '',
    timeLimitSeconds: undefined,
    sections: []
  });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Question picker state
  const [showQuestionPicker, setShowQuestionPicker] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuestionModel[]>([]);
  const [questionSearch, setQuestionSearch] = useState('');
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  };

  const fetchTemplate = useCallback(async () => {
    if (isNew) return;

    setLoading(true);
    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/admin/templates/${templateId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Template not found');
      }

      const data = await response.json();
      setTemplate({
        name: data.template.name,
        description: data.template.description || '',
        timeLimitSeconds: data.template.timeLimitSeconds,
        sections: data.template.sections.map((s: any) => ({
          id: s.id,
          name: s.name,
          timeLimitSeconds: s.timeLimitSeconds,
          questionIds: s.questionIds || [],
          isExpanded: false
        }))
      });
    } catch (err) {
      console.error('Error fetching template:', err);
      setError('Failed to load template');
    } finally {
      setLoading(false);
    }
  }, [templateId, isNew]);

  useEffect(() => {
    fetchTemplate();
  }, [fetchTemplate]);

  const fetchQuestions = async (search: string = '') => {
    setLoadingQuestions(true);
    try {
      const token = await getAuthToken();
      const params = new URLSearchParams({ limit: '100' });
      if (search) params.append('search', search);

      const response = await fetch(`/api/admin/questions?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Transform from snake_case to camelCase
        const transformed = data.questions.map((q: any) => ({
          id: q.id,
          questionText: q.question_text,
          subjectId: q.subject_id,
          topicId: q.topic_id,
          difficulty: q.difficulty,
          options: q.options,
          correctAnswer: q.correct_answer,
          explanation: q.explanation,
          tags: q.tags || [],
          isActive: q.is_active,
          createdAt: q.created_at
        }));
        setQuestions(transformed);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (showQuestionPicker !== null) {
      fetchQuestions(questionSearch);
    }
  }, [showQuestionPicker, questionSearch]);

  const handleSave = async () => {
    if (!template.name.trim()) {
      setError('Template name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const token = await getAuthToken();
      const payload = {
        name: template.name,
        description: template.description || null,
        timeLimitSeconds: template.timeLimitSeconds || null,
        sections: template.sections.map((s, index) => ({
          name: s.name,
          timeLimitSeconds: s.timeLimitSeconds || null,
          questionIds: s.questionIds
        }))
      };

      const url = isNew
        ? '/api/admin/templates'
        : `/api/admin/templates/${templateId}`;

      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save template');
      }

      router.push('/admin/templates');
    } catch (err: any) {
      console.error('Error saving template:', err);
      setError(err.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    setTemplate(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          name: `Section ${prev.sections.length + 1}`,
          questionIds: [],
          isExpanded: true
        }
      ]
    }));
  };

  const removeSection = (index: number) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  };

  const updateSection = (index: number, updates: Partial<SectionData>) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.map((s, i) =>
        i === index ? { ...s, ...updates } : s
      )
    }));
  };

  const toggleSectionExpanded = (index: number) => {
    updateSection(index, { isExpanded: !template.sections[index].isExpanded });
  };

  const openQuestionPicker = (sectionIndex: number) => {
    const section = template.sections[sectionIndex];
    setSelectedQuestionIds(new Set(section.questionIds));
    setShowQuestionPicker(sectionIndex);
    setQuestionSearch('');
  };

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestionIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const confirmQuestionSelection = () => {
    if (showQuestionPicker !== null) {
      updateSection(showQuestionPicker, {
        questionIds: Array.from(selectedQuestionIds)
      });
      setShowQuestionPicker(null);
    }
  };

  const removeQuestionFromSection = (sectionIndex: number, questionId: string) => {
    const section = template.sections[sectionIndex];
    updateSection(sectionIndex, {
      questionIds: section.questionIds.filter(id => id !== questionId)
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/templates')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isNew ? 'Create Template' : 'Edit Template'}
              </h1>
              <p className="text-gray-500">
                Configure test structure and questions.
              </p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Template Name *
              </label>
              <input
                type="text"
                value={template.name}
                onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="e.g., Full Practice Test"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={template.description}
                onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                rows={2}
                placeholder="Brief description of this test template"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Overall Time Limit (minutes)
                </div>
              </label>
              <input
                type="number"
                value={template.timeLimitSeconds ? template.timeLimitSeconds / 60 : ''}
                onChange={(e) => setTemplate(prev => ({
                  ...prev,
                  timeLimitSeconds: e.target.value ? parseInt(e.target.value) * 60 : undefined
                }))}
                className="w-32 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="Optional"
                min={1}
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for no overall time limit (section timers still apply)
              </p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Sections</h2>
            <Button variant="outline" size="sm" onClick={addSection}>
              <Plus className="w-4 h-4 mr-2" /> Add Section
            </Button>
          </div>

          {template.sections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No sections added yet.</p>
              <p className="text-sm">Click "Add Section" to create your first section.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {template.sections.map((section, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Section Header */}
                  <div
                    className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
                    onClick={() => toggleSectionExpanded(index)}
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <div>
                        <span className="font-medium text-gray-900">
                          {section.name || `Section ${index + 1}`}
                        </span>
                        <span className="ml-3 text-sm text-gray-500">
                          {section.questionIds.length} questions
                          {section.timeLimitSeconds && (
                            <> | {section.timeLimitSeconds / 60}m</>
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSection(index);
                        }}
                        className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {section.isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Section Content */}
                  {section.isExpanded && (
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Section Name
                          </label>
                          <input
                            type="text"
                            value={section.name}
                            onChange={(e) => updateSection(index, { name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                            placeholder="Section name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Time Limit (minutes)
                          </label>
                          <input
                            type="number"
                            value={section.timeLimitSeconds ? section.timeLimitSeconds / 60 : ''}
                            onChange={(e) => updateSection(index, {
                              timeLimitSeconds: e.target.value ? parseInt(e.target.value) * 60 : undefined
                            })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                            placeholder="Optional"
                            min={1}
                          />
                        </div>
                      </div>

                      {/* Questions in section */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Questions ({section.questionIds.length})
                          </label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openQuestionPicker(index)}
                          >
                            <Plus className="w-4 h-4 mr-1" /> Add Questions
                          </Button>
                        </div>

                        {section.questionIds.length === 0 ? (
                          <div className="text-center py-4 text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
                            No questions added
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {section.questionIds.map((qId, qIndex) => (
                              <div
                                key={qId}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                              >
                                <span className="text-gray-600">
                                  {qIndex + 1}. Question {qId.slice(0, 8)}...
                                </span>
                                <button
                                  onClick={() => removeQuestionFromSection(index, qId)}
                                  className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Question Picker Modal */}
        {showQuestionPicker !== null && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Select Questions for {template.sections[showQuestionPicker].name}
                </h3>
                <button
                  onClick={() => setShowQuestionPicker(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Search questions..."
                  />
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {selectedQuestionIds.size} questions selected
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {loadingQuestions ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </div>
                ) : questions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No questions found
                  </div>
                ) : (
                  <div className="space-y-2">
                    {questions.map((q) => (
                      <div
                        key={q.id}
                        onClick={() => toggleQuestionSelection(q.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedQuestionIds.has(q.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center mt-0.5 ${
                            selectedQuestionIds.has(q.id)
                              ? 'bg-primary border-primary text-white'
                              : 'border-gray-300'
                          }`}>
                            {selectedQuestionIds.has(q.id) && (
                              <Check className="w-3 h-3" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-900 line-clamp-2">
                              <LaTeXRenderer text={q.questionText} />
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {q.difficulty}
                              </span>
                              {q.tags?.slice(0, 2).map(tag => (
                                <span key={tag} className="text-xs text-gray-400">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowQuestionPicker(null)}
                >
                  Cancel
                </Button>
                <Button onClick={confirmQuestionSelection}>
                  Add {selectedQuestionIds.size} Questions
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TemplateEditorPage;
