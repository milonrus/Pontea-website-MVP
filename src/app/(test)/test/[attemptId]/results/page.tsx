"use client";

import TestResultsPage from '@/views/student/TestResultsPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const Page = () => {
  return (
    <ProtectedRoute>
      <TestResultsPage />
    </ProtectedRoute>
  );
};

export default Page;
