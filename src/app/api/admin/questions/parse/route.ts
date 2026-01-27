import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, getAuthUser } from '@/lib/supabase/server';
import { getParsingPrompt } from '@/data/prompts';

const optionOrder = ['a', 'b', 'c', 'd', 'e'] as const;

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
  // Build options from parsed data
  const options = [];
  for (const id of optionOrder) {
    const match = parsed.options?.find((opt) => opt?.id === id);
    if (match && typeof match.text === 'string' && match.text.trim()) {
      options.push({ id: id as any, text: match.text });
    }
  }

  // Strict validation: must have 4-5 options (no padding)

  const validOptions = options.map(o => o.id);
  const correctAnswer = validOptions.includes(parsed.correctAnswer as any)
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
  console.log('[PARSE_ROUTE] 🟢 POST /api/admin/questions/parse called');
  try {
    console.log('[PARSE_ROUTE] Step 1: Authenticating user');
    const user = await getAuthUser(request);
    if (!user) {
      console.log('[PARSE_ROUTE] ❌ Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log('[PARSE_ROUTE] ✅ User authenticated:', user.id);

    console.log('[PARSE_ROUTE] Step 2: Checking admin role');
    const supabase = createServerClient();
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      console.log('[PARSE_ROUTE] ❌ User is not admin');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.log('[PARSE_ROUTE] ✅ Admin role confirmed');

    console.log('[PARSE_ROUTE] Step 3: Parsing request body');
    const body = await request.json();
    const imageDataUrl = body?.imageDataUrl;
    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      console.log('[PARSE_ROUTE] ❌ Missing imageDataUrl');
      return NextResponse.json({ error: 'imageDataUrl is required' }, { status: 400 });
    }
    console.log('[PARSE_ROUTE] ✅ Image data received, size:', imageDataUrl.length);

    if (!imageDataUrl.startsWith('data:image/')) {
      console.log('[PARSE_ROUTE] ❌ Invalid image format');
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.log('[PARSE_ROUTE] ❌ OpenAI API key not configured');
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    console.log('[PARSE_ROUTE] Step 4: Loading parsing prompt');
    const systemPrompt = getParsingPrompt();
    console.log('[PARSE_ROUTE] ✅ System prompt loaded, length:', systemPrompt.length);
    console.log('[PARSE_ROUTE] ✅ Prompt preview (first 150 chars):', systemPrompt.substring(0, 150));

    console.log('[PARSE_ROUTE] Step 5: Sending request to OpenAI');
    console.log('[PARSE_ROUTE] Using systemPrompt in request with length:', systemPrompt.length);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
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
          json_schema: {
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
                explanation: { type: 'string' }
              }
            }
          }
        }
      })
    });

    console.log('[PARSE_ROUTE] OpenAI response status:', response.status);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const message = errorBody?.error?.message || 'Failed to parse question';
      console.error('[PARSE_ROUTE] ❌ OpenAI parse error:', message);
      return NextResponse.json({ error: message }, { status: 500 });
    }

    console.log('[PARSE_ROUTE] ✅ OpenAI response OK');
    const data = await response.json();
    const outputText = data.choices?.[0]?.message?.content;

    if (!outputText || typeof outputText !== 'string') {
      console.log('[PARSE_ROUTE] ❌ No output text in response');
      return NextResponse.json({ error: 'Invalid response from parser' }, { status: 500 });
    }

    console.log('[PARSE_ROUTE] ✅ Output text extracted, length:', outputText.length);

    let parsed: ParsedQuestion;
    try {
      parsed = JSON.parse(outputText);
      console.log('[PARSE_ROUTE] ✅ JSON parsed successfully');
    } catch (error) {
      console.error('[PARSE_ROUTE] ❌ Failed to parse OpenAI JSON output:', error);
      return NextResponse.json({ error: 'Failed to parse parser output' }, { status: 500 });
    }

    console.log('[PARSE_ROUTE] ✅ Question parsed successfully, returning result');
    return NextResponse.json({ question: normalizeParsedQuestion(parsed) });
  } catch (error) {
    console.error('[PARSE_ROUTE] ❌ Error in admin/questions/parse POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
