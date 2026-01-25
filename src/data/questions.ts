import { Question } from '@/types';

export const QUESTIONS: Question[] = [
  // --- READING COMPREHENSION (RC) ---
  {
    id: 'RC-Q1',
    category: 'Reading Comprehension',
    difficulty: 'Easy',
    passage: "Cities often add bike lanes to reduce traffic. In the short term, drivers may complain because a lane disappears. Yet, when cycling becomes safer, more commuters switch from cars to bikes. Over time, the city can see fewer cars, less noise, and healthier residents. The key is designing lanes that connect neighborhoods rather than isolated segments.",
    text: 'The author’s main point is that bike lanes...',
    options: [
      'always increase traffic permanently',
      'cause complaints because cycling is unsafe',
      'can reduce car use if designed as connected networks',
      'only benefit athletes',
      'are cheaper than public transport in every case'
    ],
    correctAnswer: 2
  },
  {
    id: 'RC-Q2',
    category: 'Reading Comprehension',
    difficulty: 'Medium',
    passage: "Cities often add bike lanes to reduce traffic. In the short term, drivers may complain because a lane disappears. Yet, when cycling becomes safer, more commuters switch from cars to bikes. Over time, the city can see fewer cars, less noise, and healthier residents. The key is designing lanes that connect neighborhoods rather than isolated segments.",
    text: 'From the passage, what is most likely true?',
    options: [
      'Isolated bike lanes are as effective as connected ones',
      'Some initial opposition can happen even if benefits appear later',
      'Cities add bike lanes mainly to train athletes',
      'Bike lanes always reduce noise immediately',
      'Drivers never switch to cycling'
    ],
    correctAnswer: 1
  },

  // --- LOGICAL REASONING (LR) ---
  {
    id: 'LR-Q1',
    category: 'Logical Reasoning',
    difficulty: 'Easy',
    text: 'If ALL students who pass ARCHED have practiced timed sections, and Luca passed ARCHED, then:',
    options: [
      'Luca did not practice timed sections',
      'Luca practiced timed sections',
      'Luca practiced only reading comprehension',
      'Some students who pass did not practice',
      'No students practiced'
    ],
    correctAnswer: 1
  },
  {
    id: 'LR-Q2',
    category: 'Logical Reasoning',
    difficulty: 'Medium',
    text: 'Claim: "This course is effective because students like it." Which is the strongest critique?',
    options: [
      'Liking a course doesn’t prove it improves scores',
      'Courses should be free',
      'Students dislike tests',
      'Architecture is hard',
      'Some students like videos'
    ],
    correctAnswer: 0
  },

  // --- KNOWLEDGE & HISTORY (KH) ---
  {
    id: 'KH-Q1',
    category: 'Knowledge & History',
    difficulty: 'Easy',
    text: 'Which pair is most associated with the Renaissance?',
    options: [
      'Flying buttresses + stained glass dominance',
      'Symmetry/proportion + classical columns revived',
      'Steel frame skyscrapers + curtain walls',
      'Abstract expressionism + dripping paint',
      'Photorealism + digital rendering'
    ],
    correctAnswer: 1
  },
  {
    id: 'KH-Q2',
    category: 'Knowledge & History',
    difficulty: 'Medium',
    text: 'A "constitution" is best described as:',
    options: [
      'A city’s weekly news',
      'A country’s basic legal framework defining powers and rights',
      'A list of art movements',
      'A building material',
      'A tax receipt'
    ],
    correctAnswer: 1
  },

  // --- DRAWING & REPRESENTATION (DR) ---
  {
    id: 'DR-Q1',
    category: 'Drawing & Representation',
    difficulty: 'Easy',
    text: 'A PLAN view primarily shows:',
    options: [
      'Height vs width',
      'Top-down layout of spaces',
      'Perspective depth',
      'Shadow directions only',
      'Material textures'
    ],
    correctAnswer: 1
  },
  {
    id: 'DR-Q2',
    category: 'Drawing & Representation',
    difficulty: 'Medium',
    text: 'In which representation do parallel edges of a cube typically remain parallel (not converging)?',
    options: [
      'Two-point perspective',
      'One-point perspective',
      'Axonometric projection',
      'Photographic lens distortion',
      'None of the above'
    ],
    correctAnswer: 2
  },

  // --- MATH & PHYSICS (MP) ---
  {
    id: 'MP-Q1',
    category: 'Math & Physics',
    difficulty: 'Easy',
    text: 'If 3x – 5 = 10, then x =',
    options: ['3', '5', '-5', '15', '0'],
    correctAnswer: 1
  },
  {
    id: 'MP-Q2',
    category: 'Math & Physics',
    difficulty: 'Medium',
    text: 'If a circuit has voltage 12V and resistance 6Ω, current is:',
    options: ['0.5A', '2A', '6A', '12A', '18A'],
    correctAnswer: 1
  }
];
