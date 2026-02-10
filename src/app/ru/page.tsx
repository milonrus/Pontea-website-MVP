import type { Metadata } from 'next';
import RuHomeClient from './RuHomeClient';

export const metadata: Metadata = {
  alternates: {
    canonical: '/ru',
    languages: {
      en: '/en',
      ru: '/ru'
    }
  }
};

const Page = () => {
  return <RuHomeClient />;
};

export default Page;
