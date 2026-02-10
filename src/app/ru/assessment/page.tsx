import type { Metadata } from 'next';

import Header from '@/components/shared/Header';
import AssessmentFlow from '@/components/assessment/AssessmentFlow';

export const metadata: Metadata = {
  alternates: {
    canonical: '/ru/assessment'
  }
};

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
