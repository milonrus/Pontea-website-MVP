import type { Metadata } from 'next';
import InvoiceRequestPageClient from '@/components/landing/pricing-ru/InvoiceRequestPageClient';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Оплата в евро',
  description: 'Оставьте данные для договора и инвойса на банковский перевод в EUR.',
  canonical: '/ru/invoice-request/',
  languages: {
    en: '/invoice-request/',
    ru: '/ru/invoice-request/'
  },
  robots: {
    index: false,
    follow: false
  }
});

export default function Page() {
  return <InvoiceRequestPageClient locale="ru" />;
}
