"use client";

import BulkImageImportPage from '@/views/admin/BulkImageImportPage';
import AdminRoute from '@/components/auth/AdminRoute';

const Page = () => {
  return (
    <AdminRoute>
      <BulkImageImportPage />
    </AdminRoute>
  );
};

export default Page;
