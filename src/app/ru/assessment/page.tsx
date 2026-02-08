"use client";

import Header from '@/components/shared/Header';
import AssessmentFlow from '@/components/assessment/AssessmentFlow';

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
