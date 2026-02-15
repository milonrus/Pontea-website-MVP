import type { Metadata } from 'next';

import Header from '@/components/shared/Header';
import AssessmentFlow from '@/components/assessment/AssessmentFlow';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Персональный план подготовки',
  description:
    'Пройди короткую диагностику и получи персональный план подготовки к ARCHED и TIL-A.',
  canonical: '/ru/assessment'
});

export default function Page() {
  return (
    <>
      <Header />
      <div className="pt-20">
        <AssessmentFlow />
      </div>
    </>
  );
}
