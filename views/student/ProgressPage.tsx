import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/shared/Header';
import Button from '../../components/shared/Button';
import { useAuth } from '../../contexts/AuthContext';
import { getStudentProgress, getSubjects } from '../../services/db';
import { getExerciseHistory } from '../../services/exercise';
import { StudentProgress, SubjectModel, ExerciseSet } from '../../types';
import {
  Target,
  Clock,
  Award,
  TrendingUp,
  BookOpen,
  Loader2,
  BarChart3,
  Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';

const ProgressPage: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [subjects, setSubjects] = useState<SubjectModel[]>([]);
  const [exercises, setExercises] = useState<ExerciseSet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [currentUser]);

  const loadProgress = async () => {
    if (!currentUser) return;
    try {
      const [progressData, subjectsData, exercisesData] = await Promise.all([
        getStudentProgress(currentUser.id),
        getSubjects(),
        getExerciseHistory(currentUser.id)
      ]);
      setProgress(progressData);
      setSubjects(subjectsData);
      setExercises(exercisesData.filter(e => e.status === 'completed'));
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getSubjectName = (subjectId: string) => {
    return subjects.find(s => s.id === subjectId)?.name || subjectId;
  };

  // Calculate streak (consecutive days with activity)
  const calculateStreak = () => {
    if (exercises.length === 0) return 0;

    const sortedExercises = [...exercises].sort((a, b) => {
      const dateA = a.startedAt ? new Date(a.startedAt) : new Date(0);
      const dateB = b.startedAt ? new Date(b.startedAt) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const exercise of sortedExercises) {
      const exerciseDate = exercise.startedAt ? new Date(exercise.startedAt) : null;
      if (!exerciseDate) continue;

      const exerciseDateOnly = new Date(exerciseDate);
      exerciseDateOnly.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((currentDate.getTime() - exerciseDateOnly.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 1) {
        if (daysDiff === 1 || (daysDiff === 0 && streak === 0)) {
          streak++;
          currentDate = exerciseDateOnly;
        }
      } else {
        break;
      }
    }

    return streak;
  };

  // Get exercises per day for the last 14 days
  const getExercisesPerDay = () => {
    const days: { date: string; count: number }[] = [];
    const today = new Date();

    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const count = exercises.filter(ex => {
        const exDate = ex.startedAt ? new Date(ex.startedAt) : null;
        if (!exDate) return false;
        return exDate.toDateString() === date.toDateString();
      }).length;

      days.push({ date: dateStr, count });
    }

    return days;
  };

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

  const accuracy = progress && progress.totalQuestionsAttempted > 0
    ? Math.round((progress.totalCorrect / progress.totalQuestionsAttempted) * 100)
    : 0;

  const streak = calculateStreak();
  const exercisesPerDay = getExercisesPerDay();
  const maxExercisesPerDay = Math.max(...exercisesPerDay.map(d => d.count), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Progress & Statistics</h1>
            <p className="text-gray-500">Track your learning journey</p>
          </div>
          <Button onClick={() => router.push('/exercise/new')}>
            Practice Now
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {progress?.totalQuestionsAttempted || 0}
            </p>
            <p className="text-sm text-gray-500">Questions Attempted</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className={`text-3xl font-bold ${
              accuracy >= 70 ? 'text-green-600' : accuracy >= 50 ? 'text-yellow-600' : 'text-gray-900'
            }`}>
              {accuracy}%
            </p>
            <p className="text-sm text-gray-500">Overall Accuracy</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {progress?.masteredQuestionIds?.length || 0}
            </p>
            <p className="text-sm text-gray-500">Questions Mastered</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatTime(progress?.totalTimeSpent || 0)}
            </p>
            <p className="text-sm text-gray-500">Total Practice Time</p>
          </motion.div>
        </div>

        {/* Streak Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-primary to-blue-700 rounded-xl p-6 mb-8 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Current Streak</p>
              <p className="text-4xl font-bold">{streak} days</p>
            </div>
            <Calendar className="w-16 h-16 text-white/20" />
          </div>
        </motion.div>

        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl border border-gray-200 p-6 mb-8"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Activity (Last 14 Days)
          </h2>

          <div className="flex items-end gap-2 h-32">
            {exercisesPerDay.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-primary/20 rounded-t transition-all hover:bg-primary/30"
                  style={{
                    height: `${(day.count / maxExercisesPerDay) * 100}%`,
                    minHeight: day.count > 0 ? '8px' : '4px',
                    backgroundColor: day.count > 0 ? undefined : '#e5e7eb'
                  }}
                />
                <span className="text-xs text-gray-400 rotate-45 origin-left whitespace-nowrap">
                  {day.date}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center text-sm text-gray-500">
            {exercises.length} total exercises completed
          </div>
        </motion.div>

        {/* Subject Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Progress by Subject
          </h2>

          {progress?.subjectStats && Object.keys(progress.subjectStats).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(progress.subjectStats).map(([subjectId, stats]) => {
                const subjectAccuracy = stats.attempted > 0
                  ? Math.round((stats.correct / stats.attempted) * 100)
                  : 0;

                return (
                  <div key={subjectId}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">{getSubjectName(subjectId)}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-500">
                          {stats.correct}/{stats.attempted} correct
                        </span>
                        <span className={`font-bold ${
                          subjectAccuracy >= 70 ? 'text-green-600' : subjectAccuracy >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {subjectAccuracy}%
                        </span>
                      </div>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${subjectAccuracy}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className={`h-full rounded-full ${
                          subjectAccuracy >= 70
                            ? 'bg-gradient-to-r from-green-400 to-green-600'
                            : subjectAccuracy >= 50
                            ? 'bg-gradient-to-r from-yellow-400 to-yellow-600'
                            : 'bg-gradient-to-r from-red-400 to-red-600'
                        }`}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Time spent: {formatTime(stats.timeSpent)}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No subject progress data yet.</p>
              <Button onClick={() => router.push('/exercise/new')} variant="outline">
                Start Practicing
              </Button>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default ProgressPage;
