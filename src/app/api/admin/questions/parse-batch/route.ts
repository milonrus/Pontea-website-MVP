import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/supabase/server';
import { getSubjects } from '@/lib/db';
import { BulkParseRequest, BulkParseResponse, BulkParseResult, ParsedImageQuestion, SubjectModel, QuestionDifficulty } from '@/types';
import { buildBatchParsingPrompt } from '@/data/prompts';
import { getOptionalServerEnv } from '@/lib/env/server';

const MAX_IMAGES = 50;
const CONCURRENCY_LIMIT = 3;
const TIMEOUT_PER_IMAGE = 30000;
const MAX_RETRIES = 3;
const OPENAI_PARSE_MODEL = getOptionalServerEnv('OPENAI_PARSE_MODEL') || 'gpt-5-mini';

const optionOrder = ['a', 'b', 'c', 'd', 'e'] as const;

type ParsedOption = {
  id?: string;
  text?: string;
};

type OpenAIParsedQuestion = {
  questionText?: string;
  options?: ParsedOption[];
  correctAnswer?: string;
  explanation?: string;
  detectedSubject?: string;
  detectedDifficulty?: string;
};

const restoreLatexEscapes = (text: string): string => {
  if (!text) return text;

  const restoreControls = (value: string) =>
    value
      .replace(/\t/g, '\\t')
      .replace(/\f/g, '\\f')
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n')
      .replace(/\x08/g, '\\b');

  let result = '';
  let i = 0;

  while (i < text.length) {
    if (text.startsWith('$$', i)) {
      const end = text.indexOf('$$', i + 2);
      if (end === -1) {
        result += text.slice(i);
        break;
      }
      result += `$$${restoreControls(text.slice(i + 2, end))}$$`;
      i = end + 2;
      continue;
    }

    if (text[i] === '$') {
      const end = text.indexOf('$', i + 1);
      if (end === -1) {
        result += text.slice(i);
        break;
      }
      result += `$${restoreControls(text.slice(i + 1, end))}$`;
      i = end + 1;
      continue;
    }

    result += text[i];
    i += 1;
  }

  return result;
};

const normalizeParsedQuestion = (
  parsed: OpenAIParsedQuestion,
  subjectMap: Map<string, string>
): ParsedImageQuestion => {
  // Build options from parsed data
  const options = [];
  for (const id of optionOrder) {
    const match = parsed.options?.find((opt) => opt?.id === id);
    if (match && typeof match.text === 'string' && match.text.trim()) {
      options.push({ id: id as any, text: restoreLatexEscapes(match.text) });
    }
  }

  // Strict validation: must have 4-5 options (no padding)
  // If <4 or >5, the question will fail validation in ParsedQuestionEditor

  const validOptions = options.map(o => o.id);
  const correctAnswer = validOptions.includes(parsed.correctAnswer as any)
    ? parsed.correctAnswer!
    : '';

  // Map detected subject name to subject ID
  let subjectId: string | undefined = undefined;
  if (parsed.detectedSubject && typeof parsed.detectedSubject === 'string') {
    const normalizedName = parsed.detectedSubject.trim().toLowerCase();
    subjectId = subjectMap.get(normalizedName);
  }

  // Validate detected difficulty
  const validDifficulties: readonly QuestionDifficulty[] = ['easy', 'medium', 'hard'];
  const difficulty = validDifficulties.includes(parsed.detectedDifficulty as any)
    ? (parsed.detectedDifficulty as QuestionDifficulty)
    : undefined;

  return {
    questionText: typeof parsed.questionText === 'string' ? restoreLatexEscapes(parsed.questionText) : '',
    options,
    correctAnswer,
    explanation: typeof parsed.explanation === 'string' ? restoreLatexEscapes(parsed.explanation) : '',
    subjectId,
    difficulty,
    isSubjectAutoDetected: !!subjectId,
    isDifficultyAutoDetected: !!difficulty
  };
};


const buildJsonSchema = (subjects: SubjectModel[]) => {
  const subjectNames = subjects.map(s => s.name);

  return {
    name: 'parsed_question',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['questionText', 'options', 'correctAnswer', 'explanation', 'detectedSubject', 'detectedDifficulty'],
      properties: {
        questionText: { type: 'string' },
        options: {
          type: 'array',
          minItems: 4,
          maxItems: 5,
          items: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'text'],
            properties: {
              id: { type: 'string', enum: ['a', 'b', 'c', 'd', 'e'] },
              text: { type: 'string' }
            }
          }
        },
        correctAnswer: { type: 'string', enum: ['a', 'b', 'c', 'd', 'e', ''] },
        explanation: { type: 'string' },
        detectedSubject: {
          type: 'string',
          enum: [...subjectNames, '']
        },
        detectedDifficulty: {
          type: 'string',
          enum: ['easy', 'medium', 'hard', '']
        }
      }
    }
  };
};

