import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    question: "Этот курс для итальянского или английского экзамена?",
    answer: "Для обоих. Мы даем отдельные треки подготовки для итальянского экзамена (Test di Architettura) и для английского экзамена (Architecture Design). Переключаться между языками можно в личном кабинете в любой момент."
  },
  {
    question: "Как работает «Knowledge Matrix»?",
    answer: "В отличие от обычных курсов, где вы видите только общий балл, мы отслеживаем ваш уровень по 5 направлениям. Мы точно показываем, какие «блоки знаний» (например, Ренессанс в истории искусства или логические импликации) у вас проседают, чтобы вы закрывали пробелы точечно и быстрее."
  },
  {
    question: "Можно ли платить в рассрочку?",
    answer: "Да. Для тарифов «Полный курс» и VIP доступна рассрочка на 3 или 4 месяца через Klarna или PayPal Pay Later без дополнительной переплаты."
  },
  {
    question: "Что будет, если я не сдам экзамен?",
    answer: "Если вы проходите 90% материалов курса и не сдаете экзамен, действует гарантия «Second Chance». Вы получаете бесплатный доступ к платформе на следующий цикл подготовки."
  },
  {
    question: "Нужно ли покупать учебники?",
    answer: "Нет. На платформе уже есть подробные цифровые конспекты, саммари и листы с формулами (250+ страниц), которые покрывают всю программу, утвержденную министерством (MUR)."
  }
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="section-padding bg-white border-t border-gray-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-bold uppercase tracking-wider mb-4 border border-blue-100">
            <HelpCircle className="w-3 h-3" />
            Поддержка
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-primary mb-6">
            Частые вопросы
          </h2>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-blue-200 transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
              >
                <span className={`font-bold text-lg ${openIndex === idx ? 'text-primary' : 'text-gray-700'}`}>
                  {faq.question}
                </span>
                <span className={`
                  flex-shrink-0 ml-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                  ${openIndex === idx ? 'bg-primary text-white rotate-180' : 'bg-gray-100 text-gray-500'}
                `}>
                  {openIndex === idx ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </span>
              </button>

              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
