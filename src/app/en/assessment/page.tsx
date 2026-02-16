import type { Metadata } from 'next';

import Header from '@/components/shared/Header';
import AssessmentFlow from '@/components/assessment/AssessmentFlow';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Personal Preparation Plan',
  description:
    'Take a short diagnostic and get a personal preparation plan for ARCHED and TIL-A.',
  canonical: '/en/assessment',
  languages: {
    en: '/en/assessment',
    ru: '/ru/assessment'
  }
});

export default function Page() {
  return (
    <>
      <Header locale="en" />
      <div className="pt-20">
        <AssessmentFlow locale="en" />
      </div>
    </>
  );
}
