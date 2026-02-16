import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  id: 'course' | 'test';
  badge: string;
  title: string;
  subtitle: string;
  faqs: FAQItem[];
}

interface FAQProps {
  locale?: 'en' | 'ru';
}

const getCourseFaqs = (locale: 'en' | 'ru' = 'ru'): FAQItem[] => [
  {
    question:
      locale === 'en'
        ? 'Is this course suitable if I have not decided between Polimi and PoliTo yet?'
        : 'Подойдет ли мне курс, если я еще не определился с вузом (Polimi или PoliTo)?',
    answer:
      locale === 'en'
        ? 'Yes. The program covers requirements for both exams (TEST ARCHED and TIL-A). We give a universal foundation across all 5 sections, and during strategy sessions and mentor consultations we help you prioritize a university based on your mock test scores.'
        : 'Да. Программа курса покрывает требования обоих экзаменов (TEST ARCHED и TIL-A). Мы даем универсальную базу по всем 5 разделам, а на стратегических сессиях и консультациях с ментором помогаем выбрать приоритетный университет на основе ваших пробных баллов.'
  },
  {
    question:
      locale === 'en'
        ? 'My math/physics level is weak. Can I still handle it?'
        : 'У меня слабый уровень математики/физики. Я справлюсь?',
    answer:
      locale === 'en'
        ? 'The course is designed for preparation from zero. We do not just give formulas, we explain the logic behind exam-style problems. For students who need more attention, ADVANCED and MENTORSHIP plans include deeper reviews with instructors.'
        : 'Наш курс рассчитан на подготовку с нуля. Мы не просто даем формулы, а объясняем логику решения задач, которые встречаются именно во вступительных тестах. Для тех, кому нужно больше внимания, в тарифах ADVANCED и MENTORSHIP предусмотрены разборы с преподавателями.'
  },
  {
    question:
      locale === 'en'
        ? 'What language is the course delivered in?'
        : 'На каком языке проходит обучение?',
    answer:
      locale === 'en'
        ? 'The course is available in two languages. Communication, announcements, and strategy sessions are in Russian. Theory and practice are mostly in English: terminology, tests, and lectures are adapted so that you can both pass the exam and feel confident in your first university classes.'
        : 'Материал обучения предусмотрен на двух языках. На русском языке - коммуникация, объявления, стратегические сессии. Теория и практика, в основном, на английском языке - весь материал (терминология, тесты, лекции) адаптирован так, чтобы вы не только сдали экзамен, но и комфортно чувствовали себя на первых лекциях в университете.'
  },
  {
    question:
      locale === 'en'
        ? 'Can I pay in installments?'
        : 'Можно ли оплатить курс частями?',
    answer:
      locale === 'en'
        ? 'Yes. We understand this is a serious investment in your future. Installment plans are available for all packages. If checkout did not work on the site, contact support.'
        : 'Да, мы понимаем, что это серьезная инвестиция в ваше будущее. У нас предусмотрена рассрочка для всех тарифов - если не получилось оформить на сайте, напишите нам в поддержку.'
  },
  {
    question:
      locale === 'en'
        ? 'Can I upgrade my plan during the course?'
        : 'Могу ли я повысить тариф в процессе обучения?',
    answer:
      locale === 'en'
        ? 'Yes. You can upgrade your plan by paying only the difference. Many students start independently, but later decide they want mentor support and Saturday review sessions.'
        : 'Да, вы можете сделать апгрейд тарифа, просто доплатив разницу. Многие студенты начинают самостоятельно, но со временем понимают, что им нужна поддержка ментора и субботние разборы.'
  },
  {
    question:
      locale === 'en'
        ? 'How much time per week should I plan for preparation?'
        : 'Сколько времени в неделю мне нужно выделять на подготовку?',
    answer:
      locale === 'en'
        ? 'For a solid result, we recommend 6 to 10 hours per week. This includes watching lectures, doing homework, and attending live sessions.'
        : 'Для качественного результата мы рекомендуем уделять курсу от 6 до 10 часов в неделю. Это включает просмотр лекций, выполнение домашних заданий и участие в живых сессиях.'
  },
  {
    question:
      locale === 'en'
        ? 'Who are mentors and how do they help?'
        : 'Кто такие менторы и как они помогают?',
    answer:
      locale === 'en'
        ? 'Our mentors are students or graduates of top architecture universities in Italy (Polimi, PoliTo) who have already gone through this path. They do not just check homework: they share practical life in Italy, help you keep motivation, and make sure you stay on your study plan.'
        : 'Наши менторы - это студенты или выпускники топовых архитектурных вузов Италии (Polimi, PoliTo), которые сами прошли этот путь. Они не просто проверяют ДЗ, а делятся внутренней кухней жизни в Италии, помогают не терять мотивацию и следят, чтобы вы не сбивались с учебного плана.'
  },
  {
    question:
      locale === 'en'
        ? 'What about documents and visa? Do you help with that?'
        : 'А что делать с документами и визой? Вы помогаете?',
    answer:
      locale === 'en'
        ? 'Our core focus is academic preparation. However, in chats on the Basic and Individual plans, we also discuss bureaucratic steps and help you avoid critical deadline mistakes.'
        : 'Основной фокус нашей школы - академическая подготовка. Однако в чатах на тарифах "Основной" и "Индивидуальный" мы обсуждаем и помогаем с бюрократическими этапами, чтобы вы не допустили критических ошибок в дедлайнах.'
  }
];

