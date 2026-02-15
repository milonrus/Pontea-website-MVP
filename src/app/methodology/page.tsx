import type { Metadata } from 'next';

import MethodologyPage from '@/views/MethodologyPage';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Knowledge Matrix Methodology',
  description:
    'See the PONTEA Knowledge Matrix methodology for ARCHED and TIL-A exam preparation.',
  canonical: '/methodology'
});

const Page = () => {
  return <MethodologyPage />;
};

export default Page;
