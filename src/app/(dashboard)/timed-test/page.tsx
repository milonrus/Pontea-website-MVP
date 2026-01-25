"use client";

import TimedTestStartPage from '@/views/student/TimedTestStartPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const Page = () => {
  return (
    <ProtectedRoute>
      <TimedTestStartPage />
    </ProtectedRoute>
  );
};

export default Page;
