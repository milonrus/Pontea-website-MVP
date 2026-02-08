import {
  AssessmentDomain,
  SelfAssessmentQuestion,
  MicroCheckQuestion,
  AssessmentQuestionDef,
} from '@/types';

export const DOMAIN_LABELS: Record<AssessmentDomain, string> = {
  reading_en: 'Английский / Чтение',
  logic: 'Логика',
  drawing_spatial: 'Черчение / Пространство',
  math: 'Математика',
  physics: 'Физика',
  humanities: 'Гуманитарный блок',
};

export const SELF_ASSESSMENT_QUESTIONS: SelfAssessmentQuestion[] = [
  {
    id: 'Q1',
    type: 'self_assessment',
    domain: 'reading_en',
    prompt:
      'Тексты на экзамене будут на английском. Как вы справляетесь с чтением таких текстов и вопросами к ним?',
    options: [
      { id: 'a', text: 'Читаю медленно, часто не понимаю смысл. Вопросы по тексту чаще угадываю.', score: 0 },
      { id: 'b', text: 'Понимаю общий смысл, но теряю детали. Часто путаюсь в формулировках и вариантах.', score: 1 },
      { id: 'c', text: 'Обычно понимаю и отвечаю верно, но ошибаюсь на выводах и сложных формулировках. Иногда не успеваю по времени.', score: 2 },
      { id: 'd', text: 'Читаю быстро и точно. Умею находить подтверждение в тексте и стабильно укладываюсь во время.', score: 3 },
    ],
  },
  {
    id: 'Q2',
    type: 'self_assessment',
    domain: 'logic',
    prompt:
      'Как вы решаете задачи на логику и закономерности (условия, последовательности, выводы)?',
    options: [
      { id: 'a', text: 'Почти не решал(а) такие задачи. Часто не понимаю, с чего начать.', score: 0 },
      { id: 'b', text: 'Простые задачи да, но сложные условия и последовательности быстро ломают.', score: 1 },
      { id: 'c', text: 'Типовые задачи решаю, но на новых форматах теряю время и делаю ошибки.', score: 2 },
      { id: 'd', text: 'Решаю системно и быстро. Проверяю гипотезы и редко ошибаюсь.', score: 3 },
    ],
  },
  {
    id: 'Q3',
    type: 'self_assessment',
    domain: 'drawing_spatial',
    prompt:
      'Как вы работаете с чертежами и пространством (план, фасад, разрез, проекции, перспектива)?',
    options: [
      { id: 'a', text: 'Чертежи читаю с трудом. Проекции и 3D в голове почти не складываются.', score: 0 },
      { id: 'b', text: 'Понимаю основы, но путаюсь в проекциях и часто ошибаюсь в построениях.', score: 1 },
      { id: 'c', text: 'Читаю чертежи уверенно и делаю типовые построения, но сложные задачи отнимают много времени.', score: 2 },
      { id: 'd', text: 'Свободно читаю и строю. Быстро проверяю себя и держу аккуратность.', score: 3 },
    ],
  },
  {
    id: 'Q4',
    type: 'self_assessment',
    domain: 'math',
    prompt:
      'Какой у вас уровень математики для экзамена (алгебра и геометрия, уравнения, функции, неравенства, логарифмы, пространственные фигуры)?',
    options: [
      { id: 'a', text: 'База слабая. Формулы и методы забыты.', score: 0 },
      { id: 'b', text: 'Простое решаю, но часто ошибаюсь или не вижу подход.', score: 1 },
      { id: 'c', text: 'Большинство типовых задач решаю, но сложные темы и скорость дают провалы.', score: 2 },
      { id: 'd', text: 'Решаю уверенно и быстро. Умею проверять себя.', score: 3 },
    ],
  },
  {
    id: 'Q5',
    type: 'self_assessment',
    domain: 'physics',
    prompt:
      'Какой у вас уровень физики для экзамена (механика, силы, энергия, термодинамика, электричество, оптика)?',
    options: [
      { id: 'a', text: 'Почти не помню. Не понимаю, какие законы выбирать.', score: 0 },
      { id: 'b', text: 'Базу помню, но в задачах путаюсь и часто теряю ход решения.', score: 1 },
      { id: 'c', text: 'Типовые задачи решаю, но комбинированные задачи дают ошибки.', score: 2 },
      { id: 'd', text: 'Уверенно строю схему, выбираю законы, считаю и проверяю результат.', score: 3 },
    ],
  },
  {
    id: 'Q6',
    type: 'self_assessment',
    domain: 'humanities',
    prompt:
      'Как вы справляетесь с гуманитарным блоком (история, общая культура, история искусства и архитектуры)?',
    options: [
      { id: 'a', text: 'Почти не готовился(лась). Многое впервые, часто угадываю.', score: 0 },
      { id: 'b', text: 'База есть, но чаще всего путаюсь в эпохах и хронологии (история).', score: 1 },
      { id: 'c', text: 'База есть, но чаще всего путаюсь в стилях, признаках и авторах (искусство и архитектура).', score: 2 },
      { id: 'd', text: 'Сильный уровень. Ориентируюсь в эпохах, терминах и стилях, отвечаю стабильно.', score: 3 },
    ],
  },
];

export const MICRO_CHECK_LABEL = 'Короткий вопрос, чтобы точнее определить уровень';

