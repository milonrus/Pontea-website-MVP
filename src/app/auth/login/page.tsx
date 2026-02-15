import type { Metadata } from 'next';

import AuthPage from '@/views/AuthPage';
import PublicRoute from '@/components/auth/PublicRoute';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Login',
  description: 'Sign in to your PONTEA School account.',
  canonical: '/auth/login',
  robots: {
    index: false,
    follow: false
  }
});

const Page = () => {
  return (
    <PublicRoute>
      <AuthPage />
    </PublicRoute>
  );
};

export default Page;
