import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/shared/Header';
import { getUser, getStudentProgress, getSubjects } from '@/lib/db';
import { getExerciseSetsForStudent } from '@/lib/test';
import { UserProfile, StudentProgress, ExerciseSet, SubjectModel } from '@/types';
import {
  ChevronRight,
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Target,
  Clock,
  Award,
  TrendingUp,
  Loader2,
  BookOpen
} from 'lucide-react';
import { motion } from 'framer-motion';

const StudentDetailPage: React.FC = () => {
  const params = useParams();
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const router = useRouter();
  const [student, setStudent] = useState<UserProfile | null>(null);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [exercises, setExercises] = useState<ExerciseSet[]>([]);
  const [subjects, setSubjects] = useState<SubjectModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      const [studentData, progressData, exercisesData, subjectsData] = await Promise.all([
        getUser(id),
        getStudentProgress(id),
        getExerciseSetsForStudent(id),
        getSubjects()
      ]);

      if (!studentData) {
        router.replace('/admin/students');
        return;
      }

      setStudent(studentData);
      setProgress(progressData);
      setExercises(exercisesData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!student) {
    return null;
  }

  const accuracy = progress && progress.totalQuestionsAttempted > 0
    ? Math.round((progress.totalCorrect / progress.totalQuestionsAttempted) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 mb-6">
          <Link href="/admin" className="hover:text-primary">Admin</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <Link href="/admin/students" className="hover:text-primary">Students</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">{student.displayName || 'Student'}</span>
        </div>

        {/* Back Button and Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/admin/students')}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{student.displayName || 'No name'}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {student.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {formatDate(student.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
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
              <span className="text-sm text-gray-500">Questions Attempted</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {progress?.totalQuestionsAttempted || 0}
            </p>
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
              <span className="text-sm text-gray-500">Accuracy</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{accuracy}%</p>
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
              <span className="text-sm text-gray-500">Questions Mastered</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {progress?.masteredQuestionIds?.length || 0}
            </p>
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
              <span className="text-sm text-gray-500">Time Spent</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatTime(progress?.totalTimeSpent || 0)}
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Subject Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Progress by Subject
            </h2>

            {progress?.subjectStats && Object.keys(progress.subjectStats).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(progress.subjectStats).map(([subjectId, stats]) => {
                  const subjectAccuracy = stats.attempted > 0
                    ? Math.round((stats.correct / stats.attempted) * 100)
                    : 0;

                  return (
                    <div key={subjectId} className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-700">{getSubjectName(subjectId)}</span>
                        <span className="text-gray-500">
                          {stats.correct}/{stats.attempted} ({subjectAccuracy}%)
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            subjectAccuracy >= 70
                              ? 'bg-green-500'
                              : subjectAccuracy >= 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${subjectAccuracy}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No subject progress data yet.</p>
            )}
          </motion.div>

          {/* Recent Exercises */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Recent Exercise Sets
            </h2>

            {exercises.length > 0 ? (
              <div className="space-y-3">
                {exercises.slice(0, 5).map(exercise => {
                  const exerciseAccuracy = exercise.totalQuestions > 0
                    ? Math.round((exercise.correctCount / exercise.totalQuestions) * 100)
                    : 0;

                  return (
                    <div
                      key={exercise.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {exercise.filters.subjectId
                            ? getSubjectName(exercise.filters.subjectId)
                            : 'All Subjects'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(exercise.startedAt)} - {exercise.totalQuestions} questions
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          exerciseAccuracy >= 70
                            ? 'bg-green-100 text-green-800'
                            : exerciseAccuracy >= 50
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {exercise.correctCount}/{exercise.totalQuestions} ({exerciseAccuracy}%)
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(exercise.totalTimeSpent)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No completed exercises yet.</p>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default StudentDetailPage;
