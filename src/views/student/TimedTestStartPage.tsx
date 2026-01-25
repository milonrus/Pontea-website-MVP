import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/shared/Header';
import Button from '@/components/shared/Button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase/client';
import {
  Clock,
  FileText,
  HelpCircle,
  ChevronRight,
  Loader2,
  Timer,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TemplateSection {
  name: string;
  questionCount: number;
  timeLimitSeconds?: number;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  timeLimitSeconds?: number;
  sectionCount: number;
  totalQuestions: number;
  totalSectionTime: number;
  sections: TemplateSection[];
}

const TimedTestStartPage: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startingTest, setStartingTest] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const getAuthToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  };

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getAuthToken();
      const response = await fetch('/api/templates', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load available tests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const formatTime = (seconds?: number) => {
    if (!seconds) return 'No limit';
    const mins = Math.floor(seconds / 60);
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}h ${remainingMins}m`;
    }
    return `${mins} min`;
  };

  const handleStartTest = async (template: Template) => {
    if (!currentUser) return;

    setStartingTest(template.id);
    try {
      const token = await getAuthToken();
      const response = await fetch('/api/test/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          templateId: template.id
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to start test');
      }

      const data = await response.json();
      router.push(`/test/${data.attemptId}?mode=timed`);
    } catch (err: any) {
      console.error('Error starting test:', err);
      setError(err.message || 'Failed to start test');
      setStartingTest(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center mb-8">
          <div className="inline-flex justify-center items-center w-12 h-12 bg-primary/10 rounded-full mb-4 text-primary">
            <Timer className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Timed Tests</h1>
          <p className="text-gray-500">Select a test to begin your timed assessment.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-500">Loading available tests...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tests Available</h3>
            <p className="text-gray-500">
              There are no timed tests available at the moment.
              <br />
              Check back later or contact your administrator.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-2xl border transition-all cursor-pointer ${
                  selectedTemplate?.id === template.id
                    ? 'border-primary shadow-lg ring-2 ring-primary/20'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
                onClick={() => setSelectedTemplate(
                  selectedTemplate?.id === template.id ? null : template
                )}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {template.name}
                      </h3>
                      {template.description && (
                        <p className="text-gray-500 text-sm mb-4">
                          {template.description}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span>{template.sectionCount} sections</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <HelpCircle className="w-4 h-4 text-gray-400" />
                          <span>{template.totalQuestions} questions</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{formatTime(template.timeLimitSeconds || template.totalSectionTime)}</span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className={`w-6 h-6 text-gray-400 transition-transform ${
                      selectedTemplate?.id === template.id ? 'rotate-90' : ''
                    }`} />
                  </div>

                  {/* Expanded details */}
                  {selectedTemplate?.id === template.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-6 pt-6 border-t border-gray-100"
                    >
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Section Breakdown
                      </h4>
                      <div className="space-y-2 mb-6">
                        {template.sections.map((section, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <span className="font-medium text-gray-900">
                                {section.name}
                              </span>
                              <span className="text-gray-500 text-sm ml-2">
                                {section.questionCount} questions
                              </span>
                            </div>
                            {section.timeLimitSeconds && (
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(section.timeLimitSeconds)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 mb-6">
                        <h4 className="text-sm font-semibold text-yellow-800 mb-2">
                          Before You Start
                        </h4>
                        <ul className="text-sm text-yellow-700 space-y-1">
                          <li>- Once started, the timer cannot be paused</li>
                          <li>- You cannot go back to previous sections after completing them</li>
                          <li>- Ensure you have a stable internet connection</li>
                          <li>- Avoid switching tabs during the test</li>
                        </ul>
                      </div>

                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartTest(template);
                        }}
                        fullWidth
                        size="lg"
                        disabled={startingTest === template.id}
                        className="flex items-center justify-center gap-2"
                      >
                        {startingTest === template.id ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Starting Test...
                          </>
                        ) : (
                          <>
                            <Timer className="w-5 h-5" />
                            Start Test
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TimedTestStartPage;
