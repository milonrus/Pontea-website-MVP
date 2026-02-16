import {
  AssessmentDomain,
  SelfAssessmentQuestion,
  MicroCheckQuestion,
  AssessmentQuestionDef,
} from '@/types';

export type AssessmentLocale = 'en' | 'ru';

type LocalizedText = Record<AssessmentLocale, string>;

interface LocalizedAssessmentOption {
  id: 'a' | 'b' | 'c' | 'd' | 'e';
  text: LocalizedText;
  score?: number;
}

interface LocalizedSelfAssessmentQuestionDef {
  id: string;
  type: 'self_assessment';
  domain: AssessmentDomain;
  prompt: LocalizedText;
  options: LocalizedAssessmentOption[];
}

interface LocalizedMicroCheckVariantDef {
  difficulty: 'easy' | 'medium' | 'hard';
  prompt: LocalizedText;
  options: LocalizedAssessmentOption[];
  correctOptionId: 'a' | 'b' | 'c' | 'd' | 'e';
}

interface LocalizedMicroCheckQuestionDef {
  id: string;
  type: 'micro_check';
  domain: AssessmentDomain;
  label: LocalizedText;
  variants: LocalizedMicroCheckVariantDef[];
}

const DOMAIN_LABELS_BY_LOCALE: Record<AssessmentLocale, Record<AssessmentDomain, string>> = {
  en: {
    reading_en: 'Reading',
    logic: 'Logic',
    drawing_spatial: 'Drawing',
    math: 'Mathematics',
    physics: 'Physics',
    humanities: 'History and Culture',
  },
  ru: {
    reading_en: 'Чтение',
    logic: 'Логика',
    drawing_spatial: 'Черчение',
    math: 'Математика',
    physics: 'Физика',
    humanities: 'История и культура',
  },
};

export const DOMAIN_LABELS: Record<AssessmentDomain, string> = DOMAIN_LABELS_BY_LOCALE.ru;

export const MICRO_CHECK_LABEL_BY_LOCALE: Record<AssessmentLocale, string> = {
  en: 'A short question to estimate your level more accurately',
  ru: 'Короткий вопрос, чтобы точнее определить уровень',
};

