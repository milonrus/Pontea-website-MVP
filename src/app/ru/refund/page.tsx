import type { Metadata } from 'next';
import LocalizedPageTopBar from '@/components/shared/LocalizedPageTopBar';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { isRuOnlyMode } from '@/lib/i18n/mode';

const ruOnlyMode = isRuOnlyMode();

export const metadata: Metadata = buildPageMetadata({
  title: 'Политика возврата',
  description: 'Условия возврата средств и порядок оформления заявки на возврат.',
  canonical: '/ru/refund',
  ...(ruOnlyMode
    ? {}
    : {
        languages: {
          en: '/en/refund',
          ru: '/ru/refund'
        }
      })
});

const RefundPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <LocalizedPageTopBar />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-primary mb-8">
          Политика возврата
        </h1>

        <div className="prose max-w-none">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-3">7-дневная гарантия возврата</h2>
            <p className="text-lg text-gray-700">
              Полный возврат средств в течение 7 дней с момента покупки
            </p>
          </div>

          <div className="space-y-6">
            <section>
              <h3 className="text-xl font-semibold mb-3">Условия возврата</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Запрос на возврат должен быть подан в течение 7 дней</li>
                <li>Возврат полной стоимости курса</li>
                <li>Обработка возврата: 5-10 рабочих дней</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3">Как запросить возврат</h3>
              <p className="text-gray-700">
                Напишите нам на email или через WhatsApp/Telegram
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RefundPage;
