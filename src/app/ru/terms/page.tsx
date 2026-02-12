import type { Metadata } from 'next';
import LocalizedPageTopBar from '@/components/shared/LocalizedPageTopBar';

export const metadata: Metadata = {
  alternates: {
    canonical: '/ru/terms'
  }
};

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <LocalizedPageTopBar />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-primary mb-8">
          Условия использования
        </h1>

        <div className="prose max-w-none">
          <p className="text-gray-600 mb-8">
            Условия предоставления услуг PONTEA School
          </p>

          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-3">1. Предмет соглашения</h2>
              <p className="text-gray-700">
                [Содержимое условий использования]
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">2. Права и обязанности</h2>
              <p className="text-gray-700">
                [Содержимое условий использования]
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">3. Доступ к курсу</h2>
              <p className="text-gray-700">
                Доступ предоставляется до даты экзамена + 1 месяц
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
