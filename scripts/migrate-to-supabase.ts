import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const readJson = async <T>(filePath: string): Promise<T> => {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
};

const toIsoString = (value: any) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return new Date(value).toISOString();
  if (value._seconds) return new Date(value._seconds * 1000).toISOString();
  if (value.seconds) return new Date(value.seconds * 1000).toISOString();
  return new Date(value).toISOString();
};

const main = async () => {
  const exportDir = process.argv[2] || path.join(process.cwd(), 'data', 'firestore-export');

  const [users, subjects, topics, questions, progress, exerciseSets, exerciseResponses, reports] = await Promise.all([
    readJson<any[]>(path.join(exportDir, 'users.json')),
    readJson<any[]>(path.join(exportDir, 'subjects.json')),
    readJson<any[]>(path.join(exportDir, 'topics.json')),
    readJson<any[]>(path.join(exportDir, 'questions.json')),
    readJson<any[]>(path.join(exportDir, 'studentProgress.json')),
    readJson<any[]>(path.join(exportDir, 'exerciseSets.json')),
    readJson<any[]>(path.join(exportDir, 'exerciseResponses.json')),
    readJson<any[]>(path.join(exportDir, 'questionReports.json'))
  ]);

  // TODO: Transform IDs and timestamps, then insert in FK order.
  // Example (users):
  // const userRows = users.map(u => ({
  //   id: u.uid,
  //   email: u.email,
  //   display_name: u.displayName,
  //   role: u.role,
  //   created_at: toIsoString(u.createdAt),
  //   settings: u.settings
  // }));
  // await supabase.from('users').insert(userRows);

  console.log('Loaded export:', {
    users: users.length,
    subjects: subjects.length,
    topics: topics.length,
    questions: questions.length,
    progress: progress.length,
    exerciseSets: exerciseSets.length,
    exerciseResponses: exerciseResponses.length,
    reports: reports.length
  });
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
