import type { Metadata } from 'next';

import ResultsPage from '@/views/ResultsPage';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Diagnostic Results',
  description: 'Your personal diagnostic results and preparation roadmap.',
  canonical: '/en/results',
  languages: {
    en: '/en/results',
    ru: '/ru/results'
  },
  robots: {
    index: false,
    follow: false
  }
});

export default function Page() {
  return <ResultsPage locale="en" />;
}
