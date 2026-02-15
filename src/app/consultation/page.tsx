import type { Metadata } from 'next';

import ConsultationPage from '@/views/ConsultationPage';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Free Strategy Session',
  description:
    'Book a free 30-minute strategy session for ARCHED and TIL-A preparation.',
  canonical: '/consultation'
});

const Page = () => {
  return <ConsultationPage />;
};

export default Page;
