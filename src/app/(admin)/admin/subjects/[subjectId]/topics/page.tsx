"use client";

import TopicsPage from '@/views/admin/TopicsPage';
import AdminRoute from '@/components/auth/AdminRoute';

const Page = () => {
  return (
    <AdminRoute>
      <TopicsPage />
    </AdminRoute>
  );
};

export default Page;