const getTestFaqs = (locale: 'en' | 'ru' = 'ru'): FAQItem[] => [
  {
    question:
      locale === 'en'
        ? 'What is Arched Test (Italy architecture entrance exam)?'
        : 'Что такое Arched Test (вступительный тест на архитектуру в Италии)?',
    answer:
      locale === 'en'
        ? 'Arched Test is a CISIA-managed entrance exam used for admission to Architecture and Building Engineering-Architecture programmes in Italy. Many applicants search for it as "architecture entrance exam Italy". At Politecnico di Milano (Polimi), the compulsory admission test is called Arched Test.'
        : 'Arched Test - это вступительный тест CISIA для поступления на Architecture и Building Engineering-Architecture в Италии. Его часто ищут как «вступительный экзамен на архитектуру в Италии». В Politecnico di Milano (Polimi) обязательный тест называется Arched Test.'
  },
  {
    question:
      locale === 'en'
        ? 'Which universities require Arched Test and TIL-A for Architecture in Italy?'
        : 'Какие университеты требуют Arched Test и TIL-A для архитектуры в Италии?',
    answer:
      locale === 'en'
        ? "Politecnico di Milano requires Arched Test for Architecture-related admission routes. CISIA's Arched Test is adopted by several Italian universities for architecture admissions. Politecnico di Torino (Polito) uses its own test called TIL-A (Architecture). Always verify your target programme's Call for Admissions because rules, dates, and seats can differ by university and by EU/non-EU category."
        : 'Politecnico di Milano требует Arched Test для поступления на архитектурные направления. Arched Test от CISIA используется рядом университетов Италии для admissions на архитектуру. Politecnico di Torino (Polito) проводит свой тест TIL-A (Architecture). Всегда проверяйте Call/Bando выбранной программы: правила, даты и квоты мест часто отличаются (особенно для EU/non-EU).'
  },
  {
    question:
      locale === 'en'
        ? 'Arched Test (Polimi) and TIL-A (Polito): what is the difference and how to prepare?'
        : 'Arched Test (Polimi) и TIL-A (Polito): чем отличаются и как готовиться?',
    answer:
      locale === 'en'
        ? "Arched Test (Politecnico di Milano) and TIL-A (Politecnico di Torino) follow the ministerial test model: 50 multiple-choice questions in 100 minutes across 5 sections. The biggest differences are usually administrative (registration platform, test dates/venue/remote vs in-person, ranking rules and seat quotas). Preparation should still be tailored to the specific university's official instructions and typical question style."
        : 'Arched Test (Politecnico di Milano) и TIL-A (Politecnico di Torino) построены по министерской модели: 50 вопросов с выбором ответа за 100 минут, 5 секций. Основные отличия чаще административные: регистрация, даты/формат (очно или удаленно), правила рейтинга и квоты мест. Готовиться лучше под конкретный университет и его официальные инструкции.'
  },
  {
    question:
      locale === 'en'
        ? 'Arched Test structure: how many questions, how many minutes, what topics?'
        : 'Структура Arched Test: сколько вопросов, сколько минут, какие темы?',
    answer:
      locale === 'en'
        ? 'The standard structure is 50 multiple-choice questions in 100 minutes (max 50 points). Sections: Reading comprehension; Knowledge/History (including art history); Logical reasoning; Drawing & Representation; Physics & Mathematics. Each section is timed.'
        : 'Стандартная структура: 50 вопросов (multiple choice) за 100 минут (максимум 50 баллов). Секции: понимание текста; знания/история (включая историю искусства); логика; Drawing & Representation (графика/представление); физика и математика. Каждая секция обычно идет с лимитом времени.'
  },
  {
    question:
      locale === 'en'
        ? 'When are Arched Test and TIL-A exam dates?'
        : 'Когда проходят экзамены Arched Test и TIL-A?',
    answer:
      locale === 'en'
        ? 'Dates depend on the university and the academic year. For example, Politecnico di Milano scheduled Arched Test sessions in late July for the 2025/26 intake (English and Italian on different days). For Polito TIL-A, dates are announced in the annual Call for Applications. Always rely on the official Call/Bando for your year.'
        : 'Даты зависят от университета и конкретного года. Например, Politecnico di Milano ставил Arched Test на конец июля для набора 2025/26 (отдельные дни для English и Italian). Для Polito (TIL-A) даты публикуются в ежегодном Call/Bando. Всегда ориентируйтесь на официальный Call вашего года.'
  },
  {
    question:
      locale === 'en'
        ? 'Is Arched Test online (TEST@HOME) or in person (TEST@UNI)?'
        : 'Arched Test проходит онлайн (TEST@HOME) или очно (TEST@UNI)?',
    answer:
      locale === 'en'
        ? 'It can be either. CISIA supports both TEST@HOME (remote) and TEST@UNI (in university computer labs). Your target university will state the exact format in its Call for Admissions and technical requirements.'
        : 'Возможны оба варианта. CISIA поддерживает TEST@HOME (удаленно) и TEST@UNI (очно в компьютерных аудиториях). Точный формат и техтребования всегда указаны в Call/Bando университета.'
  },
  {
    question:
      locale === 'en'
        ? 'Is the architecture entrance test different for EU vs non-EU applicants?'
        : 'Отличается ли тест для EU и non-EU абитуриентов на архитектуру в Италии?',
    answer:
      locale === 'en'
        ? 'The test content is usually the same, but universities often apply different deadlines, document checks, and seat quotas for EU/Italian-equivalent vs non-EU applicants. This impacts ranking and admission outcomes.'
        : 'Содержание теста обычно одинаковое, но часто различаются дедлайны, проверка документов и квоты мест для EU/«equivalent» и non-EU. Это влияет на конкурс, рейтинг и итог зачисления.'
  },
  {
    question:
      locale === 'en'
        ? 'Is there a passing score for Arched Test and TIL-A?'
        : 'Есть ли проходной балл на Arched Test и TIL-A?',
    answer:
      locale === 'en'
        ? 'Usually there is no fixed passing score. Admission is based on a ranking: seats are assigned in score order (and sometimes by stated preferences), until places are filled. In practice, the required score changes each year with competition and seat quotas.'
        : 'Обычно фиксированного проходного балла нет. Поступление идет по рейтингу: места распределяются по баллам (и иногда по выбранным приоритетам), пока квота не будет заполнена. На практике нужный балл меняется каждый год в зависимости от конкурса и квот.'
  }
];