const SELF_ASSESSMENT_QUESTION_DEFS: LocalizedSelfAssessmentQuestionDef[] = [
  {
    id: 'Q1',
    type: 'self_assessment',
    domain: 'reading_en',
    prompt: {
      en: 'Exam texts are in English. How do you handle reading such texts and answering questions on them?',
      ru: 'Тексты на экзамене будут на английском. Как вы справляетесь с чтением таких текстов и вопросами к ним?',
    },
    options: [
      {
        id: 'a',
        text: {
          en: 'I read slowly and often miss the meaning. I mostly guess text-based questions.',
          ru: 'Читаю медленно, часто не понимаю смысл. Вопросы по тексту чаще угадываю.',
        },
        score: 1,
      },
      {
        id: 'b',
        text: {
          en: 'I catch the general meaning but miss details. I often get confused by wording and choices.',
          ru: 'Понимаю общий смысл, но теряю детали. Часто путаюсь в формулировках и вариантах.',
        },
        score: 2,
      },
      {
        id: 'c',
        text: {
          en: 'I usually understand and answer correctly, but make mistakes on inference and complex wording. Sometimes I run out of time.',
          ru: 'Обычно понимаю и отвечаю верно, но ошибаюсь на выводах и сложных формулировках. Иногда не успеваю по времени.',
        },
        score: 3,
      },
      {
        id: 'd',
        text: {
          en: 'I read and answer confidently on most questions, but sometimes struggle with nuance and speed.',
          ru: 'Уверенно читаю и отвечаю на большинство вопросов, но иногда теряюсь в нюансах и скорости.',
        },
        score: 4,
      },
      {
        id: 'e',
        text: {
          en: 'I read quickly and accurately. I can find evidence in the text and stay on time consistently.',
          ru: 'Читаю быстро и точно. Умею находить подтверждение в тексте и стабильно укладываюсь во время.',
        },
        score: 5,
      },
    ],
  },
  {
    id: 'Q2',
    type: 'self_assessment',
    domain: 'logic',
    prompt: {
      en: 'How do you solve logic and pattern tasks (conditions, sequences, conclusions)?',
      ru: 'Как вы решаете задачи на логику и закономерности (условия, последовательности, выводы)?',
    },
    options: [
      {
        id: 'a',
        text: {
          en: 'I have barely solved such tasks. I often do not know where to start.',
          ru: 'Почти не решал(а) такие задачи. Часто не понимаю, с чего начать.',
        },
        score: 1,
      },
      {
        id: 'b',
        text: {
          en: 'I handle easy tasks, but complex conditions and sequences break me quickly.',
          ru: 'Простые задачи да, но сложные условия и последовательности быстро ломают.',
        },
        score: 2,
      },
      {
        id: 'c',
        text: {
          en: 'I solve standard tasks, but lose time and make mistakes on unfamiliar formats.',
          ru: 'Типовые задачи решаю, но на новых форматах теряю время и делаю ошибки.',
        },
        score: 3,
      },
      {
        id: 'd',
        text: {
          en: 'I solve most tasks confidently, but sometimes need extra time for non-standard ones.',
          ru: 'Решаю большинство задач уверенно, но иногда нужно больше времени на нестандартные.',
        },
        score: 4,
      },
      {
        id: 'e',
        text: {
          en: 'I solve systematically and quickly. I test hypotheses and rarely make mistakes.',
          ru: 'Решаю системно и быстро. Проверяю гипотезы и редко ошибаюсь.',
        },
        score: 5,
      },
    ],
  },
  {
    id: 'Q3',
    type: 'self_assessment',
    domain: 'drawing_spatial',
    prompt: {
      en: 'How do you work with technical drawings and spatial tasks (plan, elevation, section, projections, perspective)?',
      ru: 'Как вы работаете с чертежами и пространством (план, фасад, разрез, проекции, перспектива)?',
    },
    options: [
      {
        id: 'a',
        text: {
          en: 'I struggle to read drawings. Projections and 3D visualization are very hard for me.',
          ru: 'Чертежи читаю с трудом. Проекции и 3D в голове почти не складываются.',
        },
        score: 1,
      },
      {
        id: 'b',
        text: {
          en: 'I know the basics but get confused in projections and often make construction mistakes.',
          ru: 'Понимаю основы, но путаюсь в проекциях и часто ошибаюсь в построениях.',
        },
        score: 2,
      },
      {
        id: 'c',
        text: {
          en: 'I read drawings confidently and do standard constructions, but complex tasks take too much time.',
          ru: 'Читаю чертежи уверенно и делаю типовые построения, но сложные задачи отнимают много времени.',
        },
        score: 3,
      },
      {
        id: 'd',
        text: {
          en: 'I work confidently with drawings and projections, but still make occasional inaccuracies in complex tasks.',
          ru: 'Уверенно работаю с чертежами и проекциями, но иногда допускаю неточности в сложных построениях.',
        },
        score: 4,
      },
      {
        id: 'e',
        text: {
          en: 'I read and construct freely. I self-check quickly and stay precise.',
          ru: 'Свободно читаю и строю. Быстро проверяю себя и держу аккуратность.',
        },
        score: 5,
      },
    ],
  },
  {
    id: 'Q4',
    type: 'self_assessment',
    domain: 'math',
    prompt: {
      en: 'What is your mathematics level for the exam (algebra, geometry, equations, functions, inequalities, logarithms, spatial figures)?',
      ru: 'Какой у вас уровень математики для экзамена (алгебра и геометрия, уравнения, функции, неравенства, логарифмы, пространственные фигуры)?',
    },
    options: [
      {
        id: 'a',
        text: {
          en: 'My foundation is weak. I forgot formulas and methods.',
          ru: 'База слабая. Формулы и методы забыты.',
        },
        score: 1,
      },
      {
        id: 'b',
        text: {
          en: 'I solve simple tasks, but often make mistakes or fail to see an approach.',
          ru: 'Простое решаю, но часто ошибаюсь или не вижу подход.',
        },
        score: 2,
      },
      {
        id: 'c',
        text: {
          en: 'I solve most standard tasks, but difficult topics and speed create gaps.',
          ru: 'Большинство типовых задач решаю, но сложные темы и скорость дают провалы.',
        },
        score: 3,
      },
      {
        id: 'd',
        text: {
          en: 'I solve most tasks confidently, but still make mistakes in harder topics.',
          ru: 'Решаю большинство задач уверенно, но иногда допускаю ошибки в сложных темах.',
        },
        score: 4,
      },
      {
        id: 'e',
        text: {
          en: 'I solve confidently and quickly. I know how to verify my solution.',
          ru: 'Решаю уверенно и быстро. Умею проверять себя.',
        },
        score: 5,
      },
    ],
  },
  {
    id: 'Q5',
    type: 'self_assessment',
    domain: 'physics',
    prompt: {
      en: 'What is your physics level for the exam (mechanics, forces, energy, thermodynamics, electricity, optics)?',
      ru: 'Какой у вас уровень физики для экзамена (механика, силы, энергия, термодинамика, электричество, оптика)?',
    },
    options: [
      {
        id: 'a',
        text: {
          en: 'I barely remember the basics. I do not know which laws to apply.',
          ru: 'Почти не помню. Не понимаю, какие законы выбирать.',
        },
        score: 1,
      },
      {
        id: 'b',
        text: {
          en: 'I remember basics, but get confused in tasks and often lose the solution path.',
          ru: 'Базу помню, но в задачах путаюсь и часто теряю ход решения.',
        },
        score: 2,
      },
      {
        id: 'c',
        text: {
          en: 'I solve standard tasks, but mixed multi-step tasks produce errors.',
          ru: 'Типовые задачи решаю, но комбинированные задачи дают ошибки.',
        },
        score: 3,
      },
      {
        id: 'd',
        text: {
          en: 'I solve most tasks, but sometimes get lost in multi-step or non-standard problems.',
          ru: 'Решаю большинство задач, но иногда теряюсь в многоэтапных или нестандартных.',
        },
        score: 4,
      },
      {
        id: 'e',
        text: {
          en: 'I confidently build the setup, choose laws, compute, and validate the result.',
          ru: 'Уверенно строю схему, выбираю законы, считаю и проверяю результат.',
        },
        score: 5,
      },
    ],
  },
  {
    id: 'Q6',
    type: 'self_assessment',
    domain: 'humanities',
    prompt: {
      en: 'How do you handle the humanities block (history, general culture, art and architecture history)?',
      ru: 'Как вы справляетесь с гуманитарным блоком (история, общая культура, история искусства и архитектуры)?',
    },
    options: [
      {
        id: 'a',
        text: {
          en: 'I have barely prepared. Most topics are new, and I often guess.',
          ru: 'Почти не готовился(лась). Многое впервые, часто угадываю.',
        },
        score: 1,
      },
      {
        id: 'b',
        text: {
          en: 'I have a base, but often mix up periods and chronology (history).',
          ru: 'База есть, но чаще всего путаюсь в эпохах и хронологии (история).',
        },
        score: 2,
      },
      {
        id: 'c',
        text: {
          en: 'I have a base, but often confuse styles, features, and authors (art and architecture).',
          ru: 'База есть, но чаще всего путаюсь в стилях, признаках и авторах (искусство и архитектура).',
        },
        score: 3,
      },
      {
        id: 'd',
        text: {
          en: 'I navigate most topics confidently, but still have gaps in specific periods or movements.',
          ru: 'Уверенно ориентируюсь в большинстве тем, но есть пробелы в отдельных эпохах или направлениях.',
        },
        score: 4,
      },
      {
        id: 'e',
        text: {
          en: 'Strong level. I am confident with periods, terms, and styles, and answer consistently.',
          ru: 'Сильный уровень. Ориентируюсь в эпохах, терминах и стилях, отвечаю стабильно.',
        },
        score: 5,
      },
    ],
  },
];

