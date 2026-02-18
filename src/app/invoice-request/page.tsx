import type { Metadata } from 'next';
import InvoiceRequestPageClient from '@/components/landing/pricing-ru/InvoiceRequestPageClient';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'EUR Invoice Request',
  description: 'Submit your details to receive a contract and invoice for EUR bank transfer.',
  canonical: '/invoice-request/',
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
  return <InvoiceRequestPageClient locale="en" />;
}
