"use client";

import StudentDetailPage from '@/views/admin/StudentDetailPage';
import AdminRoute from '@/components/auth/AdminRoute';

const Page = () => {
  return (
    <AdminRoute>
      <StudentDetailPage />
    </AdminRoute>
  );
};

export default Page;