export const MICRO_CHECK_QUESTIONS: MicroCheckQuestion[] = [
  {
    id: 'Q7',
    type: 'micro_check',
    domain: 'math',
    label: MICRO_CHECK_LABEL,
    variants: [
      {
        difficulty: 'easy',
        prompt: 'Решите: $3x - 7 = 11$',
        options: [
          { id: 'a', text: '$4$' },
          { id: 'b', text: '$6$' },
          { id: 'c', text: '$8$' },
          { id: 'd', text: '$10$' },
        ],
        correctOptionId: 'c',
      },
      {
        difficulty: 'medium',
        prompt: 'Если $f(x) = x^2$, чему равно $f(-3)$?',
        options: [
          { id: 'a', text: '$-9$' },
          { id: 'b', text: '$0$' },
          { id: 'c', text: '$9$' },
          { id: 'd', text: '$6$' },
        ],
        correctOptionId: 'c',
      },
      {
        difficulty: 'hard',
        prompt: 'Упростите: $\\dfrac{x^2 \\cdot x^3}{x^2}$',
        options: [
          { id: 'a', text: '$x$' },
          { id: 'b', text: '$x^3$' },
          { id: 'c', text: '$x^5$' },
          { id: 'd', text: '$1$' },
        ],
        correctOptionId: 'b',
      },
    ],
  },
  {
    id: 'Q8',
    type: 'micro_check',
    domain: 'physics',
    label: MICRO_CHECK_LABEL,
    variants: [
      {
        difficulty: 'easy',
        prompt: 'При равномерном движении по окружности ускорение направлено',
        options: [
          { id: 'a', text: 'по касательной вперед' },
          { id: 'b', text: 'по касательной назад' },
          { id: 'c', text: 'к центру окружности' },
          { id: 'd', text: 'от центра окружности' },
        ],
        correctOptionId: 'c',
      },
      {
        difficulty: 'medium',
        prompt: 'Сила тяжести равна $mg$. Если масса увеличилась в 2 раза, то сила тяжести',
        options: [
          { id: 'a', text: 'уменьшится в 2 раза' },
          { id: 'b', text: 'увеличится в 2 раза' },
          { id: 'c', text: 'не изменится' },
          { id: 'd', text: 'увеличится в 4 раза' },
        ],
        correctOptionId: 'b',
      },
      {
        difficulty: 'hard',
        prompt:
          'По закону Ома $I = \\dfrac{U}{R}$. Если напряжение $U$ не меняется, а сопротивление $R$ увеличилось в 2 раза, ток $I$',
        options: [
          { id: 'a', text: 'увеличится в 2 раза' },
          { id: 'b', text: 'уменьшится в 2 раза' },
          { id: 'c', text: 'не изменится' },
          { id: 'd', text: 'увеличится в 4 раза' },
        ],
        correctOptionId: 'b',
      },
    ],
  },
  {
    id: 'Q9',
    type: 'micro_check',
    domain: 'drawing_spatial',
    label: MICRO_CHECK_LABEL,
    variants: [
      {
        difficulty: 'easy',
        prompt: 'Разрез на чертеже показывает',
        options: [
          { id: 'a', text: 'вид сверху' },
          { id: 'b', text: 'внешний вид фасада' },
          { id: 'c', text: 'объект после мысленного среза' },
          { id: 'd', text: 'перспективный рисунок' },
        ],
        correctOptionId: 'c',
      },
      {
        difficulty: 'medium',
        prompt: 'План здания чаще всего показывает',
        options: [
          { id: 'a', text: 'фасад спереди' },
          { id: 'b', text: 'вид сверху на уровне условного сечения' },
          { id: 'c', text: 'вид сбоку' },
          { id: 'd', text: 'перспективу интерьера' },
        ],
        correctOptionId: 'b',
      },
      {
        difficulty: 'hard',
        prompt: 'Какая пара относится к ортогональным изображениям',
        options: [
          { id: 'a', text: 'план и фасад' },
          { id: 'b', text: 'перспектива и аксонометрия' },
          { id: 'c', text: 'перспектива и разрез' },
          { id: 'd', text: 'аксонометрия и перспектива' },
        ],
        correctOptionId: 'a',
      },
    ],
  },
  {
    id: 'Q10',
    type: 'micro_check',
    domain: 'logic',
    label: MICRO_CHECK_LABEL,
    variants: [
      {
        difficulty: 'easy',
        prompt: '2, 4, 8, 16, ?',
        options: [
          { id: 'a', text: '18' },
          { id: 'b', text: '24' },
          { id: 'c', text: '32' },
          { id: 'd', text: '34' },
        ],
        correctOptionId: 'c',
      },
      {
        difficulty: 'medium',
        prompt: 'Все A это B. Некоторые B это C. Следует ли, что некоторые A это C',
        options: [
          { id: 'a', text: 'всегда да' },
          { id: 'b', text: 'всегда нет' },
          { id: 'c', text: 'не обязательно' },
          { id: 'd', text: 'данных недостаточно' },
        ],
        correctOptionId: 'c',
      },
      {
        difficulty: 'hard',
        prompt: 'Если идет дождь, то улица мокрая. Улица мокрая. Что верно',
        options: [
          { id: 'a', text: 'значит, идет дождь' },
          { id: 'b', text: 'дождя нет' },
          { id: 'c', text: 'нельзя сделать вывод, что идет дождь' },
          { id: 'd', text: 'улица не может быть мокрой без дождя' },
        ],
        correctOptionId: 'c',
      },
    ],
  },
];

export const ALL_ASSESSMENT_QUESTIONS: AssessmentQuestionDef[] = [
  ...SELF_ASSESSMENT_QUESTIONS,
  ...MICRO_CHECK_QUESTIONS,
];

export const TOTAL_QUESTIONS = 10;
