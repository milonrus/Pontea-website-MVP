import type { Metadata } from 'next';

import ResultsPage from '@/views/ResultsPage';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Результаты диагностики',
  description: 'Персональные результаты диагностики и план подготовки.',
  canonical: '/ru/results/',
  robots: {
    index: false,
    follow: false
  }
});

export default function Page() {
  return <ResultsPage locale="ru" />;
}
