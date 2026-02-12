import type { Metadata } from 'next';

import ResultsPage from '@/views/ResultsPage';

export const metadata: Metadata = {
  alternates: {
    canonical: '/ru/results'
  }
};

export default function Page() {
  return <ResultsPage />;
}
