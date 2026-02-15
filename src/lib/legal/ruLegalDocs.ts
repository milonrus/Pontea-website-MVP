import { readFile } from 'fs/promises';
import { join } from 'path';

export type RuLegalDocId = 'privacy' | 'consent' | 'terms' | 'cookies';

export interface RuLegalDocMeta {
  id: RuLegalDocId;
  title: string;
  fileName: `${RuLegalDocId}.md`;
}

export interface RuLegalDoc {
  id: RuLegalDocMeta['id'];
  title: RuLegalDocMeta['title'];
  fileName: RuLegalDocMeta['fileName'];
  content: string;
}

const RU_LEGAL_DOCS_DIR = join(process.cwd(), 'src/content/legal/ru');

const RU_LEGAL_DOC_MANIFEST: readonly RuLegalDocMeta[] = [
  {
    id: 'privacy',
    title: 'Политика обработки персональных данных',
    fileName: 'privacy.md'
  },
  {
    id: 'consent',
    title: 'Согласие на обработку персональных данных',
    fileName: 'consent.md'
  },
  {
    id: 'terms',
    title: 'Пользовательское соглашение',
    fileName: 'terms.md'
  },
  {
    id: 'cookies',
    title: 'Политика использования файлов cookie',
    fileName: 'cookies.md'
  }
];

export const RU_LEGAL_DOC_IDS: readonly RuLegalDocId[] = RU_LEGAL_DOC_MANIFEST.map((doc) => doc.id);

export function isRuLegalDocId(value: string): value is RuLegalDocId {
  return RU_LEGAL_DOC_IDS.includes(value as RuLegalDocId);
}

export function getRuLegalDocMetas(): RuLegalDocMeta[] {
  return [...RU_LEGAL_DOC_MANIFEST];
}

export async function getRuLegalDoc(id: RuLegalDocId): Promise<RuLegalDoc> {
  const doc = RU_LEGAL_DOC_MANIFEST.find((item) => item.id === id);
  if (!doc) {
    throw new Error(`Unknown RU legal document id: ${id}`);
  }

  const filePath = join(RU_LEGAL_DOCS_DIR, doc.fileName);
  const content = await readFile(filePath, 'utf-8');

  return {
    ...doc,
    content
  };
}

export async function getRuLegalDocs(): Promise<RuLegalDoc[]> {
  return Promise.all(
    RU_LEGAL_DOC_IDS.map((id) => getRuLegalDoc(id))
  );
}
