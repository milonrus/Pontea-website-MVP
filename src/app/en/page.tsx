import type { Metadata } from 'next';
import EnHomeClient from './EnHomeClient';

export const metadata: Metadata = {
  alternates: {
    canonical: '/en',
    languages: {
      en: '/en',
      ru: '/ru'
    }
  }
};

export default function Page() {
  return <EnHomeClient />;
}
