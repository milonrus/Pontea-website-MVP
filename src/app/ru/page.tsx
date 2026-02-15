import type { Metadata } from 'next';
import RuHomeClient from './RuHomeClient';
import { isRuOnlyMode } from '@/lib/i18n/mode';

const ruOnlyMode = isRuOnlyMode();

export const metadata: Metadata = {
  alternates: {
    canonical: '/ru',
    ...(ruOnlyMode
      ? {}
      : {
          languages: {
            en: '/en',
            ru: '/ru'
          }
        })
  }
};

const Page = () => {
  return <RuHomeClient />;
};

export default Page;
