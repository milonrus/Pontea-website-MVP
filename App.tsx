import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AssessmentFlow from './components/assessment/AssessmentFlow';
import ResultsPage from './pages/ResultsPage';
import MethodologyPage from './pages/MethodologyPage';
import ConsultationPage from './pages/ConsultationPage';
import AuthPage from './pages/AuthPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import DashboardPage from './pages/DashboardPage';
import ScrollToTop from './components/shared/ScrollToTop';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Admin Pages
import AdminRoute from './components/auth/AdminRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import QuestionsPage from './pages/admin/QuestionsPage';
import QuestionFormPage from './pages/admin/QuestionFormPage';
import BulkImportPage from './pages/admin/BulkImportPage';
import SubjectsPage from './pages/admin/SubjectsPage';
import TopicsPage from './pages/admin/TopicsPage';
import ReportsPage from './pages/admin/ReportsPage';
import StudentsPage from './pages/admin/StudentsPage';
import StudentDetailPage from './pages/admin/StudentDetailPage';

// Student Pages
import NewExercisePage from './pages/student/NewExercisePage';
import ExerciseSessionPage from './pages/student/ExerciseSessionPage';
import ExerciseResultsPage from './pages/student/ExerciseResultsPage';
import HistoryPage from './pages/student/HistoryPage';
import ProgressPage from './pages/student/ProgressPage';
import SettingsPage from './pages/student/SettingsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!currentUser) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (currentUser) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          } />
          <Route path="/methodology" element={<MethodologyPage />} />
          <Route path="/assessment" element={<AssessmentFlow />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/consultation" element={<ConsultationPage />} />
          <Route path="/auth" element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          } />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Protected Student Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/exercise/new" element={
            <ProtectedRoute>
              <NewExercisePage />
            </ProtectedRoute>
          } />
          <Route path="/exercise/:setId" element={
            <ProtectedRoute>
              <ExerciseSessionPage />
            </ProtectedRoute>
          } />
          <Route path="/exercise/:setId/results" element={
            <ProtectedRoute>
              <ExerciseResultsPage />
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          } />
          <Route path="/progress" element={
            <ProtectedRoute>
              <ProgressPage />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/subjects" element={
            <AdminRoute>
              <SubjectsPage />
            </AdminRoute>
          } />
          <Route path="/admin/subjects/:subjectId/topics" element={
            <AdminRoute>
              <TopicsPage />
            </AdminRoute>
          } />
          <Route path="/admin/questions" element={
            <AdminRoute>
              <QuestionsPage />
            </AdminRoute>
          } />
          <Route path="/admin/questions/new" element={
            <AdminRoute>
              <QuestionFormPage />
            </AdminRoute>
          } />
          <Route path="/admin/questions/:id/edit" element={
            <AdminRoute>
              <QuestionFormPage />
            </AdminRoute>
          } />
          <Route path="/admin/questions/import" element={
            <AdminRoute>
              <BulkImportPage />
            </AdminRoute>
          } />
          <Route path="/admin/reports" element={
            <AdminRoute>
              <ReportsPage />
            </AdminRoute>
          } />
          <Route path="/admin/students" element={
            <AdminRoute>
              <StudentsPage />
            </AdminRoute>
          } />
          <Route path="/admin/students/:id" element={
            <AdminRoute>
              <StudentDetailPage />
            </AdminRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
