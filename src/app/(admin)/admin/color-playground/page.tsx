import type { Metadata } from 'next';

import ColorSchemeDemo from '@/components/ColorSchemeDemo';
import AdminRoute from '@/components/auth/AdminRoute';
import Header from '@/components/shared/Header';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Admin Color Playground',
  description: 'Admin-only color playground.',
  canonical: '/admin/color-playground',
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
        <main className="pt-24 pb-20">
          <ColorSchemeDemo />
        </main>
      </div>
    </AdminRoute>
  );
};

export default Page;
