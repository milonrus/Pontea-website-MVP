import type { Metadata } from 'next';
import RuHomeClient from './RuHomeClient';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Подготовка к ARCHED и TIL-A',
  description:
    'Онлайн-подготовка к ARCHED и TIL-A с диагностикой уровня, понятным планом и поддержкой ментора.',
  canonical: '/ru/',
  languages: {
    en: '/',
    ru: '/ru/'
  }
});

const Page = () => {
  return <RuHomeClient />;
};

export default Page;
