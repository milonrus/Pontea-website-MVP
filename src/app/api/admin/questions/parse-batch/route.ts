import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/supabase/server';
import { BulkParseRequest, BulkParseResponse, BulkParseResult, ParsedImageQuestion } from '@/types';

const MAX_IMAGES = 50;
const CONCURRENCY_LIMIT = 3;
const TIMEOUT_PER_IMAGE = 30000;
const MAX_RETRIES = 3;

const optionOrder = ['a', 'b', 'c', 'd'] as const;

type ParsedOption = {
  id?: string;
  text?: string;
};

type OpenAIParsedQuestion = {
  questionText?: string;
  options?: ParsedOption[];
  correctAnswer?: string;
  explanation?: string;
};

const normalizeParsedQuestion = (parsed: OpenAIParsedQuestion): ParsedImageQuestion => {
  const options = optionOrder.map((id) => {
    const match = parsed.options?.find((opt) => opt?.id === id);
    return { id, text: typeof match?.text === 'string' ? match.text : '' };
  });

  const correctAnswer = optionOrder.includes(parsed.correctAnswer as typeof optionOrder[number])
    ? parsed.correctAnswer!
    : '';

  return {
    questionText: typeof parsed.questionText === 'string' ? parsed.questionText : '',
    options,
    correctAnswer,
    explanation: typeof parsed.explanation === 'string' ? parsed.explanation : ''
  };
};

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

const jsonSchema = {
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
};

async function parseImageWithRetry(
  imageDataUrl: string,
  apiKey: string,
  retries = MAX_RETRIES
): Promise<{ success: boolean; question?: ParsedImageQuestion; error?: string }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_PER_IMAGE);

      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          temperature: 0,
          max_output_tokens: 800,
          input: [
            { role: 'system', content: [{ type: 'input_text', text: systemPrompt }] },
            {
              role: 'user',
              content: [
                { type: 'input_text', text: 'Parse the question and return the structured fields.' },
                { type: 'input_image', image_url: imageDataUrl }
              ]
            }
          ],
          text: { format: jsonSchema }
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message = errorBody?.error?.message || 'Failed to parse question';

        // Check for rate limit
        if (response.status === 429 && attempt < retries) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }

        return { success: false, error: message };
      }

      const data = await response.json();
      const outputText =
        data.output_text ||
        data.output?.[0]?.content?.[0]?.text ||
        data.output?.[0]?.content?.[0]?.output_text;

      if (!outputText || typeof outputText !== 'string') {
        return { success: false, error: 'Invalid response from parser' };
      }

      const parsed: OpenAIParsedQuestion = JSON.parse(outputText);
      return { success: true, question: normalizeParsedQuestion(parsed) };
    } catch (error: any) {
      if (error.name === 'AbortError') {
        if (attempt < retries) continue;
        return { success: false, error: 'Request timed out' };
      }

      if (attempt < retries) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }

      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}

async function processWithConcurrency<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      results[index] = await processor(items[index]);
    }
  }

  const workers = Array(Math.min(concurrency, items.length))
    .fill(null)
    .map(() => worker());

  await Promise.all(workers);
  return results;
}

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

    const body: BulkParseRequest = await request.json();

    if (!body.images || !Array.isArray(body.images)) {
      return NextResponse.json({ error: 'images array is required' }, { status: 400 });
    }

    if (body.images.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_IMAGES} images allowed per batch` },
        { status: 400 }
      );
    }

    if (body.images.length === 0) {
      return NextResponse.json({ error: 'At least one image is required' }, { status: 400 });
    }

    // Validate each image
    for (const img of body.images) {
      if (!img.id || !img.dataUrl) {
        return NextResponse.json(
          { error: 'Each image must have id and dataUrl' },
          { status: 400 }
        );
      }
      if (!img.dataUrl.startsWith('data:image/')) {
        return NextResponse.json(
          { error: `Invalid image format for id ${img.id}` },
          { status: 400 }
        );
      }
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const results = await processWithConcurrency(
      body.images,
      async (img): Promise<BulkParseResult> => {
        const result = await parseImageWithRetry(img.dataUrl, apiKey);
        return {
          id: img.id,
          success: result.success,
          question: result.question,
          error: result.error
        };
      },
      CONCURRENCY_LIMIT
    );

    const response: BulkParseResponse = { results };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in admin/questions/parse-batch POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
