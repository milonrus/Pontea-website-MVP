import type { Metadata } from 'next';
import LocalizedPageTopBar from '@/components/shared/LocalizedPageTopBar';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'For Parents',
  description:
    'A page for parents about study format, progress tracking, and student support.',
  canonical: '/en/for-parents',
  languages: {
    en: '/en/for-parents',
    ru: '/ru/for-parents'
  }
});

const ForParentsPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <LocalizedPageTopBar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-primary mb-8">
          For Parents
        </h1>

        <div className="prose max-w-none">
          <p className="text-xl text-gray-600 mb-8">
            Information for parents: trust, transparency, and clear guarantees
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Parent focus:</h2>
            <ul className="space-y-2">
              <li>Progress visibility</li>
              <li>Mentor support</li>
              <li>Refund guarantee (7 days)</li>
              <li>Learning supervision</li>
              <li>Saturday school (discipline)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForParentsPage;
