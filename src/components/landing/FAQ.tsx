import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  locale?: 'en' | 'ru';
}

const getFaqs = (locale: 'en' | 'ru' = 'ru'): FAQItem[] => [
  {
    question: locale === 'en' ? "What is TEST ARCHED?" : "Что такое TEST ARCHED?",
    answer: locale === 'en' ? "TEST ARCHED is the entrance exam for architecture programs in Italy, primarily at Politecnico di Milano. It is mandatory for undergraduate architecture admission and conducted in a multiple-choice format." : "TEST ARCHED - это вступительный экзамен на архитектурные программы в Италии, в первую очередь в Politecnico di Milano. Экзамен обязателен для поступления на бакалавриат по архитектуре и проводится в тестовом формате."
  },
  {
    question: locale === 'en' ? "Which universities require TEST ARCHED?" : "Для каких университетов нужен TEST ARCHED?",
    answer: locale === 'en' ? "TEST ARCHED is required for admission to architecture at Politecnico di Milano (Polimi). Politecnico di Torino uses a similar exam called TIL-A, but with a different structure." : "TEST ARCHED требуется для поступления на архитектуру в Politecnico di Milano (Polimi). Для Politecnico di Torino используется аналогичный экзамен TIL-A, но с другой структурой."
  },
  {
    question: locale === 'en' ? "How does TEST ARCHED differ from TIL-A?" : "Чем отличается TEST ARCHED от TIL-A?",
    answer: locale === 'en' ? "TEST ARCHED is Polimi's exam. TIL-A is the entrance test for Politecnico di Torino. The format and question types are similar, but the topics, question logic, and scoring system differ — so preparation should be tailored to each." : "TEST ARCHED - экзамен Polimi.\nTIL-A - вступительный тест Politecnico di Torino.\nФормат и типы заданий схожи, но темы, логика вопросов и система оценки отличаются, поэтому подготовка должна быть разной."
  },
  {
    question: locale === 'en' ? "What does the TEST ARCHED exam consist of?" : "Из чего состоит экзамен TEST ARCHED?",
    answer: locale === 'en' ? "The exam has 50 questions and lasts 100 minutes. Topics: logical reasoning and reading comprehension, general culture and history, spatial and graphic thinking, math and basic physics. All questions are single-answer multiple choice." : "Экзамен TEST ARCHED состоит из 50 вопросов и длится 100 минут.\nТемы экзамена:\n- логика и понимание текста\n- общая культура и история\n- пространственное и графическое мышление\n- математика и основы физики\nВсе задания - с выбором одного правильного ответа."
  },
  {
    question: locale === 'en' ? "When does TEST ARCHED take place?" : "Когда проходит TEST ARCHED?",
    answer: locale === 'en' ? "TEST ARCHED typically takes place in summer (June–July). Exact dates are published by Politecnico di Milano closer to the exam. It's recommended to start preparing well in advance." : "TEST ARCHED обычно проходит летом (июнь-июль). Точные даты публикуются Politecnico di Milano ближе к экзамену. Подготовку рекомендуется начинать заранее."
  },
  {
    question: locale === 'en' ? "Is TEST ARCHED online or in person?" : "Экзамен TEST ARCHED проходит онлайн или очно?",
    answer: locale === 'en' ? "The exam format can change. In recent years, TEST ARCHED has most often been held in a computer-based format at exam centers. We prepare students for both formats." : "Формат экзамена может меняться. В последние годы TEST ARCHED чаще проводится в компьютерном формате в экзаменационных центрах. Мы готовим к обоим форматам."
  },
  {
    question: locale === 'en' ? "Is TEST ARCHED different for EU and non-EU students?" : "Отличается ли TEST ARCHED для студентов из ЕС и не-ЕС?",
    answer: locale === 'en' ? "The exam itself is the same for all applicants. The difference lies in the application process and participation in the competitive ranking." : "Сам экзамен одинаковый для всех абитуриентов. Отличается только процесс подачи документов и участие в конкурсном рейтинге."
  },
  {
    question: locale === 'en' ? "Is there a passing score for TEST ARCHED?" : "Есть ли проходной балл на TEST ARCHED?",
    answer: locale === 'en' ? "There is no fixed passing score. Admission is based on a ranking formed from the results of all participants." : "Фиксированного проходного балла нет. Зачисление происходит по рейтингу, который формируется на основе результатов всех участников экзамена."
  },
  {
    question: locale === 'en' ? "How many points do I need to get in?" : "Сколько баллов нужно набрать, чтобы поступить?",
    answer: locale === 'en' ? "The minimum score changes each year and depends on competition. The goal is to score as high as possible, not to aim for a fixed threshold." : "Минимальный балл меняется каждый год и зависит от конкурса. Чтобы поступить, важно набрать максимально возможный результат, а не ориентироваться на условный «порог»."
  },
  {
    question: locale === 'en' ? "When should I start preparing for TEST ARCHED?" : "Когда лучше начинать подготовку к TEST ARCHED?",
    answer: locale === 'en' ? "The optimal preparation period is 6–9 months before the exam. This allows you to cover all topics and practice the test format calmly. Intensive short-term preparation is also possible." : "Оптимальный срок подготовки - 6-9 месяцев до экзамена. Это позволяет спокойно разобрать все темы и отработать формат теста. Возможна и интенсивная подготовка за более короткий срок."
  },
  {
    question: locale === 'en' ? "Does the course also prepare for TIL-A?" : "Подходит ли курс для подготовки к TIL-A?",
    answer: locale === 'en' ? "Yes. The course is suitable for preparing for TIL-A at Politecnico di Torino, taking into account the structure and requirements of that specific exam." : "Да. Курс подходит для подготовки к TIL-A Politecnico di Torino, с учетом структуры и требований именно этого экзамена."
  },
  {
    question: locale === 'en' ? "Are there mock TEST ARCHED exams in the course?" : "Есть ли в курсе пробные тесты TEST ARCHED?",
    answer: locale === 'en' ? "Yes. The course includes mock exams, practice tests, and a question bank modeled on the TEST ARCHED and TIL-A format." : "Да. В курсе есть пробные экзамены, тренировочные тесты и банк вопросов, приближенные к формату TEST ARCHED и TIL-A."
  },
  {
    question: locale === 'en' ? "Why is an online prep course better than self-study?" : "Чем онлайн-курс подготовки к TEST ARCHED лучше самостоятельной подготовки?",
    answer: locale === 'en' ? "An online course provides: a structured preparation program, a personalized study plan, progress monitoring, and realistic exam format practice. This reduces the risk of mistakes and saves time." : "Онлайн-курс дает:\n- структурированную программу подготовки\n- персональный учебный план\n- контроль прогресса\n- тренировку реального формата экзамена\nЭто снижает риск ошибок и экономит время."
  },
  {
    question: locale === 'en' ? "What language is the course taught in?" : "На каком языке проходит обучение?",
    answer: locale === 'en' ? "The course is available in both Russian and English. It is suitable for international applicants to Italian universities." : "Обучение доступно на русском и английском языках. Курс подходит для международных абитуриентов, поступающих в итальянские университеты."
  },
  {
    question: locale === 'en' ? "Can I get a refund?" : "Можно ли вернуть деньги за курс?",
    answer: locale === 'en' ? "Yes. We offer a full refund period if the course isn't right for you." : "Да. Мы предоставляем период полного возврата, если курс вам не подойдет."
  },
  {
    question: locale === 'en' ? "Is the course suitable for admission to Politecnico di Milano?" : "Подходит ли курс для поступления в Politecnico di Milano?",
    answer: locale === 'en' ? "Yes. The course is designed specifically for preparing for the TEST ARCHED exam at Politecnico di Milano and covers all exam topics." : "Да. Курс разработан специально для подготовки к TEST ARCHED Politecnico di Milano и охватывает все темы экзамена."
  }
];

const translations = {
  en: {
    badge: 'Support',
    heading: 'FAQ: TEST ARCHED and TIL-A',
    subtitle: 'Answers to common questions about the exam, format, timeline, and preparation for architecture programs in Italy.',
  },
  ru: {
    badge: 'Поддержка',
    heading: 'FAQ по TEST ARCHED и TIL-A',
    subtitle: 'Ответы на частые вопросы про экзамен, формат, сроки и подготовку к архитектурным программам в Италии.',
  },
};

const FAQ: React.FC<FAQProps> = ({ locale = 'ru' }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const FAQS = getFaqs(locale);
  const t = translations[locale];

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

  return (
    <section id="faq" className="section-padding bg-white border-t border-gray-100" aria-labelledby="faq-heading">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_STRUCTURED_DATA) }}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-bold uppercase tracking-wider mb-4 border border-blue-100">
            <HelpCircle className="w-3 h-3" />
            {t.badge}
          </div>
          <h2 id="faq-heading" className="text-2xl sm:text-3xl md:text-5xl font-display font-bold text-primary mb-6">
            {t.heading}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t.subtitle}
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
