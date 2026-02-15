import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/supabase/server';
import { getSubjects } from '@/lib/db';
import {
  BulkParseRequest,
  ParsedImageQuestion,
  SubjectModel,
  QuestionDifficulty,
  SSEStartEvent,
  SSEProgressEvent,
  SSECompleteEvent,
  BulkParseResult
} from '@/types';
import { buildBatchParsingPrompt } from '@/data/prompts';
import { getOptionalServerEnv } from '@/lib/env/server';

const MAX_IMAGES = 50;
const CONCURRENCY_LIMIT = 3;
const TIMEOUT_PER_IMAGE = 30000;
const MAX_RETRIES = 3;
const OPENAI_PARSE_STREAM_MODEL =
  getOptionalServerEnv('OPENAI_PARSE_STREAM_MODEL') ||
  getOptionalServerEnv('OPENAI_PARSE_MODEL') ||
  'gpt-4o-mini';

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
  signal: AbortSignal,
  retries = MAX_RETRIES
): Promise<{ success: boolean; question?: ParsedImageQuestion; error?: string }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (signal.aborted) {
        throw new Error('Request aborted');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_PER_IMAGE);

      // Link the parent signal to the controller
      const linkedSignal = AbortSignal.any([signal, controller.signal]);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: linkedSignal,
        body: JSON.stringify({
          model: OPENAI_PARSE_STREAM_MODEL,
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
      return { success: true, question: normalizeParsedQuestion(parsed, subjectMap) };
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message === 'Request aborted') {
        return { success: false, error: 'Request cancelled' };
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

interface ImageItem {
  id: string;
  dataUrl: string;
}

async function processWithConcurrencyAndProgress<T extends ImageItem>(
  items: T[],
  processor: (item: T, signal: AbortSignal) => Promise<BulkParseResult>,
  concurrency: number,
  onProgress: (event: SSEProgressEvent) => void,
  signal: AbortSignal
): Promise<BulkParseResult[]> {
  const results: BulkParseResult[] = new Array(items.length);
  let currentIndex = 0;
  let completedCount = 0;
  const activelyParsing = new Set<string>();

  const worker = async () => {
    while (currentIndex < items.length) {
      if (signal.aborted) break;

      const index = currentIndex++;
      const item = items[index];
      const imageId = item.id;

      // Send 'parsing' event when worker picks up the image
      activelyParsing.add(imageId);
      onProgress({
        id: imageId,
        status: 'parsing',
        completed: completedCount,
        total: items.length
      });

      try {
        results[index] = await processor(item, signal);
        const result = results[index];

        // Send 'success' or 'error' event when complete
        completedCount++;
        activelyParsing.delete(imageId);
        onProgress({
          id: imageId,
          status: result.success ? 'success' : 'error',
          question: result.question,
          error: result.error,
          completed: completedCount,
          total: items.length
        });
      } catch (error: any) {
        completedCount++;
        activelyParsing.delete(imageId);
        results[index] = {
          id: imageId,
          success: false,
          error: error.message || 'Processing failed'
        };
        onProgress({
          id: imageId,
          status: 'error',
          error: error.message || 'Processing failed',
          completed: completedCount,
          total: items.length
        });
      }
    }
  };

  const workers = Array(Math.min(concurrency, items.length))
    .fill(null)
    .map(() => worker());

  await Promise.all(workers);
  return results;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const supabase = createServerClient();
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
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

    // Validate images
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

    // Fetch subjects
    const subjects = await getSubjects();
    if (subjects.length === 0) {
      return NextResponse.json(
        { error: 'No subjects found. Please add subjects first.' },
        { status: 500 }
      );
    }

    const subjectList = subjects.map(s => s.name).join(', ');
    const subjectMap = new Map(subjects.map(s => [s.name.toLowerCase(), s.id]));
    const systemPrompt = buildBatchParsingPrompt(subjectList);
    const jsonSchema = buildJsonSchema(subjects);

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          // Send start event
          const startEvent: SSEStartEvent = {
            sessionId,
            totalImages: body.images.length,
            concurrency: CONCURRENCY_LIMIT
          };
          controller.enqueue(
            encoder.encode(`event: start\ndata: ${JSON.stringify(startEvent)}\n\n`)
          );

          // Process images with progress events
          const results = await processWithConcurrencyAndProgress(
            body.images,
            async (img, signal): Promise<BulkParseResult> => {
              const result = await parseImageWithRetry(
                img.dataUrl,
                apiKey,
                systemPrompt,
                jsonSchema,
                subjectMap,
                signal
              );
              return {
                id: img.id,
                success: result.success,
                question: result.question,
                error: result.error
              };
            },
            CONCURRENCY_LIMIT,
            (progressEvent) => {
              controller.enqueue(
                encoder.encode(`event: progress\ndata: ${JSON.stringify(progressEvent)}\n\n`)
              );
            },
            request.signal
          );

          // Send complete event
          const successCount = results.filter(r => r.success).length;
          const errorCount = results.length - successCount;
          const completeEvent: SSECompleteEvent = {
            successCount,
            errorCount,
            results
          };
          controller.enqueue(
            encoder.encode(`event: complete\ndata: ${JSON.stringify(completeEvent)}\n\n`)
          );

          controller.close();
        } catch (error: any) {
          const errorMessage = error.message || 'Processing failed';
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ message: errorMessage })}\n\n`)
          );
          controller.close();
        }
      }
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('[STREAM_PARSE] Error in admin/questions/parse-batch/stream POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
