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
    question:
      locale === 'en'
        ? "What is TEST ARCHED (Italy architecture entrance exam)?"
        : "Что такое TEST ARCHED (вступительный тест на архитектуру в Италии)?",
    answer:
      locale === 'en'
        ? "TEST ARCHED is a CISIA-managed entrance exam used for admission to Architecture and Building Engineering-Architecture programmes in Italy. Many applicants search for it as \"architecture entrance exam Italy\". At Politecnico di Milano (Polimi), the compulsory admission test is called the ARCHED test."
        : "TEST ARCHED - это вступительный тест CISIA для поступления на Architecture и Building Engineering-Architecture в Италии. Его часто ищут как «вступительный экзамен на архитектуру в Италии». В Politecnico di Milano (Polimi) обязательный тест называется ARCHED."
  },
  {
    question:
      locale === 'en'
        ? "Which universities require TEST ARCHED / ARCHED / TIL-A for Architecture in Italy?"
        : "Какие университеты требуют TEST ARCHED / ARCHED / TIL-A для архитектуры в Италии?",
    answer:
      locale === 'en'
        ? "Politecnico di Milano requires the ARCHED test for Architecture-related admission routes. CISIA's TEST ARCHED is adopted by several Italian universities for architecture admissions. Politecnico di Torino (Polito) uses its own test called TIL-A (Architecture). Always verify your target programme's Call for Admissions because rules, dates, and seats can differ by university and by EU/non-EU category."
        : "Politecnico di Milano требует тест ARCHED для поступления на архитектурные направления. TEST ARCHED от CISIA используется рядом университетов Италии для admissions на архитектуру. Politecnico di Torino (Polito) проводит свой тест TIL-A (Architecture). Всегда проверяйте Call/Bando выбранной программы: правила, даты и квоты мест часто отличаются (особенно для EU/non-EU)."
  },
  {
    question:
      locale === 'en'
        ? "ARCHED (Polimi) vs TIL-A (Polito): what's the difference and how to prepare?"
        : "ARCHED (Polimi) и TIL-A (Polito): чем отличаются и как готовиться?",
    answer:
      locale === 'en'
        ? "ARCHED (Politecnico di Milano) and TIL-A (Politecnico di Torino) follow the ministerial test model: 50 multiple-choice questions in 100 minutes across 5 sections. The biggest differences are usually administrative (registration platform, test dates/venue/remote vs in-person, ranking rules and seat quotas). Preparation should still be tailored to the specific university's official instructions and typical question style."
        : "ARCHED (Politecnico di Milano) и TIL-A (Politecnico di Torino) построены по министерской модели: 50 вопросов с выбором ответа за 100 минут, 5 секций. Основные отличия чаще административные: регистрация, даты/формат (очно или удаленно), правила рейтинга и квоты мест. Готовиться лучше под конкретный университет и его официальные инструкции."
  },
  {
    question:
      locale === 'en'
        ? "TEST ARCHED structure: how many questions, how many minutes, what topics?"
        : "Структура TEST ARCHED: сколько вопросов, сколько минут, какие темы?",
    answer:
      locale === 'en'
        ? "The standard structure is 50 multiple-choice questions in 100 minutes (max 50 points). Sections: Reading comprehension; Knowledge/History (including art history); Logical reasoning; Drawing & Representation; Physics & Mathematics. Each section is timed."
        : "Стандартная структура: 50 вопросов (multiple choice) за 100 минут (максимум 50 баллов). Секции: понимание текста; знания/история (включая историю искусства); логика; Drawing & Representation (графика/представление); физика и математика. Каждая секция обычно идет с лимитом времени."
  },
  {
    question:
      locale === 'en'
        ? "When is the ARCHED / TEST ARCHED exam date?"
        : "Когда проходит экзамен ARCHED / TEST ARCHED?",
    answer:
      locale === 'en'
        ? "Dates depend on the university and the academic year. For example, Politecnico di Milano scheduled ARCHED sessions in late July for the 2025/26 intake (English and Italian on different days). For Polito TIL-A, dates are announced in the annual Call for Applications. Always rely on the official Call/Bando for your year."
        : "Даты зависят от университета и конкретного года. Например, Politecnico di Milano ставил ARCHED на конец июля для набора 2025/26 (отдельные дни для English и Italian). Для Polito (TIL-A) даты публикуются в ежегодном Call/Bando. Всегда ориентируйтесь на официальный Call вашего года."
  },
  {
    question:
      locale === 'en'
        ? "Is TEST ARCHED online (TEST@HOME) or in person (TEST@UNI)?"
        : "TEST ARCHED проходит онлайн (TEST@HOME) или очно (TEST@UNI)?",
    answer:
      locale === 'en'
        ? "It can be either. CISIA supports both TEST@HOME (remote) and TEST@UNI (in university computer labs). Your target university will state the exact format in its Call for Admissions and technical requirements."
        : "Возможны оба варианта. CISIA поддерживает TEST@HOME (удаленно) и TEST@UNI (очно в компьютерных аудиториях). Точный формат и техтребования всегда указаны в Call/Bando университета."
  },
  {
    question:
      locale === 'en'
        ? "Is the architecture entrance test different for EU vs non-EU applicants?"
        : "Отличается ли тест для EU и non-EU абитуриентов на архитектуру в Италии?",
    answer:
      locale === 'en'
        ? "The test content is usually the same, but universities often apply different deadlines, document checks, and seat quotas for EU/Italian-equivalent vs non-EU applicants. This impacts ranking and admission outcomes."
        : "Содержание теста обычно одинаковое, но часто различаются дедлайны, проверка документов и квоты мест для EU/«equivalent» и non-EU. Это влияет на конкурс, рейтинг и итог зачисления."
  },
  {
    question:
      locale === 'en'
        ? "Is there a passing score for TEST ARCHED / ARCHED?"
        : "Есть ли проходной балл на TEST ARCHED / ARCHED?",
    answer:
      locale === 'en'
        ? "Usually there is no fixed passing score. Admission is based on a ranking: seats are assigned in score order (and sometimes by stated preferences), until places are filled."
        : "Обычно фиксированного проходного балла нет. Поступление идет по рейтингу: места распределяются по баллам (и иногда по выбранным приоритетам), пока квота не будет заполнена."
  },
  {
    question:
      locale === 'en'
        ? "How many points do I need for Polimi Architecture (ARCHED) or Polito Architecture (TIL-A)?"
        : "Сколько баллов нужно для поступления в Polimi (ARCHED) или Polito (TIL-A)?",
    answer:
      locale === 'en'
        ? "It changes every year depending on competition and seat availability. Instead of targeting a \"minimum\", the goal is to maximize your score (the test is typically scored up to 50 points) and practice under real time limits."
        : "Меняется каждый год из-за конкурса и количества мест. Поэтому важнее не искать «минимум», а набирать максимум (обычно максимум - 50 баллов) и тренироваться в реальном тайминге."
  },
  {
    question:
      locale === 'en'
        ? "When should I start preparing for the architecture entrance exam in Italy (TEST ARCHED / ARCHED / TIL-A)?"
        : "Когда начинать подготовку к вступительному экзамену на архитектуру в Италии (TEST ARCHED / ARCHED / TIL-A)?",
    answer:
      locale === 'en'
        ? "Most applicants start 6-9 months before the exam to cover all sections (logic, reading, art/history, drawing/representation, math/physics) and build speed. If your base is strong, an intensive plan can still work."
        : "Большинство начинают за 6-9 месяцев, чтобы закрыть все секции (логика, текст, история/история искусства, drawing/representation, математика/физика) и развить скорость. При сильной базе возможен и интенсив."
  },
  {
    question:
      locale === 'en'
        ? "Does the course prepare for TIL-A Politecnico di Torino as well?"
        : "Подходит ли курс для подготовки к TIL-A Politecnico di Torino?",
    answer:
      locale === 'en'
        ? "Yes. We prepare for the same 5-section structure and focus on timed practice, typical question patterns, and strategy (when to skip vs answer)."
        : "Да. Мы готовим под ту же 5-секционную структуру и делаем упор на таймированную практику, типовые паттерны задач и стратегию (когда отвечать, когда пропускать)."
  },
  {
    question:
      locale === 'en'
        ? "Are there mock exams and simulations for TEST ARCHED / ARCHED / TIL-A?"
        : "Есть ли пробные тесты и симуляции TEST ARCHED / ARCHED / TIL-A?",
    answer:
      locale === 'en'
        ? "Yes. The course includes mock exams (simulations), practice tests, and a question bank aligned with ARCHED/TIL-A sections and timing."
        : "Да. В курсе есть пробные экзамены (симуляции), тренировочные тесты и банк вопросов под секции и тайминг ARCHED/TIL-A."
  },
  {
    question:
      locale === 'en'
        ? "Why choose an online TEST ARCHED prep course instead of self-study?"
        : "Почему онлайн-курс подготовки к TEST ARCHED лучше самостоятельной подготовки?",
    answer:
      locale === 'en'
        ? "Because you get a structured plan + feedback + timed exam simulations. Most failures happen due to poor time management, weak sections (often logic or drawing/representation), and lack of realistic practice."
        : "Потому что вы получаете структуру + обратную связь + таймированные симуляции. Чаще всего провалы происходят из-за тайм-менеджмента, слабых секций (часто логика или drawing/representation) и отсутствия практики «как на экзамене»."
  },
  {
    question:
      locale === 'en'
        ? "What language is the ARCHED / TIL-A exam and the prep course in?"
        : "На каком языке экзамен ARCHED / TIL-A и курс подготовки?",
    answer:
      locale === 'en'
        ? "The course is available in Russian and English. Exam language depends on the university and the specific intake (some sessions are offered in Italian and/or English). Always check your programme's official Call."
        : "Курс доступен на русском и английском. Язык экзамена зависит от университета и набора (часто бывают сессии на Italian и/или English). Всегда сверяйтесь с официальным Call выбранной программы."
  },
  {
    question:
      locale === 'en'
        ? "Is this course suitable for Politecnico di Milano Architecture admission (ARCHED)?"
        : "Подходит ли курс для поступления на архитектуру в Politecnico di Milano (ARCHED)?",
    answer:
      locale === 'en'
        ? "Yes. The course is built around the ARCHED/TEST ARCHED structure: 5 sections, official timing, and exam-style practice."
        : "Да. Курс выстроен под структуру ARCHED/TEST ARCHED: 5 секций, официальный тайминг и практика в формате экзамена."
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
