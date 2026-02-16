import type { Metadata } from 'next';
import LocalizedPageTopBar from '@/components/shared/LocalizedPageTopBar';
import { buildPageMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Thank You for Registration',
  description: 'Thank you for registering with PONTEA School.',
  canonical: '/en/thank-you',
  languages: {
    en: '/en/thank-you',
    ru: '/ru/thank-you'
  },
  robots: {
    index: false,
    follow: false
  }
});

const ThankYouPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <LocalizedPageTopBar />
      <div className="max-w-2xl mx-auto px-4 py-12 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-4xl font-bold text-primary mb-4">
            Thank you for your purchase!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Welcome to PONTEA School
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 text-left">
            <h2 className="text-xl font-semibold mb-4">What happens next?</h2>
            <ol className="space-y-3">
              <li className="flex items-start">
                <span className="font-semibold mr-2">1.</span>
                <span>Check your email/WhatsApp/Telegram</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">2.</span>
                <span>Accept the platform invitation</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">3.</span>
                <span>Start with the first lesson</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">4.</span>
                <span>Join the support chat</span>
              </li>
            </ol>
          </div>

          <div className="text-gray-600 text-sm">
            <p>Need help? Message us on WhatsApp or Telegram</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;
