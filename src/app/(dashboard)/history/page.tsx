"use client";

import HistoryPage from '@/views/student/HistoryPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const Page = () => {
  return (
    <ProtectedRoute>
      <HistoryPage />
    </ProtectedRoute>
  );
};

export default Page;
