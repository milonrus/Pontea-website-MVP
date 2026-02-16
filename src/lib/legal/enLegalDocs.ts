import { readFile } from 'fs/promises';
import { join } from 'path';

export type EnLegalDocId = 'privacy' | 'consent' | 'terms' | 'cookies';

export interface EnLegalDocMeta {
  id: EnLegalDocId;
  title: string;
  fileName: `${EnLegalDocId}.md`;
}

export interface EnLegalDoc {
  id: EnLegalDocMeta['id'];
  title: EnLegalDocMeta['title'];
  fileName: EnLegalDocMeta['fileName'];
  content: string;
}

const EN_LEGAL_DOCS_DIR = join(process.cwd(), 'src/content/legal/en');

const EN_LEGAL_DOC_MANIFEST: readonly EnLegalDocMeta[] = [
  {
    id: 'privacy',
    title: 'Privacy Policy',
    fileName: 'privacy.md'
  },
  {
    id: 'consent',
    title: 'Consent to Personal Data Processing',
    fileName: 'consent.md'
  },
  {
    id: 'terms',
    title: 'Terms of Use',
    fileName: 'terms.md'
  },
  {
    id: 'cookies',
    title: 'Cookie Policy',
    fileName: 'cookies.md'
  }
];

export const EN_LEGAL_DOC_IDS: readonly EnLegalDocId[] = EN_LEGAL_DOC_MANIFEST.map((doc) => doc.id);

export function isEnLegalDocId(value: string): value is EnLegalDocId {
  return EN_LEGAL_DOC_IDS.includes(value as EnLegalDocId);
}

export function getEnLegalDocMetas(): EnLegalDocMeta[] {
  return [...EN_LEGAL_DOC_MANIFEST];
}

export async function getEnLegalDoc(id: EnLegalDocId): Promise<EnLegalDoc> {
  const doc = EN_LEGAL_DOC_MANIFEST.find((item) => item.id === id);
  if (!doc) {
    throw new Error(`Unknown EN legal document id: ${id}`);
  }

  const filePath = join(EN_LEGAL_DOCS_DIR, doc.fileName);
  const content = await readFile(filePath, 'utf-8');

  return {
    ...doc,
    content
  };
}

export async function getEnLegalDocs(): Promise<EnLegalDoc[]> {
  return Promise.all(
    EN_LEGAL_DOC_IDS.map((id) => getEnLegalDoc(id))
  );
}
