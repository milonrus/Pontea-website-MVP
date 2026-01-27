'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/shared/Header';
import Button from '@/components/shared/Button';
import BulkImageUploader from '@/components/admin/BulkImageUploader';
import ImageParseProgress from '@/components/admin/ImageParseProgress';
import ParsedQuestionEditor from '@/components/admin/ParsedQuestionEditor';
import {
  ImageParseItem,
  SubjectModel,
  TopicModel,
  UserProfile,
  BulkParseRequest,
  BulkParseResponse
} from '@/types';
import { getSubjects, getAllTopics, batchCreateQuestions } from '@/lib/db';
import { supabase } from '@/lib/supabase/client';
import { useSSEParser } from '@/hooks/use-sse-parser';
import { CheckCircle, AlertCircle, ArrowLeft, XCircle } from 'lucide-react';

type WizardStep = 'upload' | 'parsing' | 'review' | 'import' | 'success';

const BulkImageImportPage: React.FC = () => {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>('upload');
  const [images, setImages] = useState<ImageParseItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectModel[]>([]);
  const [topics, setTopics] = useState<TopicModel[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);

  // SSE Parser Hook
  const { startParsing: startSSEParsing, cancelParsing, isParsing } = useSSEParser({
    onProgress: (imageId, status, data) => {
      setImages(prev =>
        prev.map(img => {
          if (img.id === imageId) {
            if (status === 'parsing') {
              return { ...img, status: 'parsing' };
            }
            if (status === 'success') {
              return { ...img, status: 'success', parsedQuestion: data?.question };
            }
            if (status === 'error') {
              return { ...img, status: 'error', error: data?.error };
            }
          }
          return img;
        })
      );
    },
    onComplete: (results) => {
      // Complete event received, parsing is done
    },
    onError: (error) => {
      console.warn('SSE parsing failed, falling back to blocking API:', error);
      // Error will be handled in handleStartParsing
    }
  });

  // Load user and metadata on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load subjects and topics
        const subjectsData = await getSubjects();
        setSubjects(subjectsData);

        const topicsData = await getAllTopics();
        setTopics(topicsData);

        // Load saved state from localStorage if available
        const savedState = localStorage.getItem('bulkImageImportState');
        if (savedState) {
          try {
            const parsed = JSON.parse(savedState);
            setStep(parsed.step);
            setImages(parsed.images);
            if (parsed.error) setError(parsed.error);
          } catch (err) {
            console.error('Failed to restore saved state:', err);
            localStorage.removeItem('bulkImageImportState');
          }
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Failed to load subjects and topics');
      }
    };

    loadData();
  }, []);

  const handleStartParsingBlocking = async (
    updatedImages: ImageParseItem[],
    authToken: string
  ): Promise<void> => {
    // Fallback blocking API call
    const request: BulkParseRequest = {
      images: updatedImages.map((img) => ({
        id: img.id,
        dataUrl: img.dataUrl
      }))
    };

    const response = await fetch('/api/admin/questions/parse-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to parse images');
    }

    const data: BulkParseResponse = await response.json();

    // Update images with parsed results
    const parsedImages = updatedImages.map((img) => {
      const result = data.results.find((r) => r.id === img.id);
      if (!result) {
        return { ...img, status: 'error' as const, error: 'No result returned' };
      }

      if (result.success && result.question) {
        return {
          ...img,
          status: 'success' as const,
          parsedQuestion: result.question
        };
      } else {
        return {
          ...img,
          status: 'error' as const,
          error: result.error || 'Unknown error'
        };
      }
    });

    setImages(parsedImages);
  };

  const handleStartParsing = async () => {
    if (images.length === 0) {
      setError('Please select at least one image');
      return;
    }

    setError(null);
    setStep('parsing');

    // Mark all images as pending
    const updatedImages = images.map((img) => ({
      ...img,
      status: 'pending' as const
    }));
    setImages(updatedImages);

    try {
      // Get auth token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('Not authenticated');
      }

      // Try SSE first
      try {
        await startSSEParsing(updatedImages, session.access_token);
      } catch (sseError) {
        // SSE failed, fall back to blocking API
        console.log('SSE parsing failed, using fallback blocking API');
        await handleStartParsingBlocking(updatedImages, session.access_token);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to parse images');
      // Mark all as error
      setImages(
        updatedImages.map((img) => ({
          ...img,
          status: 'error' as const,
          error: err.message || 'Parsing failed'
        }))
      );
    }
  };

  const handleCancelParsing = () => {
    cancelParsing();
    setImages(prev =>
      prev.map(img => {
        if (img.status === 'pending' || img.status === 'parsing') {
          return { ...img, status: 'error' as const, error: 'Cancelled by user' };
        }
        return img;
      })
    );
  };

  const handleRetryFailed = async () => {
    const failedImages = images.filter((img) => img.status === 'error');
    if (failedImages.length === 0) return;

    setError(null);

    // Reset failed images to pending
    const updatedImages = images.map((img) =>
      img.status === 'error' ? { ...img, status: 'pending' as const } : img
    );
    setImages(updatedImages);

    try {
      // Get auth token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error('Not authenticated');
      }

      const request: BulkParseRequest = {
        images: failedImages.map((img) => ({
          id: img.id,
          dataUrl: img.dataUrl
        }))
      };

      const response = await fetch('/api/admin/questions/parse-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error('Failed to parse images');
      }

      const data: BulkParseResponse = await response.json();

      // Update only the failed images
      const retryImages = updatedImages.map((img) => {
        if (img.status !== 'pending') return img;

        const result = data.results.find((r) => r.id === img.id);
        if (!result) {
          return { ...img, status: 'error' as const, error: 'No result returned' };
        }

        if (result.success && result.question) {
          return {
            ...img,
            status: 'success' as const,
            parsedQuestion: result.question
          };
        } else {
          return {
            ...img,
            status: 'error' as const,
            error: result.error || 'Unknown error'
          };
        }
      });

      setImages(retryImages);
    } catch (err: any) {
      setError(err.message || 'Failed to retry parsing');
    }
  };

  const handleProceedToReview = () => {
    const allComplete = images.every((img) => img.status !== 'pending' && img.status !== 'parsing');
    if (!allComplete) {
      setError('All images must finish parsing before proceeding');
      return;
    }
    setError(null);
    setStep('review');
  };

  const validateBeforeImport = (): boolean => {
    const validQuestions = images.filter((img) => {
      if (!img.parsedQuestion) return false;
      const q = img.parsedQuestion;
      const optionCount = q.options?.length || 0;
      return (
        q.questionText &&
        q.options &&
        optionCount >= 4 &&
        optionCount <= 5 &&
        q.options.every((o) => o.text && o.text.trim()) &&
        q.correctAnswer &&
        q.difficulty &&
        q.subjectId
      );
    });

    if (validQuestions.length === 0) {
      setError('No valid questions to import. Please fill in all required fields.');
      return false;
    }

    return true;
  };

  const handleImport = async () => {
    if (!validateBeforeImport()) return;

    setError(null);
    setIsLoading(true);
    setStep('import');

    try {
      // Get current user ID from auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Not authenticated');
      }
      const userId = user.id;

      // Prepare questions for batch insert
      const questionsToCreate = images
        .filter((img) => img.parsedQuestion)
        .map((img) => ({
          subjectId: img.parsedQuestion!.subjectId!,
          topicId: img.parsedQuestion!.topicId || null,
          tags: [],
          difficulty: img.parsedQuestion!.difficulty!,
          questionText: img.parsedQuestion!.questionText,
          questionImageUrl: null,
          options: img.parsedQuestion!.options,
          correctAnswer: img.parsedQuestion!.correctAnswer as any,
          explanation: img.parsedQuestion!.explanation,
          createdBy: userId,
          isActive: true,
          stats: { totalAttempts: 0, totalTimeSpent: 0, correctCount: 0 }
        }));

      // Call batch insert
      await batchCreateQuestions(questionsToCreate);

      setSuccessCount(questionsToCreate.length);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to import questions');
      setStep('review');
    } finally {
      setIsLoading(false);
    }
  };

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (step !== 'upload' || images.length > 0) {
      const stateToSave = { step, images, error };
      localStorage.setItem('bulkImageImportState', JSON.stringify(stateToSave));
    }
  }, [step, images, error]);

  const handleBackToUpload = () => {
    setImages([]);
    setStep('upload');
    setError(null);
    localStorage.removeItem('bulkImageImportState');
  };

  const handleBackToReview = () => {
    setStep('review');
    setError(null);
  };

  const stepNumber = {
    upload: 1,
    parsing: 2,
    review: 3,
    import: 4,
    success: 4
  }[step];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-primary hover:text-secondary mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Import Questions from Images</h1>
          <p className="text-gray-500 mt-2">
            Upload screenshots of questions and let AI parse them for you
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-md">
            {[1, 2, 3, 4].map((num) => (
              <React.Fragment key={num}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                    num <= stepNumber
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {num}
                </div>
                {num < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-colors ${
                      num < stepNumber ? 'bg-primary' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2 max-w-md">
            <span>Upload</span>
            <span>Parse</span>
            <span>Review</span>
            <span>Import</span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {step === 'upload' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Step 1: Upload Images</h2>
                <p className="text-gray-600">
                  Select PNG or JPG screenshots of question images. Maximum 50 images, 5MB each.
                </p>
              </div>

              <BulkImageUploader images={images} onImagesChange={setImages} />

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button
                  onClick={handleStartParsing}
                  disabled={images.length === 0}
                  isLoading={isLoading}
                >
                  Start Parsing ({images.length} image{images.length !== 1 ? 's' : ''})
                </Button>
              </div>
            </div>
          )}

          {step === 'parsing' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Step 2: Parse Images</h2>
                <p className="text-gray-600">
                  AI is analyzing your images to extract question content. This may take a few
                  seconds...
                </p>
              </div>

              <ImageParseProgress
                images={images}
                onRetryFailed={handleRetryFailed}
                isParsing={images.some(
                  (img) => img.status === 'pending' || img.status === 'parsing'
                )}
              />

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleBackToUpload}>
                  Back
                </Button>
                {isParsing && (
                  <Button
                    variant="outline"
                    onClick={handleCancelParsing}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={handleProceedToReview}
                  disabled={images.some(
                    (img) => img.status === 'pending' || img.status === 'parsing'
                  )}
                >
                  Review Parsed Questions
                </Button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Step 3: Review & Edit</h2>
                <p className="text-gray-600">
                  Review the parsed content and edit any fields. Assign subject, topic, and
                  difficulty for each question.
                </p>
              </div>

              <ParsedQuestionEditor
                items={images}
                subjects={subjects}
                topics={topics}
                onItemsChange={setImages}
              />

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setStep('parsing')}>
                  Back
                </Button>
                <Button
                  onClick={handleImport}
                  isLoading={isLoading}
                  disabled={images.filter((img) => img.parsedQuestion).length === 0}
                >
                  Import Questions
                </Button>
              </div>
            </div>
          )}

          {step === 'import' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Step 4: Importing...</h2>
                <p className="text-gray-600">
                  Saving {images.filter((img) => img.parsedQuestion).length} questions to the
                  database...
                </p>
              </div>

              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                <p className="text-gray-600 mt-4">Processing your questions...</p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900">Success!</h2>
                <p className="text-gray-600 mt-2">
                  {successCount} question{successCount !== 1 ? 's' : ''} have been imported
                  successfully.
                </p>
              </div>

              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={handleBackToUpload}>
                  Import More
                </Button>
                <Button onClick={() => {
                  localStorage.removeItem('bulkImageImportState');
                  router.push('/admin/questions');
                }}>
                  View All Questions
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BulkImageImportPage;
