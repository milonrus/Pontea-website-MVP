"use client";

import TemplateListPage from '@/views/admin/TemplateListPage';
import AdminRoute from '@/components/auth/AdminRoute';

const Page = () => {
  return (
    <AdminRoute>
      <TemplateListPage />
    </AdminRoute>
  );
};

export default Page;
