import type { Metadata } from 'next';

import AuthCallbackPage from '@/views/AuthCallbackPage';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Authentication Callback',
  description: 'Completing authentication.',
  canonical: '/auth/callback',
  robots: {
    index: false,
    follow: false
  }
});

const Page = () => {
  return <AuthCallbackPage />;
};

export default Page;
