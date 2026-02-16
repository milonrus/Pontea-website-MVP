import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/shared/Header';
import { getRuLegalDocMetas } from '@/lib/legal/ruLegalDocs';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { isRuOnlyMode } from '@/lib/i18n/mode';

const ruOnlyMode = isRuOnlyMode();

export const metadata: Metadata = buildPageMetadata({
  title: 'Юридические документы',
  description: 'Политика обработки данных, согласие, условия использования и политика cookie.',
  canonical: '/ru/legal',
  ...(ruOnlyMode
    ? {}
    : {
        languages: {
          en: '/en/legal',
          ru: '/ru/legal'
        }
      })
});

const RuLegalPage = async () => {
  const legalDocs = getRuLegalDocMetas();

  return (
    <div className="min-h-screen bg-white">
      <Header locale="ru" />
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-28">
        <h1 className="mb-8 text-4xl font-bold text-black">Документы</h1>
        <ul className="space-y-3">
          {legalDocs.map((doc) => (
            <li key={doc.id}>
              <Link
                href={`/ru/legal/${doc.id}`}
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

export default RuLegalPage;
