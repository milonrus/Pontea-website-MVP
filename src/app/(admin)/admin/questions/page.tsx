"use client";

import QuestionsPage from '@/views/admin/QuestionsPage';
import AdminRoute from '@/components/auth/AdminRoute';

const Page = () => {
  return (
    <AdminRoute>
      <QuestionsPage />
    </AdminRoute>
  );
};

export default Page;
