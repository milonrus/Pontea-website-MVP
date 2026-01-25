"use client";

import QuestionFormPage from '@/views/admin/QuestionFormPage';
import AdminRoute from '@/components/auth/AdminRoute';

const Page = () => {
  return (
    <AdminRoute>
      <QuestionFormPage />
    </AdminRoute>
  );
};

export default Page;
