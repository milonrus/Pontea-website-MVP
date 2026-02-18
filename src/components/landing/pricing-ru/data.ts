import {
  PricingLocale,
  RuPricingPlan,
  RuPricingPlanId,
} from './types';

const RU_PRICING_PLANS: RuPricingPlan[] = [
  {
    id: 'foundation',
    name: 'Стартовый',
    subtitle: 'Идеальный старт для тех, кто готовится самостоятельно',
    price: 890,
    originalPrice: 990,
    priceRub: 82000,
    installmentAvailable: false,
    summary: [
      'Сильная теоретическая база по всем 5 разделам экзамена',
      '30+ часов видео лекций с разбором ключевых тем и экзаменационных заданий',
      'Примеры экзаменационных заданий с пояснениями',
      'Диагностика на старте и пробный экзамен в финале',
    ],
    groups: [
      {
        icon: '📘',
        title: 'Академическая база',
        items: [
          'Полный теоретический курс по всем 5 разделам экзамена (25+ структурированных модулей)',
          '30+ часов видео-лекций с разбором важных тем',
          'Примеры экзаменационных заданий с пояснениями',
          'Пошаговый план подготовки на весь период',
        ],
      },
      {
        icon: '📊',
        title: 'Контроль прогресса',
        items: [
          'Стартовый диагностический тест (точка А)',
          'Итоговый пробный экзамен в формате реального теста (точка Б)',
        ],
      },
    ],
  },
  {
    id: 'advanced',
    name: 'Основной',
    subtitle: 'Оптимальный баланс практики, сопровождения и обратной связи',
    price: 1490,
    originalPrice: 1590,
    priceRub: 137000,
    badge: 'Выбор 80% учеников',
    installmentAvailable: true,
    summary: [
      'Включает всё из Стартового, а также',
      '1300+ заданий, 10 экзаменов и 3 симуляции "как в жизни"',
      'Групповые онлайн-уроки по каждому предмету с разбором сложных тем',
      'Чат с преподавателями и другими учениками',
      'Индивидуальный учебный план и прогресс-сессия с ментором каждые 2 недели',
    ],
    groups: [
      {
        icon: '🎓',
        title: 'Живая практика',
        items: [
          'Групповые онлайн-уроки по каждому предмету с разбором сложных тем',
          '1300+ экзаменационных заданий для практики',
          'Разбор сложных тем и типичных ошибок',
          '10 полноценных пробных тестов',
          '3 экзаменационные симуляции с анализом результатов',
        ],
      },
      {
        icon: '👩‍🏫',
        title: 'Менторское сопровождение',
        items: [
          'Индивидуальный учебный план',
          'Прогресс-сессия с ментором каждые 2 недели',
          'Корректировка стратегии подготовки',
        ],
      },
      {
        icon: '💬',
        title: 'Поддержка преподавателей',
        items: [
          'Чат с преподавателями и другими учениками',
          'Ответы на вопросы по заданиям',
          'Форум с разбором работ и обратной связью',
        ],
      },
    ],
  },
  {
    id: 'mentorship',
    name: 'Индивидуальный',
    subtitle: 'Максимум персонального внимания и стратегической поддержки',
    price: 3490,
    originalPrice: 3590,
    priceRub: 321000,
    badge: 'Количество мест ограничено',
    installmentAvailable: true,
    summary: [
      'Включает всё из Основного, а также',
      'Персональные занятия 1 на 1 с преподавателем каждую неделю',
      'Личный ментор всегда на связи',
      'Стратегические встречи с основательницами и персональная аналитика',
    ],
    groups: [
      {
        icon: '👤',
        title: 'Индивидуальные занятия',
        items: [
          '20 персональных занятий с топ-преподавателями',
          'Работа над слабыми зонами',
          'Индивидуальный разбор экзаменационной стратегии',
        ],
      },
      {
        icon: '🧭',
        title: 'Приоритетная менторская поддержка',
        items: [
          'Персональный ментор',
          'Приоритетные ответы в рабочие часы',
          'Глубокий анализ прогресса',
          'Индивидуальная корректировка учебного плана',
        ],
      },
      {
        icon: '🏛',
        title: 'Стратегические сессии с основательницами',
        items: [
          '3 персональные стратегические встречи',
          'Определение долгосрочной академической цели',
          'Работа с мотивацией и уверенностью',
        ],
      },
      {
        icon: '📈',
        title: 'Персональная аналитика',
        items: [
          'Индивидуальный разбор пробных экзаменов',
          'Детальный анализ сильных и слабых сторон',
          'Стратегия поведения на реальном экзамене',
        ],
      },
    ],
    bonus:
      'Профессиональная сессия по концентрации внимания и работе в стрессовых условиях',
  },
];

