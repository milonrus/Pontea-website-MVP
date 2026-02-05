"use client";

const ForParentsPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-primary mb-8">
          Для родителей
        </h1>

        <div className="prose max-w-none">
          <p className="text-xl text-gray-600 mb-8">
            Страница для родителей: доверие, контроль, гарантии
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Фокус для родителей:</h2>
            <ul className="space-y-2">
              <li>Видимость прогресса</li>
              <li>Менторская поддержка</li>
              <li>Гарантия возврата (7 дней)</li>
              <li>Контроль за обучением</li>
              <li>Субботняя школа (дисциплина)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForParentsPage;
