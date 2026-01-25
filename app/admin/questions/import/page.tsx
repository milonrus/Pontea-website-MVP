"use client";

import BulkImportPage from '../../../../views/admin/BulkImportPage';
import AdminRoute from '../../../../components/auth/AdminRoute';

const Page = () => {
  return (
    <AdminRoute>
      <BulkImportPage />
    </AdminRoute>
  );
};

export default Page;
