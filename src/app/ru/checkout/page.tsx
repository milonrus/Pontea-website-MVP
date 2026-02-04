"use client";

const CheckoutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-primary mb-8">
          Оформление заказа
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Оплата</h2>
            <p className="text-gray-600 mb-4">
              Оплата российской картой в рублях по курсу провайдера на момент оплаты.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold mb-2">Что вы получите:</h3>
            <ul className="space-y-1 text-sm">
              <li>✓ Доступ к платформе сразу после оплаты</li>
              <li>✓ Ссылка-приглашение на email/WhatsApp/Telegram</li>
              <li>✓ 7-дневная гарантия возврата</li>
            </ul>
          </div>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Интеграция с платежным провайдером</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
