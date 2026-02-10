"use client";

import AdminRoute from '@/components/auth/AdminRoute';
import Header from '@/components/shared/Header';
import RoadmapPlaygroundPage from '@/views/admin/RoadmapPlaygroundPage';

const Page = () => {
  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="pt-28 pb-20">
          <RoadmapPlaygroundPage />
        </main>
      </div>
    </AdminRoute>
  );
};

export default Page;
