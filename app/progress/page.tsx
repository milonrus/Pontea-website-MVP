"use client";

import ProgressPage from '../../views/student/ProgressPage';
import ProtectedRoute from '../../components/auth/ProtectedRoute';

const Page = () => {
  return (
    <ProtectedRoute>
      <ProgressPage />
    </ProtectedRoute>
  );
};

export default Page;
