import type { Metadata } from 'next';
import LocalizedPageTopBar from '@/components/shared/LocalizedPageTopBar';

export const metadata: Metadata = {
  alternates: {
    canonical: '/ru/privacy'
  }
};

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <LocalizedPageTopBar />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-primary mb-8">
          Политика конфиденциальности
        </h1>

        <div className="prose max-w-none">
          <p className="text-gray-600 mb-8">
            Как мы собираем, используем и защищаем ваши данные
          </p>

          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-3">1. Сбор информации</h2>
              <p className="text-gray-700">
                Мы собираем информацию, которую вы предоставляете при регистрации и использовании платформы.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">2. Использование данных</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Предоставление доступа к курсу</li>
                <li>Обработка платежей</li>
                <li>Коммуникация и поддержка</li>
                <li>Улучшение качества обучения</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">3. Защита данных</h2>
              <p className="text-gray-700">
                Мы используем современные методы защиты для обеспечения безопасности ваших данных.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">4. Ваши права</h2>
              <p className="text-gray-700">
                Вы имеете право на доступ, исправление и удаление ваших персональных данных.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
