import { readFileSync } from 'fs';
import { join } from 'path';

console.log('[PROMPT_LOADER_INIT] Module loading...');

let cachedPrompt: string | null = null;

export function getParsingPrompt(): string {
  console.log('[PROMPT_LOADER] getParsingPrompt() called');
  console.log('[PROMPT_LOADER] cachedPrompt exists?', !!cachedPrompt);

  if (cachedPrompt) {
    console.log('[PROMPT_LOADER] Using cached parsing prompt, length:', cachedPrompt.length);
    return cachedPrompt;
  }

  try {
    const cwd = process.cwd();
    console.log('[PROMPT_LOADER] Current working directory:', cwd);

    const promptPath = join(cwd, 'src/data/prompts/parsing-prompt.md');
    console.log('[PROMPT_LOADER] Attempting to load from:', promptPath);

    const markdownContent = readFileSync(promptPath, 'utf-8');
    console.log('[PROMPT_LOADER] Raw markdown loaded, length:', markdownContent.length);

    // Convert markdown to plain text prompt
    // Remove markdown headers and formatting, keep the content
    const lines = markdownContent
      .split('\n')
      .filter(line => {
        // Skip markdown headers (lines starting with #)
        return !line.startsWith('#');
      })
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join(' ');

    cachedPrompt = lines;
    console.log('[PROMPT_LOADER] ✅ Loaded parsing prompt successfully');
    console.log('[PROMPT_LOADER] Final prompt length:', cachedPrompt.length, 'characters');
    console.log('[PROMPT_LOADER] First 100 chars:', cachedPrompt.substring(0, 100));
    return cachedPrompt;
  } catch (error) {
    console.error('[PROMPT_LOADER] ❌ ERROR loading prompt:', error);
    throw new Error('Parsing prompt configuration not found');
  }
}

export function buildBatchParsingPrompt(subjectList: string): string {
  const basePrompt = getParsingPrompt();
  const subjectAddition = [
    `SUBJECT DETECTION: Analyze the question content and determine which subject it belongs to.`,
    `Valid subjects: ${subjectList}.`,
    `Return the exact subject name from this list, or an empty string if uncertain.`,
    `DIFFICULTY DETECTION: Assess the question's complexity level.`,
    `Return one of: "easy", "medium", "hard", or empty string if uncertain.`
  ].join(' ');

  console.log('[PROMPT_LOADER] buildBatchParsingPrompt() called with subjects:', subjectList.substring(0, 50));
  return basePrompt + ' ' + subjectAddition;
}
