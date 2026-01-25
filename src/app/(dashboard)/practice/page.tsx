"use client";

import PracticeSetupPage from '@/views/student/PracticeSetupPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const Page = () => {
  return (
    <ProtectedRoute>
      <PracticeSetupPage />
    </ProtectedRoute>
  );
};

export default Page;