const EN_PRICING_PLANS: RuPricingPlan[] = [
  {
    id: 'foundation',
    name: 'Starter',
    subtitle: 'Perfect for students who are preparing independently',
    price: 890,
    originalPrice: 990,
    priceRub: 82000,
    installmentAvailable: false,
    summary: [
      'Strong theoretical foundation across all 5 exam sections',
      '30+ hours of video lessons covering key topics and exam-style tasks',
      'Exam task examples with explanations',
      'Diagnostic at the start and mock exam at the end',
    ],
    groups: [
      {
        icon: '📘',
        title: 'Academic foundation',
        items: [
          'Complete theory course for all 5 exam sections (25+ structured modules)',
          '30+ hours of video lessons with topic breakdowns',
          'Exam-style tasks with explanations',
          'Step-by-step preparation roadmap for the full period',
        ],
      },
      {
        icon: '📊',
        title: 'Progress tracking',
        items: [
          'Initial diagnostic test (point A)',
          'Final mock exam in real test format (point B)',
        ],
      },
    ],
  },
  {
    id: 'advanced',
    name: 'Core',
    subtitle: 'Best balance of practice, guidance, and feedback',
    price: 1490,
    originalPrice: 1590,
    priceRub: 137000,
    badge: 'Chosen by 80% of students',
    installmentAvailable: true,
    summary: [
      'Includes everything in Starter',
      '1300+ tasks, 10 mock tests, and 3 full exam simulations',
      'Live group online classes for every subject',
      'Chat with teachers and other students',
      'Personal study plan and mentor progress session every 2 weeks',
    ],
    groups: [
      {
        icon: '🎓',
        title: 'Live practice',
        items: [
          'Live group online classes with difficult-topic breakdowns',
          '1300+ exam-style tasks for practice',
          'Analysis of common mistakes and hard topics',
          '10 full mock exams',
          '3 exam simulations with detailed analysis',
        ],
      },
      {
        icon: '👩‍🏫',
        title: 'Mentor guidance',
        items: [
          'Personalized study plan',
          'Mentor progress session every 2 weeks',
          'Preparation strategy adjustments',
        ],
      },
      {
        icon: '💬',
        title: 'Teacher support',
        items: [
          'Chat with teachers and students',
          'Teacher answers on assignments',
          'Forum feedback on submitted work',
        ],
      },
    ],
  },
  {
    id: 'mentorship',
    name: 'Individual',
    subtitle: 'Maximum personal attention and strategic guidance',
    price: 3490,
    originalPrice: 3590,
    priceRub: 321000,
    badge: 'Limited seats',
    installmentAvailable: true,
    summary: [
      'Includes everything in Core',
      '20 one-on-one sessions with top instructors',
      'Personal mentor with priority support during working hours',
      'Strategic sessions with founders and personal analytics',
    ],
    groups: [
      {
        icon: '👤',
        title: 'Individual sessions',
        items: [
          '20 personal sessions with top instructors',
          'Focused work on weak areas',
          'Personal exam strategy development',
        ],
      },
      {
        icon: '🧭',
        title: 'Priority mentor support',
        items: [
          'Dedicated personal mentor',
          'Priority responses during working hours',
          'Deep progress analysis',
          'Individual plan adjustments',
        ],
      },
      {
        icon: '🏛',
        title: 'Strategic sessions with founders',
        items: [
          '3 personal strategy sessions',
          'Long-term academic goal definition',
          'Confidence and motivation support',
        ],
      },
      {
        icon: '📈',
        title: 'Personal analytics',
        items: [
          'Individual review of mock exams',
          'Detailed strengths/weaknesses analysis',
          'Real exam behavior strategy',
        ],
      },
    ],
    bonus:
      'Professional session on concentration and stress control',
  },
];

export const PRICING_PLANS_BY_LOCALE: Record<PricingLocale, RuPricingPlan[]> = {
  en: EN_PRICING_PLANS,
  ru: RU_PRICING_PLANS,
};

export const COURSE_DURATION_MONTHS = 5;
export const INSTALLMENT_MONTHS = 6;

type RubPaymentPlanId = Exclude<RuPricingPlanId, 'mentorship'>;

export const RUB_INSTALLMENT_TOTAL_BY_PLAN: Record<RubPaymentPlanId, number> = {
  foundation: 89_000,
  advanced: 149_000,
};

const eurPerMonthFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatEurPerMonth = (totalEur: number) =>
  eurPerMonthFormatter.format(totalEur / COURSE_DURATION_MONTHS);

export const getPlanInstallmentMonthlyRub = (
  plan: Pick<RuPricingPlan, 'id' | 'priceRub'>
) => {
  const installmentTotal = plan.id === 'mentorship'
    ? plan.priceRub
    : RUB_INSTALLMENT_TOTAL_BY_PLAN[plan.id];

  return Math.round(installmentTotal / INSTALLMENT_MONTHS);
};

const PRICING_PRIMARY_CTA_LABEL_BY_PLAN: Record<PricingLocale, Record<RuPricingPlanId, string>> = {
  en: {
    foundation: 'Start preparing',
    advanced: 'Choose Core',
    mentorship: 'Apply now',
  },
  ru: {
    foundation: 'Начать подготовку',
    advanced: 'Выбрать Основной',
    mentorship: 'Оставить заявку',
  },
};

export function getPricingPlans(locale: PricingLocale): RuPricingPlan[] {
  return PRICING_PLANS_BY_LOCALE[locale];
}

export function getPricingPrimaryCtaLabel(locale: PricingLocale, planId: RuPricingPlanId): string {
  return PRICING_PRIMARY_CTA_LABEL_BY_PLAN[locale][planId];
}
