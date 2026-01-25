"use client";

import StudentsPage from '@/views/admin/StudentsPage';
import AdminRoute from '@/components/auth/AdminRoute';

const Page = () => {
  return (
    <AdminRoute>
      <StudentsPage />
    </AdminRoute>
  );
};

export default Page;
