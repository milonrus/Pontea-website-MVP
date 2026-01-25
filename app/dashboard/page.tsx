"use client";

import DashboardPage from '../../views/DashboardPage';
import ProtectedRoute from '../../components/auth/ProtectedRoute';

const Page = () => {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
};

export default Page;
