import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../../components/shared/Header';
import Button from '../../components/shared/Button';
import { useAuth } from '../../contexts/AuthContext';
import { getExerciseHistory } from '../../services/exercise';
import { getSubjects } from '../../services/db';
import { ExerciseSet, SubjectModel } from '../../types';
import {
  Clock,
  Target,
  Calendar,
  ChevronRight,
  Loader2,
  History,
  CheckCircle,
  XCircle,
  Pause,
  Play
} from 'lucide-react';
import { motion } from 'framer-motion';

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [exercises, setExercises] = useState<ExerciseSet[]>([]);
  const [subjects, setSubjects] = useState<SubjectModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'in_progress' | 'abandoned'>('all');

  useEffect(() => {
    loadHistory();
  }, [currentUser]);

  const loadHistory = async () => {
    if (!currentUser) return;
    try {
      const [exercisesData, subjectsData] = await Promise.all([
        getExerciseHistory(currentUser.id),
        getSubjects()
      ]);
      setExercises(exercisesData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSubjectName = (subjectId?: string) => {
    if (!subjectId || subjectId === 'all') return 'All Subjects';
    return subjects.find(s => s.id === subjectId)?.name || subjectId;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" /> Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Play className="w-3 h-3" /> In Progress
          </span>
        );
      case 'abandoned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Pause className="w-3 h-3" /> Abandoned
          </span>
        );
      default:
        return null;
    }
  };

  const filteredExercises = exercises.filter(ex => {
    if (filter === 'all') return true;
    return ex.status === filter;
  });

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'completed', label: 'Completed' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'abandoned', label: 'Abandoned' }
  ] as const;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exercise History</h1>
            <p className="text-gray-500">Review your past exercise sessions</p>
          </div>
          <Button onClick={() => navigate('/exercise/new')}>
            New Exercise
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                filter === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                {exercises.filter(ex => tab.key === 'all' || ex.status === tab.key).length}
              </span>
            </button>
          ))}
        </div>

        {filteredExercises.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No exercises found</h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all'
                ? "You haven't completed any exercises yet."
                : `No ${filter.replace('_', ' ')} exercises.`}
            </p>
            <Button onClick={() => navigate('/exercise/new')}>Start Your First Exercise</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExercises.map((exercise, index) => {
              const accuracy = exercise.totalQuestions > 0
                ? Math.round((exercise.correctCount / exercise.totalQuestions) * 100)
                : 0;

              return (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    if (exercise.status === 'completed') {
                      navigate(`/exercise/${exercise.id}/results`);
                    } else if (exercise.status === 'in_progress') {
                      navigate(`/exercise/${exercise.id}`);
                    }
                  }}
                  className={`bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all ${
                    exercise.status !== 'abandoned' ? 'cursor-pointer' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusBadge(exercise.status)}
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(exercise.startedAt)}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {getSubjectName(exercise.filters.subjectId)}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        {exercise.filters.difficulty && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            exercise.filters.difficulty === 'easy'
                              ? 'bg-green-100 text-green-700'
                              : exercise.filters.difficulty === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {exercise.filters.difficulty}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Target className="w-4 h-4" />
                          {exercise.totalQuestions} questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(exercise.totalTimeSpent)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {exercise.status === 'completed' && (
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${
                            accuracy >= 70 ? 'text-green-600' : accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {accuracy}%
                          </p>
                          <p className="text-xs text-gray-500">
                            {exercise.correctCount}/{exercise.totalQuestions} correct
                          </p>
                        </div>
                      )}

                      {exercise.status === 'in_progress' && (
                        <div className="text-right">
                          <p className="text-sm font-medium text-blue-600">Continue</p>
                          <p className="text-xs text-gray-500">
                            {exercise.currentIndex}/{exercise.totalQuestions} done
                          </p>
                        </div>
                      )}

                      {exercise.status !== 'abandoned' && (
                        <ChevronRight className="w-5 h-5 text-gray-300" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default HistoryPage;