const MICRO_CHECK_QUESTION_DEFS: LocalizedMicroCheckQuestionDef[] = [
  {
    id: 'Q7',
    type: 'micro_check',
    domain: 'math',
    label: MICRO_CHECK_LABEL_BY_LOCALE,
    variants: [
      {
        difficulty: 'easy',
        prompt: {
          en: 'Solve: $3x - 7 = 11$',
          ru: 'Решите: $3x - 7 = 11$',
        },
        options: [
          { id: 'a', text: { en: '$4$', ru: '$4$' } },
          { id: 'b', text: { en: '$6$', ru: '$6$' } },
          { id: 'c', text: { en: '$8$', ru: '$8$' } },
          { id: 'd', text: { en: '$10$', ru: '$10$' } },
        ],
        correctOptionId: 'c',
      },
      {
        difficulty: 'medium',
        prompt: {
          en: 'If $f(x) = x^2$, what is $f(-3)$?',
          ru: 'Если $f(x) = x^2$, чему равно $f(-3)$?',
        },
        options: [
          { id: 'a', text: { en: '$-9$', ru: '$-9$' } },
          { id: 'b', text: { en: '$0$', ru: '$0$' } },
          { id: 'c', text: { en: '$9$', ru: '$9$' } },
          { id: 'd', text: { en: '$6$', ru: '$6$' } },
        ],
        correctOptionId: 'c',
      },
      {
        difficulty: 'hard',
        prompt: {
          en: 'Simplify: $\\dfrac{x^2 \\cdot x^3}{x^2}$',
          ru: 'Упростите: $\\dfrac{x^2 \\cdot x^3}{x^2}$',
        },
        options: [
          { id: 'a', text: { en: '$x$', ru: '$x$' } },
          { id: 'b', text: { en: '$x^3$', ru: '$x^3$' } },
          { id: 'c', text: { en: '$x^5$', ru: '$x^5$' } },
          { id: 'd', text: { en: '$1$', ru: '$1$' } },
        ],
        correctOptionId: 'b',
      },
    ],
  },
  {
    id: 'Q8',
    type: 'micro_check',
    domain: 'physics',
    label: MICRO_CHECK_LABEL_BY_LOCALE,
    variants: [
      {
        difficulty: 'easy',
        prompt: {
          en: 'In uniform circular motion, acceleration is directed',
          ru: 'При равномерном движении по окружности ускорение направлено',
        },
        options: [
          { id: 'a', text: { en: 'forward along the tangent', ru: 'по касательной вперед' } },
          { id: 'b', text: { en: 'backward along the tangent', ru: 'по касательной назад' } },
          { id: 'c', text: { en: 'toward the center of the circle', ru: 'к центру окружности' } },
          { id: 'd', text: { en: 'away from the center', ru: 'от центра окружности' } },
        ],
        correctOptionId: 'c',
      },
      {
        difficulty: 'medium',
        prompt: {
          en: 'Gravity force is $mg$. If mass doubles, gravity force',
          ru: 'Сила тяжести равна $mg$. Если масса увеличилась в 2 раза, то сила тяжести',
        },
        options: [
          { id: 'a', text: { en: 'decreases by 2 times', ru: 'уменьшится в 2 раза' } },
          { id: 'b', text: { en: 'increases by 2 times', ru: 'увеличится в 2 раза' } },
          { id: 'c', text: { en: 'does not change', ru: 'не изменится' } },
          { id: 'd', text: { en: 'increases by 4 times', ru: 'увеличится в 4 раза' } },
        ],
        correctOptionId: 'b',
      },
      {
        difficulty: 'hard',
        prompt: {
          en: 'By Ohm’s law $I = \\dfrac{U}{R}$. If voltage $U$ is constant and resistance $R$ doubles, current $I$',
          ru: 'По закону Ома $I = \\dfrac{U}{R}$. Если напряжение $U$ не меняется, а сопротивление $R$ увеличилось в 2 раза, ток $I$',
        },
        options: [
          { id: 'a', text: { en: 'increases by 2 times', ru: 'увеличится в 2 раза' } },
          { id: 'b', text: { en: 'decreases by 2 times', ru: 'уменьшится в 2 раза' } },
          { id: 'c', text: { en: 'does not change', ru: 'не изменится' } },
          { id: 'd', text: { en: 'increases by 4 times', ru: 'увеличится в 4 раза' } },
        ],
        correctOptionId: 'b',
      },
    ],
  },
  {
    id: 'Q9',
    type: 'micro_check',
    domain: 'drawing_spatial',
    label: MICRO_CHECK_LABEL_BY_LOCALE,
    variants: [
      {
        difficulty: 'easy',
        prompt: {
          en: 'A section drawing shows',
          ru: 'Разрез на чертеже показывает',
        },
        options: [
          { id: 'a', text: { en: 'top view', ru: 'вид сверху' } },
          { id: 'b', text: { en: 'exterior facade view', ru: 'внешний вид фасада' } },
          { id: 'c', text: { en: 'the object after an imaginary cut', ru: 'объект после мысленного среза' } },
          { id: 'd', text: { en: 'perspective sketch', ru: 'перспективный рисунок' } },
        ],
        correctOptionId: 'c',
      },
      {
        difficulty: 'medium',
        prompt: {
          en: 'A building plan most often shows',
          ru: 'План здания чаще всего показывает',
        },
        options: [
          { id: 'a', text: { en: 'front facade', ru: 'фасад спереди' } },
          { id: 'b', text: { en: 'top view at a conventional cut level', ru: 'вид сверху на уровне условного сечения' } },
          { id: 'c', text: { en: 'side view', ru: 'вид сбоку' } },
          { id: 'd', text: { en: 'interior perspective', ru: 'перспективу интерьера' } },
        ],
        correctOptionId: 'b',
      },
      {
        difficulty: 'hard',
        prompt: {
          en: 'Which pair belongs to orthographic projections?',
          ru: 'Какая пара относится к ортогональным изображениям',
        },
        options: [
          { id: 'a', text: { en: 'plan and elevation', ru: 'план и фасад' } },
          { id: 'b', text: { en: 'perspective and axonometry', ru: 'перспектива и аксонометрия' } },
          { id: 'c', text: { en: 'perspective and section', ru: 'перспектива и разрез' } },
          { id: 'd', text: { en: 'axonometry and perspective', ru: 'аксонометрия и перспектива' } },
        ],
        correctOptionId: 'a',
      },
    ],
  },
  {
    id: 'Q10',
    type: 'micro_check',
    domain: 'logic',
    label: MICRO_CHECK_LABEL_BY_LOCALE,
    variants: [
      {
        difficulty: 'easy',
        prompt: {
          en: '2, 4, 8, 16, ?',
          ru: '2, 4, 8, 16, ?',
        },
        options: [
          { id: 'a', text: { en: '18', ru: '18' } },
          { id: 'b', text: { en: '24', ru: '24' } },
          { id: 'c', text: { en: '32', ru: '32' } },
          { id: 'd', text: { en: '34', ru: '34' } },
        ],
        correctOptionId: 'c',
      },
      {
        difficulty: 'medium',
        prompt: {
          en: 'All A are B. Some B are C. Does it follow that some A are C?',
          ru: 'Все A это B. Некоторые B это C. Следует ли, что некоторые A это C',
        },
        options: [
          { id: 'a', text: { en: 'always yes', ru: 'всегда да' } },
          { id: 'b', text: { en: 'always no', ru: 'всегда нет' } },
          { id: 'c', text: { en: 'not necessarily', ru: 'не обязательно' } },
          { id: 'd', text: { en: 'insufficient data', ru: 'данных недостаточно' } },
        ],
        correctOptionId: 'c',
      },
      {
        difficulty: 'hard',
        prompt: {
          en: 'If it rains, the street is wet. The street is wet. Which is true?',
          ru: 'Если идет дождь, то улица мокрая. Улица мокрая. Что верно',
        },
        options: [
          { id: 'a', text: { en: 'so it is raining', ru: 'значит, идет дождь' } },
          { id: 'b', text: { en: 'it is not raining', ru: 'дождя нет' } },
          { id: 'c', text: { en: 'you cannot conclude that it is raining', ru: 'нельзя сделать вывод, что идет дождь' } },
          { id: 'd', text: { en: 'the street cannot be wet without rain', ru: 'улица не может быть мокрой без дождя' } },
        ],
        correctOptionId: 'c',
      },
    ],
  },
];

