import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/shared/Header';
import Button from '@/components/shared/Button';
import { createQuestion, getQuestion, updateQuestion, getSubjects, getTopics } from '@/lib/db';
import { QuestionModel, SubjectModel, TopicModel, QuestionDifficulty, OptionId } from '@/types';
import LaTeXRenderer from '@/components/shared/LaTeXRenderer';
import ImageUpload from '@/components/shared/ImageUpload';
import { ArrowLeft, Save, AlertTriangle, ToggleLeft, ToggleRight, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const isUuid = (value?: string) =>
    !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const QuestionFormPage: React.FC = () => {
  const params = useParams();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const router = useRouter();
  const isEdit = !!id;
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<SubjectModel[]>([]);
  const [topics, setTopics] = useState<TopicModel[]>([]);
  const [error, setError] = useState('');
  const [usingFallbackSubjects, setUsingFallbackSubjects] = useState(false);
  
  const GENERAL_TOPIC_VALUE = 'general';

  const [formData, setFormData] = useState<Partial<QuestionModel>>({
    difficulty: 'medium',
    isActive: true,
    topicId: null,
    options: [
        { id: 'a', text: '' },
        { id: 'b', text: '' },
        { id: 'c', text: '' },
        { id: 'd', text: '' },
    ],
    correctAnswer: 'a',
    tags: []
  });

  // Parse Mode state
  const [parseMode, setParseMode] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsePreview, setParsePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const parseInputRef = useRef<HTMLInputElement>(null);

  // Parse image handler
  const handleParseImage = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG or JPG)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }

    setError('');
    setIsParsing(true);

    // Create preview
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setParsePreview(dataUrl);

      try {
        // Get auth token
        const { data: { session } } = await (await import('@/lib/supabase/client')).supabase.auth.getSession();
        if (!session?.access_token) {
          setError('You must be signed in to use Parse Mode');
          setIsParsing(false);
          setParsePreview(null);
          return;
        }

        const response = await fetch('/api/admin/questions/parse', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ imageDataUrl: dataUrl })
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Failed to parse image. Please try again or enter manually.');
          setIsParsing(false);
          setParsePreview(null);
          return;
        }

        // Update form with parsed data
        const parsed = data.question;
        setFormData(prev => ({
          ...prev,
          questionText: parsed.questionText || prev.questionText,
          options: parsed.options || prev.options,
          correctAnswer: parsed.correctAnswer || prev.correctAnswer,
          explanation: parsed.explanation || prev.explanation
        }));

        setParsePreview(null);
      } catch (err: any) {
        setError('Failed to parse image. Please try again or enter manually.');
        setParsePreview(null);
      } finally {
        setIsParsing(false);
        if (parseInputRef.current) {
          parseInputRef.current.value = '';
        }
      }
    };

    reader.readAsDataURL(file);
  };

  const handleParseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleParseImage(file);
  };

  const handleParseDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleParseImage(file);
  };

  // Fetch initial data
  useEffect(() => {
    const init = async () => {
        try {
            const subs = await getSubjects();
            if (subs.length > 0) {
              setSubjects(subs);
              setUsingFallbackSubjects(false);
            } else {
               setUsingFallbackSubjects(true);
               setSubjects([
                   { id: 'math', name: 'Mathematics', order: 1, createdAt: null as any },
                   { id: 'physics', name: 'Physics', order: 2, createdAt: null as any },
                   { id: 'logic', name: 'Logical Reasoning', order: 3, createdAt: null as any },
                   { id: 'history', name: 'Knowledge & History', order: 4, createdAt: null as any },
                   { id: 'drawing', name: 'Drawing & Representation', order: 5, createdAt: null as any },
                   { id: 'reading', name: 'Reading Comprehension', order: 6, createdAt: null as any },
               ]);
            }
        } catch (e) {
            console.warn("Using fallback subjects due to error:", e);
            setUsingFallbackSubjects(true);
            setSubjects([
                { id: 'math', name: 'Mathematics', order: 1, createdAt: null as any },
                { id: 'physics', name: 'Physics', order: 2, createdAt: null as any },
                { id: 'logic', name: 'Logical Reasoning', order: 3, createdAt: null as any },
                { id: 'history', name: 'Knowledge & History', order: 4, createdAt: null as any },
                { id: 'drawing', name: 'Drawing & Representation', order: 5, createdAt: null as any },
                { id: 'reading', name: 'Reading Comprehension', order: 6, createdAt: null as any },
            ]);
        }
        
        if (isEdit && id) {
            try {
                const q = await getQuestion(id);
                if (q) setFormData(q);
            } catch (e: any) {
                setError(`Failed to load question: ${e.message}`);
            }
        }
    };
    init();
  }, [id, isEdit]);

  // Fetch topics when subject changes
  useEffect(() => {
    if (formData.subjectId) {
        getTopics(formData.subjectId)
          .then(setTopics)
          .catch(err => console.log("No topics loaded", err));
    } else {
        setTopics([]);
    }
  }, [formData.subjectId]);

  const handleOptionChange = (id: OptionId, text: string) => {
    const newOptions = formData.options?.map(o => o.id === id ? { ...o, text } : o);
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
        // Basic validation
        if (!formData.questionText || !formData.subjectId) {
            setError("Please fill in the Question Text and select a Subject.");
            setLoading(false);
            return;
        }

        if (!currentUser?.id) {
            setError("You must be signed in to save questions.");
            setLoading(false);
            return;
        }

        if (usingFallbackSubjects || !isUuid(formData.subjectId)) {
            setError("Subjects must come from the database. Create subjects in Admin > Subjects, then try again.");
            setLoading(false);
            return;
        }

        if (formData.topicId && !isUuid(formData.topicId)) {
            setError("Topics must come from the database. Create topics or select General.");
            setLoading(false);
            return;
        }

        // Sanitize payload
        const payload: any = {
            subjectId: formData.subjectId,
            topicId: formData.topicId ?? null,
            tags: formData.tags || [],
            difficulty: formData.difficulty || 'medium',
            questionText: formData.questionText,
            questionImageUrl: formData.questionImageUrl || null,
            options: formData.options,
            correctAnswer: formData.correctAnswer,
            explanation: formData.explanation || '',
            explanationImageUrl: formData.explanationImageUrl || null,
            isActive: formData.isActive !== undefined ? formData.isActive : true,
            createdBy: isEdit ? (formData.createdBy || currentUser.id) : currentUser.id,
        };

        if (isEdit && id) {
            await updateQuestion(id, payload);
        } else {
            await createQuestion(payload);
        }
        router.push('/admin');
    } catch (err: any) {
        console.error(err);
        // Show the actual error message from Firestore
        setError(`Error saving question: ${err.message || "Unknown error"}. Check your permissions.`);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        
        <div className="flex items-center gap-4 mb-8">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Question' : 'New Question'}</h1>
        </div>

        {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                    <h3 className="font-bold">Something went wrong</h3>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        )}

        {/* Parse Mode Toggle */}
        <div className="mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setParseMode(!parseMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                parseMode ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {parseMode ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              <span className="font-medium text-sm">Parse Mode</span>
            </button>
            <span className="text-xs text-gray-400">
              {parseMode ? 'Upload a screenshot to auto-fill question fields' : 'Toggle to enable image parsing'}
            </span>
          </div>

          {/* Parse Upload Zone */}
          {parseMode && (
            <div className="mt-4">
              <div
                onClick={() => !isParsing && parseInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleParseDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isParsing || isDragging
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-gray-300 hover:border-primary/50 hover:bg-gray-50 cursor-pointer'
                } ${isParsing ? 'cursor-not-allowed' : ''}`}
              >
                {isParsing ? (
                  <div className="flex flex-col items-center gap-3">
                    {parsePreview && (
                      <img src={parsePreview} alt="Parsing..." className="w-32 h-32 object-contain rounded-lg border border-gray-200" />
                    )}
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      <span className="text-sm text-gray-600">Parsing image...</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-gray-100 rounded-full">
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Drag & drop a screenshot here</p>
                      <p className="text-xs text-gray-500">or click to browse (PNG, JPG up to 5MB)</p>
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={parseInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleParseFileChange}
                className="hidden"
              />
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
            {/* FORM COLUMN */}
            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <fieldset disabled={isParsing} className={`space-y-6 ${isParsing ? 'opacity-50' : ''}`}>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            value={formData.subjectId || ''}
                            onChange={e => setFormData({...formData, subjectId: e.target.value, topicId: null})}
                            required
                        >
                            <option value="">Select Subject...</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            value={formData.topicId ?? GENERAL_TOPIC_VALUE}
                            onChange={e =>
                              setFormData({
                                ...formData,
                                topicId: e.target.value === GENERAL_TOPIC_VALUE ? null : e.target.value
                              })
                            }
                            disabled={!formData.subjectId}
                        >
                             <option value={GENERAL_TOPIC_VALUE}>General (no topic)</option>
                             {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                    <div className="flex gap-4">
                        {['easy', 'medium', 'hard'].map(d => (
                            <label key={d} className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="difficulty" 
                                    value={d}
                                    checked={formData.difficulty === d}
                                    onChange={e => setFormData({...formData, difficulty: e.target.value as QuestionDifficulty})}
                                    className="text-primary focus:ring-primary"
                                />
                                <span className="capitalize text-sm">{d}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Text (supports LaTeX via $...$) *</label>
                    <textarea 
                        className="w-full border border-gray-300 rounded-lg p-3 min-h-[120px] focus:ring-2 focus:ring-primary focus:border-primary outline-none font-mono text-sm"
                        value={formData.questionText || ''}
                        onChange={e => setFormData({...formData, questionText: e.target.value})}
                        required
                        placeholder="e.g. Solve for $x$ in $x^2 + 2x + 1 = 0$"
                    />
                </div>

                <ImageUpload
                    currentUrl={formData.questionImageUrl}
                    onUpload={url => setFormData({ ...formData, questionImageUrl: url })}
                    folder="questions"
                    label="Question Image"
                />

                <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Options *</label>
                    {formData.options?.map((opt) => (
                        <div key={opt.id} className="flex gap-2 items-center">
                            <div className="flex items-center h-full">
                                <input 
                                    type="radio"
                                    name="correctAnswer"
                                    checked={formData.correctAnswer === opt.id}
                                    onChange={() => setFormData({...formData, correctAnswer: opt.id})}
                                    className="w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                                />
                            </div>
                            <span className="font-bold w-6 uppercase text-gray-500 text-center">{opt.id}</span>
                            <input 
                                type="text"
                                className="flex-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                value={opt.text}
                                onChange={e => handleOptionChange(opt.id, e.target.value)}
                                required
                                placeholder={`Option ${opt.id.toUpperCase()}`}
                            />
                        </div>
                    ))}
                    <p className="text-xs text-gray-400 pl-8">Select the radio button next to the correct answer.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
                    <textarea 
                        className="w-full border border-gray-300 rounded-lg p-3 min-h-[100px] focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        value={formData.explanation || ''}
                        onChange={e => setFormData({...formData, explanation: e.target.value})}
                        placeholder="Explain why the answer is correct..."
                    />
                </div>

                <ImageUpload
                    currentUrl={formData.explanationImageUrl}
                    onUpload={url => setFormData({ ...formData, explanationImageUrl: url })}
                    folder="explanations"
                    label="Explanation Image"
                />
              </fieldset>

                <div className="pt-4 border-t border-gray-100">
                    <Button type="submit" isLoading={loading || isParsing} className="w-full flex justify-center items-center gap-2 shadow-lg shadow-primary/20">
                        <Save className="w-4 h-4" />
                        Save Question
                    </Button>
                </div>

            </form>

            {/* PREVIEW COLUMN */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-32">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Live Preview</h3>
                    
                    <div className="prose max-w-none mb-6">
                        {formData.questionText ? (
                            <LaTeXRenderer text={formData.questionText} className="text-lg font-medium text-gray-900" />
                        ) : (
                            <span className="text-gray-300 italic">Question text will appear here...</span>
                        )}
                    </div>

                    {formData.questionImageUrl && (
                        <img
                            src={formData.questionImageUrl}
                            alt="Question"
                            className="w-full max-h-60 object-contain rounded-lg border border-gray-200 bg-gray-50 mb-6"
                        />
                    )}

                    <div className="space-y-3">
                        {formData.options?.map(opt => (
                            <div 
                                key={opt.id} 
                                className={`p-3 rounded-lg border flex gap-3 transition-colors ${
                                    formData.correctAnswer === opt.id ? 'border-green-200 bg-green-50' : 'border-gray-100'
                                }`}
                            >
                                <span className="font-bold text-gray-500 uppercase">{opt.id}</span>
                                <div className="flex-1">
                                    {opt.text ? <LaTeXRenderer text={opt.text} /> : <span className="text-gray-300 text-sm">Empty option</span>}
                                </div>
                                {formData.correctAnswer === opt.id && <span className="ml-auto text-xs text-green-600 font-bold px-2 py-0.5 bg-green-100 rounded self-start">Correct</span>}
                            </div>
                        ))}
                    </div>

                    {(formData.explanation || formData.explanationImageUrl) && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-900 border border-blue-100">
                            <span className="font-bold block mb-1 flex items-center gap-1 text-primary"><span className="w-1.5 h-1.5 rounded-full bg-accent"></span> Explanation:</span>
                            {formData.explanation ? (
                                <LaTeXRenderer text={formData.explanation} />
                            ) : (
                                <span className="text-blue-400 italic">No explanation text</span>
                            )}
                            {formData.explanationImageUrl && (
                                <img
                                    src={formData.explanationImageUrl}
                                    alt="Explanation"
                                    className="w-full max-h-60 object-contain rounded-lg border border-blue-100 bg-white mt-4"
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>

      </main>
    </div>
  );
};

export default QuestionFormPage;
