import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/supabase/server';

const optionOrder = ['a', 'b', 'c', 'd'] as const;

type ParsedOption = {
  id?: string;
  text?: string;
};

type ParsedQuestion = {
  questionText?: string;
  options?: ParsedOption[];
  correctAnswer?: string;
  explanation?: string;
};

const normalizeParsedQuestion = (parsed: ParsedQuestion) => {
  const options = optionOrder.map((id) => {
    const match = parsed.options?.find((opt) => opt?.id === id);
    return { id, text: typeof match?.text === 'string' ? match.text : '' };
  });

  const correctAnswer = optionOrder.includes(parsed.correctAnswer as typeof optionOrder[number])
    ? parsed.correctAnswer
    : '';

  return {
    questionText: typeof parsed.questionText === 'string' ? parsed.questionText : '',
    options,
    correctAnswer,
    explanation: typeof parsed.explanation === 'string' ? parsed.explanation : ''
  };
};

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient();
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const imageDataUrl = body?.imageDataUrl;
    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      return NextResponse.json({ error: 'imageDataUrl is required' }, { status: 400 });
    }

    if (!imageDataUrl.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const systemPrompt = [
      'You extract a multiple-choice question from a screenshot.',
      'Return JSON only, matching the provided schema.',
      'IMPORTANT: Wrap ALL mathematical expressions, variables, and formulas in LaTeX delimiters.',
      'Use $...$ for inline math (e.g., $x^2$, $\\frac{1}{2}$, $\\sqrt{2}$).',
      'Use $$...$$ for display/block math equations.',
      'This applies to questionText, ALL option texts, and explanation.',
      'Examples: "$x = 5$", "$\\frac{a}{b}$", "$x^2 + y^2 = r^2$".',
      'Options must be lowercase a-d and must not include the letter label (a, b, c, d) in the text.',
      'If a field is missing, use an empty string.',
      'If the correct answer is not visible, return an empty string for correctAnswer.'
    ].join(' ');

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        temperature: 0,
        max_output_tokens: 800,
        input: [
          { role: 'system', content: [{ type: 'input_text', text: systemPrompt }] },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: 'Parse the question and return the structured fields.'
              },
              { type: 'input_image', image_url: imageDataUrl }
            ]
          }
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'parsed_question',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['questionText', 'options', 'correctAnswer', 'explanation'],
              properties: {
                questionText: { type: 'string' },
                options: {
                  type: 'array',
                  minItems: 4,
                  maxItems: 4,
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['id', 'text'],
                    properties: {
                      id: { type: 'string', enum: ['a', 'b', 'c', 'd'] },
                      text: { type: 'string' }
                    }
                  }
                },
                correctAnswer: { type: 'string', enum: ['a', 'b', 'c', 'd', ''] },
                explanation: { type: 'string' }
              }
            }
          }
        }
      })
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody?.error?.message || 'Failed to parse question';
      console.error('OpenAI parse error:', message);
      return NextResponse.json({ error: message }, { status: 500 });
    }

    const data = await response.json();
    const outputText =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      data.output?.[0]?.content?.[0]?.output_text;

    if (!outputText || typeof outputText !== 'string') {
      return NextResponse.json({ error: 'Invalid response from parser' }, { status: 500 });
    }

    let parsed: ParsedQuestion;
    try {
      parsed = JSON.parse(outputText);
    } catch (error) {
      console.error('Failed to parse OpenAI JSON output:', error);
      return NextResponse.json({ error: 'Failed to parse parser output' }, { status: 500 });
    }

    return NextResponse.json({ question: normalizeParsedQuestion(parsed) });
  } catch (error) {
    console.error('Error in admin/questions/parse POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
