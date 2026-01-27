const stripBom = (value: string) => value.replace(/^\uFEFF/, '');

export const normalizeHeaderForDetection = (header: string) =>
  stripBom(header).trim().toLowerCase().replace(/[\s_-]+/g, '');

const canonicalizeHeader = (header: string, mapping: Record<string, string>) => {
  const normalized = normalizeHeaderForDetection(header);
  return mapping[normalized] || stripBom(header).trim();
};

export const normalizePonteaHeader = (header: string) =>
  canonicalizeHeader(header, {
    subjectid: 'subjectId',
    topicid: 'topicId',
    difficulty: 'difficulty',
    tags: 'tags',
    questiontext: 'questionText',
    optiona: 'optionA',
    optionb: 'optionB',
    optionc: 'optionC',
    optiond: 'optionD',
    optione: 'optionE',
    correctanswer: 'correctAnswer',
    explanation: 'explanation'
  });

export const normalizeLearnWorldsHeader = (header: string) =>
  canonicalizeHeader(header, {
    group: 'Group',
    type: 'Type',
    question: 'Question',
    correctans: 'CorrectAns',
    answer1: 'Answer1',
    answer2: 'Answer2',
    answer3: 'Answer3',
    answer4: 'Answer4',
    answer5: 'Answer5',
    correctexplanation: 'CorrectExplanation',
    incorrectexplanation: 'IncorrectExplanation'
  });
