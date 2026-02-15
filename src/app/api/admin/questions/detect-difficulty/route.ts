import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getAuthUser, createServerClient } from '@/lib/supabase/server';
import { getOptionalServerEnv } from '@/lib/env/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OPENAI_DIFFICULTY_MODEL = getOptionalServerEnv('OPENAI_DIFFICULTY_MODEL') || 'gpt-4o-mini';

interface DifficultyDetectRequest {
  questions: Array<{
    id: string;
    questionText: string;
  }>;
}

interface DifficultyResult {
  id: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role from users table
    const supabase = createServerClient();
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: DifficultyDetectRequest = await request.json();

    if (!body.questions || body.questions.length === 0) {
      return NextResponse.json({ error: 'No questions provided' }, { status: 400 });
    }

    // Process in batches of 10
    const results: DifficultyResult[] = [];
    const batchSize = 10;

    for (let i = 0; i < body.questions.length; i += batchSize) {
      const batch = body.questions.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(q => detectDifficulty(q.questionText, q.id))
      );
      results.push(...batchResults);
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Difficulty detection error:', error);
    return NextResponse.json(
      { error: 'Failed to detect difficulty' },
      { status: 500 }
    );
  }
}

async function detectDifficulty(
  questionText: string,
  id: string
): Promise<DifficultyResult> {
  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_DIFFICULTY_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are an expert at analyzing educational question difficulty.
Analyze the question and respond with ONLY one word: "easy", "medium", or "hard".

Criteria:
- easy: Basic recall, simple definitions, straightforward concepts
- medium: Application of concepts, moderate reasoning, standard problems
- hard: Complex analysis, multi-step reasoning, advanced synthesis`
        },
        {
          role: 'user',
          content: questionText
        }
      ],
      temperature: 0.3,
      max_tokens: 10
    });

    const difficulty = completion.choices[0].message.content
      ?.toLowerCase()
      .trim() as 'easy' | 'medium' | 'hard';

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return { id, difficulty: 'medium' };
    }

    return { id, difficulty };
  } catch (error) {
    console.error(`Difficulty detection failed for question ${id}:`, error);
    return { id, difficulty: 'medium' };
  }
}
