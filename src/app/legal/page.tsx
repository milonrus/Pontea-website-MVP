import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/shared/Header';
import { getEnLegalDocMetas } from '@/lib/legal/enLegalDocs';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Legal Documents',
  description: 'Privacy policy, consent, terms of use, and cookie policy.',
  canonical: '/legal/',
  languages: {
    en: '/legal/',
    ru: '/ru/legal/'
  }
});

const EnLegalPage = async () => {
  const legalDocs = getEnLegalDocMetas();

  return (
    <div className="min-h-screen bg-white">
      <Header locale="en" />
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-28">
        <h1 className="mb-8 text-4xl font-bold text-black">Documents</h1>
        <ul className="space-y-3">
          {legalDocs.map((doc) => (
            <li key={doc.id}>
              <Link
                href={`/legal/${doc.id}/`}
                className="text-lg font-medium text-black underline underline-offset-4 transition-colors hover:text-black/70"
              >
                {doc.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default EnLegalPage;
