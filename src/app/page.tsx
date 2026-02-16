import type { Metadata } from 'next';
import EnHomeClient from './en/EnHomeClient';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'ARCHED and TIL-A Preparation',
  description:
    'Online ARCHED and TIL-A preparation with structured lessons, diagnostics, and mentor support.',
  canonical: '/',
  languages: {
    en: '/',
    ru: '/ru/'
  }
});

export default function Page() {
  return <EnHomeClient />;
}
