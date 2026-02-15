import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '@/components/shared/Header';
import { getRuLegalDocMetas } from '@/lib/legal/ruLegalDocs';

export const metadata: Metadata = {
  alternates: {
    canonical: '/ru/legal'
  }
};

const RuLegalPage = async () => {
  const legalDocs = getRuLegalDocMetas();

  return (
    <div className="min-h-screen bg-white">
      <Header />
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
