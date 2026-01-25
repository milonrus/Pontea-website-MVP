"use client";

import TestSessionPage from '@/views/student/TestSessionPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const Page = () => {
  return (
    <ProtectedRoute>
      <TestSessionPage />
    </ProtectedRoute>
  );
};

export default Page;