const translations = {
  en: {
    badge: 'Support',
    heading: 'FAQ: Course and Entrance Test',
    subtitle: 'Answers to common questions about the course format, pricing, and Arched Test and TIL-A exam preparation.',
    sections: {
      course: {
        badge: 'Course',
        title: 'Questions About the Course',
        subtitle: 'Admission strategy, pricing, schedule, and mentor support.'
      },
      test: {
        badge: 'Test',
        title: 'Questions About the Entrance Test',
        subtitle: 'Format, scoring, dates, and key differences between Arched Test and TIL-A.'
      }
    }
  },
  ru: {
    badge: 'Поддержка',
    heading: 'FAQ: курс и вступительный тест',
    subtitle: 'Ответы на частые вопросы про обучение, тарифы и подготовку к Arched Test и TIL-A.',
    sections: {
      course: {
        badge: 'Курс',
        title: 'Часто задаваемые вопросы о курсе',
        subtitle: ''
      },
      test: {
        badge: 'Тест',
        title: 'Часто задаваемые вопросы о тесте',
        subtitle: ''
      }
    }
  }
};

const FAQ: React.FC<FAQProps> = ({ locale = 'ru' }) => {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const t = translations[locale];

  const faqSections: FAQSection[] = [
    {
      id: 'course',
      badge: t.sections.course.badge,
      title: t.sections.course.title,
      subtitle: t.sections.course.subtitle,
      faqs: getCourseFaqs(locale)
    },
    {
      id: 'test',
      badge: t.sections.test.badge,
      title: t.sections.test.title,
      subtitle: t.sections.test.subtitle,
      faqs: getTestFaqs(locale)
    }
  ];

  const allFaqs = faqSections.flatMap((section) => section.faqs);

  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: allFaqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };

  return (
    <section id="faq" className="section-padding bg-white border-t border-gray-100" aria-label="FAQ">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-10">
          {faqSections.map((section) => {
            const sectionBorderClass = section.id === 'course' ? 'border-slate-200' : 'border-blue-200';

            return (
              <div key={section.id} className={`rounded-2xl border bg-white ${sectionBorderClass}`}>
                <div className="px-5 sm:px-7 pt-6 sm:pt-8 pb-4">
                  <h3 className="text-2xl sm:text-3xl font-display font-bold text-primary mb-1">
                    {section.title}
                  </h3>
                  <p className="text-slate-600">{section.subtitle}</p>
                </div>

                <div className="px-5 sm:px-7 pb-4 divide-y divide-slate-200">
                  {section.faqs.map((faq, idx) => {
                    const key = `${section.id}-${idx}`;
                    const isOpen = openKey === key;

                    return (
                      <div key={key} className="first:border-t border-slate-200">
                        <button
                          onClick={() => setOpenKey(isOpen ? null : key)}
                          aria-expanded={isOpen}
                          aria-controls={`faq-answer-${key}`}
                          className="group w-full flex items-start justify-between gap-6 py-5 sm:py-6 text-left focus:outline-none"
                        >
                          <span className={`font-semibold text-base sm:text-lg leading-snug transition-colors ${isOpen ? 'text-primary' : 'text-slate-800 group-hover:text-primary'}`}>
                            {faq.question}
                          </span>
                          <span
                            className={`
                              flex-shrink-0 mt-0.5 text-slate-400 transition-all duration-200
                              ${isOpen ? 'rotate-45 text-primary' : ''}
                            `}
                          >
                            <Plus className="w-4 h-4" />
                          </span>
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              id={`faq-answer-${key}`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22 }}
                            >
                              <div className="pb-6 pr-9 text-slate-600 leading-relaxed whitespace-pre-line">
                                {faq.answer}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
