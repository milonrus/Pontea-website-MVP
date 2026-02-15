import type { Metadata } from 'next';
import RuHomeClient from './RuHomeClient';
import { isRuOnlyMode } from '@/lib/i18n/mode';
import { buildPageMetadata } from '@/lib/seo/metadata';

const ruOnlyMode = isRuOnlyMode();

export const metadata: Metadata = buildPageMetadata({
  title: 'Подготовка к ARCHED и TIL-A',
  description:
    'Онлайн-подготовка к ARCHED и TIL-A с диагностикой уровня, понятным планом и поддержкой ментора.',
  canonical: '/ru',
  ...(ruOnlyMode
    ? {}
    : {
        languages: {
          en: '/en',
          ru: '/ru'
        }
      })
});

const Page = () => {
  return <RuHomeClient />;
};

export default Page;
