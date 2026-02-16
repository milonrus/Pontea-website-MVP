import type { Metadata } from 'next';

import ResultsPage from '@/views/ResultsPage';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Diagnostic Results',
  description: 'Your personal diagnostic results and preparation roadmap.',
  canonical: '/results/',
  robots: {
    index: false,
    follow: false
  }
});

export default function Page() {
  return <ResultsPage locale="en" />;
}
