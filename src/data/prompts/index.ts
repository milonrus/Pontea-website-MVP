import { readFileSync } from 'fs';
import { join } from 'path';

let cachedPrompt: string | null = null;

const getPromptPath = () => join(process.cwd(), 'src/data/prompts/parsing-prompt.md');

export function getParsingPrompt(): string {
  if (cachedPrompt) {
    return cachedPrompt;
  }

  try {
    cachedPrompt = readFileSync(getPromptPath(), 'utf-8').trim();
    return cachedPrompt;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown error';
    throw new Error(`Parsing prompt configuration not found: ${message}`);
  }
}

export function buildBatchParsingPrompt(subjectList: string): string {
  const basePrompt = getParsingPrompt();
  const subjectAddition = [
    '',
    'Additional requirements for this batch job:',
    `- Determine detectedSubject from this allow-list only: ${subjectList}.`,
    '- If subject is uncertain, return an empty string.',
    '- Determine detectedDifficulty as one of: easy, medium, hard, or empty string if uncertain.'
  ].join('\n');

  return `${basePrompt}\n${subjectAddition}`;
}
