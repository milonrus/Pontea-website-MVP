import type { Metadata } from 'next';

import AdminRoute from '@/components/auth/AdminRoute';
import Header from '@/components/shared/Header';
import RoadmapPlaygroundPage from '@/views/admin/RoadmapPlaygroundPage';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Admin Roadmap Playground',
  description: 'Admin-only roadmap playground.',
  canonical: '/admin/roadmap-playground',
  robots: {
    index: false,
    follow: false
  }
});

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
