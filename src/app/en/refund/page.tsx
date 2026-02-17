import type { Metadata } from 'next';
import LocalizedPageTopBar from '@/components/shared/LocalizedPageTopBar';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Refund Policy',
  description: 'Refund terms and the process for submitting a refund request.',
  canonical: '/en/refund',
  languages: {
    en: '/en/refund',
    ru: '/ru/refund'
  }
});

const RefundPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <LocalizedPageTopBar />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-primary mb-8">
          Refund Policy
        </h1>

        <div className="prose max-w-none">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-3">7-day refund guarantee</h2>
            <p className="text-lg text-gray-700">
              Full refund within 7 days from the date of purchase
            </p>
          </div>

          <div className="space-y-6">
            <section>
              <h3 className="text-xl font-semibold mb-3">Refund conditions</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Refund request must be submitted within 7 days</li>
                <li>Full course amount is refundable</li>
                <li>Refund processing time: 5-10 business days</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3">How to request a refund</h3>
              <p className="text-gray-700">
                Contact us by email or via WhatsApp/Telegram
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPage;
