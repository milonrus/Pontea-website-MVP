"use client";

import AdminDashboard from '../../views/admin/AdminDashboard';
import AdminRoute from '../../components/auth/AdminRoute';

const Page = () => {
  return (
    <AdminRoute>
      <AdminDashboard />
    </AdminRoute>
  );
};

export default Page;
