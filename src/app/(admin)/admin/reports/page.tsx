"use client";

import ReportsPage from '@/views/admin/ReportsPage';
import AdminRoute from '@/components/auth/AdminRoute';

const Page = () => {
  return (
    <AdminRoute>
      <ReportsPage />
    </AdminRoute>
  );
};

export default Page;
