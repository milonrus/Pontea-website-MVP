import type { Metadata } from 'next';

import ResultsPage from '@/views/ResultsPage';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { isRuOnlyMode } from '@/lib/i18n/mode';

const ruOnlyMode = isRuOnlyMode();

export const metadata: Metadata = buildPageMetadata({
  title: 'Результаты диагностики',
  description: 'Персональные результаты диагностики и план подготовки.',
  canonical: '/ru/results',
  ...(ruOnlyMode
    ? {}
    : {
        languages: {
          en: '/en/results',
          ru: '/ru/results'
        }
      }),
  robots: {
    index: false,
    follow: false
  }
});

export default function Page() {
  return <ResultsPage locale="ru" />;
}
