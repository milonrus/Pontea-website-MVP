"use client";

import TemplateEditorPage from '@/views/admin/TemplateEditorPage';
import AdminRoute from '@/components/auth/AdminRoute';

const Page = () => {
  return (
    <AdminRoute>
      <TemplateEditorPage />
    </AdminRoute>
  );
};

export default Page;
