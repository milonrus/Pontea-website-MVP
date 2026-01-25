import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/shared/Header';
import { getStudents, getAllStudentProgress } from '../../services/db';
import { getExerciseSetsForStudent } from '../../services/exercise';
import { UserProfile, StudentProgress, ExerciseSet } from '../../types';
import { ChevronRight, Users, Search, Loader2, User, Calendar, Target, Clock } from 'lucide-react';

interface StudentWithStats extends UserProfile {
  progress?: StudentProgress;
  exerciseCount?: number;
  accuracy?: number;
  lastActive?: Date;
}

const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const studentsData = await getStudents();
      const progressData = await getAllStudentProgress();

      // Combine data
      const studentsWithStats: StudentWithStats[] = await Promise.all(
        studentsData.map(async student => {
          const progress = progressData.find(p => p.id === student.uid);
          let exerciseCount = 0;

          try {
            const exercises = await getExerciseSetsForStudent(student.uid);
            exerciseCount = exercises.length;
          } catch (e) {
            // Ignore errors for exercise count
          }

          const accuracy = progress && progress.totalQuestionsAttempted > 0
            ? Math.round((progress.totalCorrect / progress.totalQuestionsAttempted) * 100)
            : 0;

          const lastActive = progress?.lastActivityAt
            ? new Date(progress.lastActivityAt)
            : student.createdAt
            ? new Date(student.createdAt)
            : undefined;

          return {
            ...student,
            progress,
            exerciseCount,
            accuracy,
            lastActive
          };
        })
      );

      setStudents(studentsWithStats);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value?: string | Date) => {
    if (!value) return '-';
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredStudents = students.filter(student =>
    student.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-500 mb-6">
          <Link to="/admin" className="hover:text-primary">Admin</Link>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-gray-900 font-medium">Students</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Students</h1>
            <p className="text-gray-500">{students.length} registered students</p>
          </div>

          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full md:w-64 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No students found' : 'No students yet'}
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? 'Try a different search term.'
                : 'Students will appear here once they register.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-4">Student</div>
              <div className="col-span-2 text-center">Registered</div>
              <div className="col-span-2 text-center">Exercises</div>
              <div className="col-span-2 text-center">Accuracy</div>
              <div className="col-span-2 text-center">Last Active</div>
            </div>

            {filteredStudents.map(student => (
              <div
                key={student.uid}
                onClick={() => navigate(`/admin/students/${student.uid}`)}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {student.displayName || 'No name'}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{student.email}</p>
                  </div>
                </div>

                <div className="col-span-2 flex items-center justify-center md:justify-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400 md:hidden" />
                  <span className="md:hidden text-gray-400">Registered:</span>
                  {formatDate(student.createdAt)}
                </div>

                <div className="col-span-2 flex items-center justify-center md:justify-center gap-2">
                  <Target className="w-4 h-4 text-gray-400 md:hidden" />
                  <span className="md:hidden text-gray-400">Exercises:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {student.exerciseCount || 0}
                  </span>
                </div>

                <div className="col-span-2 flex items-center justify-center md:justify-center gap-2">
                  <span className="md:hidden text-gray-400">Accuracy:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    (student.accuracy || 0) >= 70
                      ? 'bg-green-100 text-green-800'
                      : (student.accuracy || 0) >= 50
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {student.accuracy || 0}%
                  </span>
                </div>

                <div className="col-span-2 flex items-center justify-center md:justify-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400 md:hidden" />
                  <span className="md:hidden text-gray-400">Last active:</span>
                  {formatDate(student.lastActive)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentsPage;
