import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    question: "Что такое TEST ARCHED?",
    answer: "TEST ARCHED - это вступительный экзамен на архитектурные программы в Италии, в первую очередь в Politecnico di Milano. Экзамен обязателен для поступления на бакалавриат по архитектуре и проводится в тестовом формате."
  },
  {
    question: "Для каких университетов нужен TEST ARCHED?",
    answer: "TEST ARCHED требуется для поступления на архитектуру в Politecnico di Milano (Polimi). Для Politecnico di Torino используется аналогичный экзамен TIL-A, но с другой структурой."
  },
  {
    question: "Чем отличается TEST ARCHED от TIL-A?",
    answer: "TEST ARCHED - экзамен Polimi.\nTIL-A - вступительный тест Politecnico di Torino.\nФормат и типы заданий схожи, но темы, логика вопросов и система оценки отличаются, поэтому подготовка должна быть разной."
  },
  {
    question: "Из чего состоит экзамен TEST ARCHED?",
    answer: "Экзамен TEST ARCHED состоит из 50 вопросов и длится 100 минут.\nТемы экзамена:\n- логика и понимание текста\n- общая культура и история\n- пространственное и графическое мышление\n- математика и основы физики\nВсе задания - с выбором одного правильного ответа."
  },
  {
    question: "Когда проходит TEST ARCHED?",
    answer: "TEST ARCHED обычно проходит летом (июнь-июль). Точные даты публикуются Politecnico di Milano ближе к экзамену. Подготовку рекомендуется начинать заранее."
  },
  {
    question: "Экзамен TEST ARCHED проходит онлайн или очно?",
    answer: "Формат экзамена может меняться. В последние годы TEST ARCHED чаще проводится в компьютерном формате в экзаменационных центрах. Мы готовим к обоим форматам."
  },
  {
    question: "Отличается ли TEST ARCHED для студентов из ЕС и не-ЕС?",
    answer: "Сам экзамен одинаковый для всех абитуриентов. Отличается только процесс подачи документов и участие в конкурсном рейтинге."
  },
  {
    question: "Есть ли проходной балл на TEST ARCHED?",
    answer: "Фиксированного проходного балла нет. Зачисление происходит по рейтингу, который формируется на основе результатов всех участников экзамена."
  },
  {
    question: "Сколько баллов нужно набрать, чтобы поступить?",
    answer: "Минимальный балл меняется каждый год и зависит от конкурса. Чтобы поступить, важно набрать максимально возможный результат, а не ориентироваться на условный «порог»."
  },
  {
    question: "Когда лучше начинать подготовку к TEST ARCHED?",
    answer: "Оптимальный срок подготовки - 6-9 месяцев до экзамена. Это позволяет спокойно разобрать все темы и отработать формат теста. Возможна и интенсивная подготовка за более короткий срок."
  },
  {
    question: "Подходит ли курс для подготовки к TIL-A?",
    answer: "Да. Курс подходит для подготовки к TIL-A Politecnico di Torino, с учетом структуры и требований именно этого экзамена."
  },
  {
    question: "Есть ли в курсе пробные тесты TEST ARCHED?",
    answer: "Да. В курсе есть пробные экзамены, тренировочные тесты и банк вопросов, приближенные к формату TEST ARCHED и TIL-A."
  },
  {
    question: "Чем онлайн-курс подготовки к TEST ARCHED лучше самостоятельной подготовки?",
    answer: "Онлайн-курс дает:\n- структурированную программу подготовки\n- персональный учебный план\n- контроль прогресса\n- тренировку реального формата экзамена\nЭто снижает риск ошибок и экономит время."
  },
  {
    question: "На каком языке проходит обучение?",
    answer: "Обучение доступно на русском и английском языках. Курс подходит для международных абитуриентов, поступающих в итальянские университеты."
  },
  {
    question: "Можно ли вернуть деньги за курс?",
    answer: "Да. Мы предоставляем период полного возврата, если курс вам не подойдет."
  },
  {
    question: "Подходит ли курс для поступления в Politecnico di Milano?",
    answer: "Да. Курс разработан специально для подготовки к TEST ARCHED Politecnico di Milano и охватывает все темы экзамена."
  }
];

const FAQ_STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }))
};

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="section-padding bg-white border-t border-gray-100" aria-labelledby="faq-heading">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_STRUCTURED_DATA) }}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-bold uppercase tracking-wider mb-4 border border-blue-100">
            <HelpCircle className="w-3 h-3" />
            Поддержка
          </div>
          <h2 id="faq-heading" className="text-3xl md:text-5xl font-display font-bold text-primary mb-6">
            FAQ по TEST ARCHED и TIL-A
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Ответы на частые вопросы про экзамен, формат, сроки и подготовку к архитектурным программам в Италии.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-blue-200 transition-colors"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                aria-expanded={openIndex === idx}
                aria-controls={`faq-answer-${idx}`}
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
                    id={`faq-answer-${idx}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-100 pt-4 whitespace-pre-line">
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
