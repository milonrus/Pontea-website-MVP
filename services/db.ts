import { 
  collection, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  limit,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { SubjectModel, TopicModel, QuestionModel } from '../types';

// --- SUBJECTS ---
export const getSubjects = async (): Promise<SubjectModel[]> => {
  const q = query(collection(db, 'subjects'), orderBy('order', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SubjectModel));
};

export const createSubject = async (data: Omit<SubjectModel, 'id' | 'createdAt'>) => {
  return await addDoc(collection(db, 'subjects'), {
    ...data,
    createdAt: serverTimestamp()
  });
};

// --- TOPICS ---
export const getTopics = async (subjectId: string): Promise<TopicModel[]> => {
  const q = query(
    collection(db, 'topics'), 
    where('subjectId', '==', subjectId),
    orderBy('order', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TopicModel));
};

export const createTopic = async (data: Omit<TopicModel, 'id' | 'createdAt'>) => {
  return await addDoc(collection(db, 'topics'), {
    ...data,
    createdAt: serverTimestamp()
  });
};

// --- QUESTIONS ---
export const getQuestions = async (limitCount = 50): Promise<QuestionModel[]> => {
  const q = query(
    collection(db, 'questions'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as QuestionModel));
};

export const getQuestion = async (id: string): Promise<QuestionModel | null> => {
  const snap = await getDoc(doc(db, 'questions', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as QuestionModel;
};

export const createQuestion = async (data: Omit<QuestionModel, 'id' | 'createdAt' | 'updatedAt' | 'stats'>) => {
  return await addDoc(collection(db, 'questions'), {
    ...data,
    stats: { totalAttempts: 0, totalTimeSpent: 0, correctCount: 0 },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const updateQuestion = async (id: string, data: Partial<QuestionModel>) => {
  const ref = doc(db, 'questions', id);
  return await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const deleteQuestion = async (id: string) => {
  await deleteDoc(doc(db, 'questions', id));
};

export const batchCreateQuestions = async (questions: Omit<QuestionModel, 'id' | 'createdAt' | 'updatedAt'>[]) => {
  const batch = writeBatch(db);
  const collectionRef = collection(db, 'questions');
  
  // Firestore batch limit is 500. We assume reasonable chunk sizes or implement loop here.
  // For MVP, if > 500, we'd need to loop. Here we assume one chunk.
  
  questions.forEach(q => {
    const docRef = doc(collectionRef);
    batch.set(docRef, {
      ...q,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });
  
  await batch.commit();
};