function resolveText(locale: AssessmentLocale, text: LocalizedText): string {
  return text[locale];
}

export function getDomainLabels(locale: AssessmentLocale = 'ru'): Record<AssessmentDomain, string> {
  return DOMAIN_LABELS_BY_LOCALE[locale];
}

export function getSelfAssessmentQuestions(locale: AssessmentLocale = 'ru'): SelfAssessmentQuestion[] {
  return SELF_ASSESSMENT_QUESTION_DEFS.map((question) => ({
    id: question.id,
    type: question.type,
    domain: question.domain,
    prompt: resolveText(locale, question.prompt),
    options: question.options.map((option) => ({
      id: option.id,
      text: resolveText(locale, option.text),
      score: option.score,
    })),
  }));
}

export function getMicroCheckQuestions(locale: AssessmentLocale = 'ru'): MicroCheckQuestion[] {
  return MICRO_CHECK_QUESTION_DEFS.map((question) => ({
    id: question.id,
    type: question.type,
    domain: question.domain,
    label: resolveText(locale, question.label),
    variants: question.variants.map((variant) => ({
      difficulty: variant.difficulty,
      prompt: resolveText(locale, variant.prompt),
      options: variant.options.map((option) => ({
        id: option.id,
        text: resolveText(locale, option.text),
        score: option.score,
      })),
      correctOptionId: variant.correctOptionId,
    })),
  }));
}

export function getAssessmentQuestions(locale: AssessmentLocale = 'ru'): AssessmentQuestionDef[] {
  return [
    ...getSelfAssessmentQuestions(locale),
    ...getMicroCheckQuestions(locale),
  ];
}

export const TOTAL_QUESTIONS = SELF_ASSESSMENT_QUESTION_DEFS.length + MICRO_CHECK_QUESTION_DEFS.length;

// Backward compatibility (default RU)
export const SELF_ASSESSMENT_QUESTIONS: SelfAssessmentQuestion[] = getSelfAssessmentQuestions('ru');
export const MICRO_CHECK_LABEL = MICRO_CHECK_LABEL_BY_LOCALE.ru;
export const MICRO_CHECK_QUESTIONS: MicroCheckQuestion[] = getMicroCheckQuestions('ru');
export const ALL_ASSESSMENT_QUESTIONS: AssessmentQuestionDef[] = getAssessmentQuestions('ru');
