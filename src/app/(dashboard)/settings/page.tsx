"use client";

import SettingsPage from '@/views/student/SettingsPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const Page = () => {
  return (
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  );
};

export default Page;