async function parseImageWithRetry(
  imageDataUrl: string,
  apiKey: string,
  systemPrompt: string,
  jsonSchema: any,
  subjectMap: Map<string, string>,
  retries = MAX_RETRIES
): Promise<{ success: boolean; question?: ParsedImageQuestion; error?: string }> {
  console.log('[PARSE_IMAGE] 🔄 Starting to parse image, will retry up to', retries, 'times');
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_PER_IMAGE);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: OPENAI_PARSE_MODEL,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Parse the question and return the structured fields.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageDataUrl
                  }
                }
              ]
            }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: jsonSchema
          }
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
      const content = data.choices?.[0]?.message?.content;

      if (!content || typeof content !== 'string') {
        return { success: false, error: 'Invalid response from parser' };
      }

      const parsed: OpenAIParsedQuestion = JSON.parse(content);
      console.log('[PARSE_IMAGE] ✅ Successfully parsed image on attempt', attempt);
      return { success: true, question: normalizeParsedQuestion(parsed, subjectMap) };
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

  console.log('[PARSE_IMAGE] ❌ All', retries, 'attempts failed');
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
  console.log('[BATCH_PARSE] 🟢 POST /api/admin/questions/parse-batch called');
  try {
    console.log('[BATCH_PARSE] Step 1: Authenticating user');
    const user = await getAuthUser(request);
    if (!user) {
      console.log('[BATCH_PARSE] ❌ Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('[BATCH_PARSE] ✅ User authenticated:', user.id);

    console.log('[BATCH_PARSE] Step 2: Checking admin role');
    const supabase = createServerClient();
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      console.log('[BATCH_PARSE] ❌ User is not admin');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.log('[BATCH_PARSE] ✅ Admin role confirmed');

    console.log('[BATCH_PARSE] Step 3: Parsing request body');
    const body: BulkParseRequest = await request.json();

    if (!body.images || !Array.isArray(body.images)) {
      console.log('[BATCH_PARSE] ❌ Missing images array');
      return NextResponse.json({ error: 'images array is required' }, { status: 400 });
    }

    if (body.images.length > MAX_IMAGES) {
      console.log(`[BATCH_PARSE] ❌ Too many images: ${body.images.length}`);
      return NextResponse.json(
        { error: `Maximum ${MAX_IMAGES} images allowed per batch` },
        { status: 400 }
      );
    }

    if (body.images.length === 0) {
      console.log('[BATCH_PARSE] ❌ No images provided');
      return NextResponse.json({ error: 'At least one image is required' }, { status: 400 });
    }

    console.log('[BATCH_PARSE] ✅ Got', body.images.length, 'images to parse');

    // Validate each image
    for (const img of body.images) {
      if (!img.id || !img.dataUrl) {
        console.log('[BATCH_PARSE] ❌ Image missing id or dataUrl');
        return NextResponse.json(
          { error: 'Each image must have id and dataUrl' },
          { status: 400 }
        );
      }
      if (!img.dataUrl.startsWith('data:image/')) {
        console.log('[BATCH_PARSE] ❌ Invalid image format for id', img.id);
        return NextResponse.json(
          { error: `Invalid image format for id ${img.id}` },
          { status: 400 }
        );
      }
    }
    console.log('[BATCH_PARSE] ✅ All images valid');

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.log('[BATCH_PARSE] ❌ OpenAI API key not configured');
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    console.log('[BATCH_PARSE] Step 4: Fetching subjects from database');
    // Fetch subjects from database
    const subjects = await getSubjects();
    if (subjects.length === 0) {
      console.log('[BATCH_PARSE] ❌ No subjects found in database');
      return NextResponse.json(
        { error: 'No subjects found. Please add subjects first.' },
        { status: 500 }
      );
    }
    console.log('[BATCH_PARSE] ✅ Found', subjects.length, 'subjects:', subjects.map(s => s.name).join(', '));

    const subjectList = subjects.map(s => s.name).join(', ');
    const subjectMap = new Map(subjects.map(s => [s.name.toLowerCase(), s.id]));
    console.log('[BATCH_PARSE] Building system prompt with subjects:', subjectList.substring(0, 50));
    const systemPrompt = buildBatchParsingPrompt(subjectList);
    console.log('[BATCH_PARSE] System prompt loaded, length:', systemPrompt.length);
    const jsonSchema = buildJsonSchema(subjects);

    console.log('[BATCH_PARSE] Step 5: Processing', body.images.length, 'images with concurrency limit', CONCURRENCY_LIMIT);
    const results = await processWithConcurrency(
      body.images,
      async (img): Promise<BulkParseResult> => {
        const result = await parseImageWithRetry(
          img.dataUrl,
          apiKey,
          systemPrompt,
          jsonSchema,
          subjectMap
        );
        return {
          id: img.id,
          success: result.success,
          question: result.question,
          error: result.error
        };
      },
      CONCURRENCY_LIMIT
    );

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    console.log('[BATCH_PARSE] ✅ Processing complete: ', successCount, 'success,', failureCount, 'failed');

    const response: BulkParseResponse = { results };
    return NextResponse.json(response);
  } catch (error) {
    console.error('[BATCH_PARSE] ❌ Error in admin/questions/parse-batch POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
