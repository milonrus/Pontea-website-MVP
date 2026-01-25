"use client";

import SubjectsPage from '@/views/admin/SubjectsPage';
import AdminRoute from '@/components/auth/AdminRoute';

const Page = () => {
  return (
    <AdminRoute>
      <SubjectsPage />
    </AdminRoute>
  );
};

export default Page;
