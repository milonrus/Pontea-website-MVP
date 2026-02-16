import type { Metadata } from 'next';

import Header from '@/components/shared/Header';
import AssessmentFlow from '@/components/assessment/AssessmentFlow';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { isRuOnlyMode } from '@/lib/i18n/mode';

const ruOnlyMode = isRuOnlyMode();

export const metadata: Metadata = buildPageMetadata({
  title: 'Персональный план подготовки',
  description:
    'Пройди короткую диагностику и получи персональный план подготовки к ARCHED и TIL-A.',
  canonical: '/ru/assessment',
  ...(ruOnlyMode
    ? {}
    : {
        languages: {
          en: '/en/assessment',
          ru: '/ru/assessment'
        }
      })
});

export default function Page() {
  return (
    <>
      <Header locale="ru" />
      <div className="pt-20">
        <AssessmentFlow locale="ru" />
      </div>
    </>
  );
}
