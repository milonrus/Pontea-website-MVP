import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/shared/Header';
import Button from '@/components/shared/Button';
import LaTeXRenderer from '@/components/shared/LaTeXRenderer';
import { useAuth } from '@/contexts/AuthContext';
import { getExerciseSet, getQuestionsByIds, getExerciseResponses } from '@/lib/test';
import { getSubjects } from '@/lib/db';
import { ExerciseSet, QuestionModel, ExerciseResponse, SubjectModel } from '@/types';
import {
  CheckCircle,
  XCircle,
  Clock,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Home,
  Loader2,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ExerciseResultsPage: React.FC = () => {
  const params = useParams();
  const attemptIdParam = params?.attemptId;
  const setId = Array.isArray(attemptIdParam) ? attemptIdParam[0] : attemptIdParam;
  const router = useRouter();
  const { currentUser } = useAuth();
  const [exercise, setExercise] = useState<ExerciseSet | null>(null);
  const [questions, setQuestions] = useState<QuestionModel[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<SubjectModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadResults();
  }, [setId, currentUser]);

  const loadResults = async () => {
    if (!setId) {
      setLoading(false);
      return;
    }
    if (!currentUser) {
      // Keep loading while waiting for auth to initialize
      return;
    }
    try {
      const [exerciseData, subjectsData] = await Promise.all([
        getExerciseSet(setId),
        getSubjects()
      ]);

      if (!exerciseData) {
        console.error('Exercise not found:', setId);
        router.replace('/dashboard');
        return;
      }

      console.log('Exercise loaded:', exerciseData);

      setExercise(exerciseData);
      setSubjects(subjectsData);

      const [questionsData, responsesData] = await Promise.all([
        getQuestionsByIds(exerciseData.questionIds),
        getExerciseResponses(setId)
      ]);

      // Sort questions to match original order
      const sortedQuestions = exerciseData.questionIds.map(
        id => questionsData.find(q => q.id === id)!
      ).filter(q => q != null); // Filter out any null/undefined questions

      if (sortedQuestions.length === 0) {
        console.error('No questions found for exercise');
        alert('Error: No questions found for this exercise');
        router.replace('/dashboard');
        return;
      }

      console.log('Loaded questions:', sortedQuestions.length);
      console.log('Loaded responses:', responsesData.length);

      setQuestions(sortedQuestions);
      setResponses(responsesData);
    } catch (error) {
      console.error('Error loading results:', error);
      alert('Error loading results: ' + (error as Error).message);
      router.replace('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSubjectName = (subjectId?: string) => {
    if (!subjectId) return 'All Subjects';
    return subjects.find(s => s.id === subjectId)?.name || subjectId;
  };

  const getResponseForQuestion = (questionId: string) => {
    return responses.find(r => r.questionId === questionId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600 font-medium">Loading results...</p>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Exercise not found</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const accuracy = exercise.totalQuestions > 0
    ? Math.round((exercise.correctCount / exercise.totalQuestions) * 100)
    : 0;

  const avgTimePerQuestion = exercise.totalQuestions > 0
    ? Math.round(exercise.totalTimeSpent / exercise.totalQuestions)
    : 0;

  console.log('Rendering results page with:', {
    exerciseId: exercise.id,
    questionsCount: questions.length,
    responsesCount: responses.length,
    accuracy,
    avgTimePerQuestion
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Results Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-200 p-8 mb-8 text-center"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
            <Award className="w-10 h-10 text-primary" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Exercise Complete!</h1>
          <p className="text-gray-500 mb-6">
            {getSubjectName(exercise.filters.subjectId)} - {exercise.totalQuestions} questions
          </p>

          {/* Score Display */}
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-50 rounded-xl mb-8">
            <span className="text-5xl font-bold text-gray-900">{exercise.correctCount}</span>
            <span className="text-2xl text-gray-400">/</span>
            <span className="text-2xl text-gray-500">{exercise.totalQuestions}</span>
            <span className={`ml-4 text-3xl font-bold ${
              accuracy >= 70 ? 'text-green-600' : accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {accuracy}%
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="bg-blue-50 rounded-xl p-4">
              <Target className="w-5 h-5 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-900">{exercise.correctCount}</p>
              <p className="text-xs text-blue-600">Correct</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4">
              <Clock className="w-5 h-5 text-orange-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-900">{formatTime(exercise.totalTimeSpent)}</p>
              <p className="text-xs text-orange-600">Total Time</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <TrendingUp className="w-5 h-5 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-900">{avgTimePerQuestion}s</p>
              <p className="text-xs text-purple-600">Avg/Question</p>
            </div>
          </div>
        </motion.div>

        {/* Question Review */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 mb-8"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4">Question Review</h2>

          <div className="space-y-3">
            {questions.map((question, index) => {
              const response = getResponseForQuestion(question.id);
              const isCorrect = response?.isCorrect;
              const isExpanded = expandedQuestions.has(question.id);

              return (
                <div
                  key={question.id}
                  className={`border rounded-xl overflow-hidden transition-colors ${
                    isCorrect ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'
                  }`}
                >
                  <button
                    onClick={() => toggleQuestion(question.id)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-white/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm text-sm font-bold text-gray-600">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-900 line-clamp-1">
                        {question.questionText.substring(0, 80)}...
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-gray-100"
                      >
                        <div className="p-4 bg-white space-y-4">
                          {/* Question */}
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Question</p>
                            <LaTeXRenderer text={question.questionText} className="text-gray-900" />
                            {question.questionImageUrl && (
                              <img
                                src={question.questionImageUrl}
                                alt="Question illustration"
                                className="mt-3 max-w-full h-auto rounded-lg border border-gray-200"
                              />
                            )}
                          </div>

                          {/* Options */}
                          <div className="space-y-2">
                            {question.options.map(opt => {
                              const isSelected = response?.selectedAnswer === opt.id;
                              const isCorrectAnswer = question.correctAnswer === opt.id;

                              let optionStyles = 'border-gray-200 bg-gray-50';
                              if (isCorrectAnswer) optionStyles = 'border-green-300 bg-green-50';
                              if (isSelected && !isCorrectAnswer) optionStyles = 'border-red-300 bg-red-50';

                              return (
                                <div
                                  key={opt.id}
                                  className={`flex items-center gap-3 p-3 rounded-lg border ${optionStyles}`}
                                >
                                  <span className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-xs font-bold shadow-sm">
                                    {opt.id.toUpperCase()}
                                  </span>
                                  <LaTeXRenderer text={opt.text} className="flex-1 text-sm" />
                                  {isCorrectAnswer && <CheckCircle className="w-4 h-4 text-green-600" />}
                                  {isSelected && !isCorrectAnswer && <XCircle className="w-4 h-4 text-red-600" />}
                                </div>
                              );
                            })}
                          </div>

                          {/* Explanation */}
                          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                            <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Explanation</p>
                            <LaTeXRenderer text={question.explanation} className="text-sm text-blue-900" />
                            {question.explanationImageUrl && (
                              <img
                                src={question.explanationImageUrl}
                                alt="Explanation illustration"
                                className="mt-3 max-w-full h-auto rounded-lg border border-blue-100"
                              />
                            )}
                          </div>

                          {/* Time spent */}
                          {response?.timeSpent && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Time spent: {response.timeSpent}s
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <Button
            onClick={() => router.push('/practice')}
            className="flex items-center justify-center gap-2"
          >
            Start New Exercise
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ExerciseResultsPage;
