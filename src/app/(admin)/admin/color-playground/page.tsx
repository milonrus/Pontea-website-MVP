"use client";

import ColorSchemeDemo from '@/components/ColorSchemeDemo';
import AdminRoute from '@/components/auth/AdminRoute';
import Header from '@/components/shared/Header';

const Page = () => {
  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="pt-24 pb-20">
          <ColorSchemeDemo />
        </main>
      </div>
    </AdminRoute>
  );
};

export default Page;
