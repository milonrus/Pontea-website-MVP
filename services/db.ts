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
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { SubjectModel, TopicModel, QuestionModel, QuestionReport, UserProfile, StudentProgress } from '../types';

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

// --- EXTENDED SUBJECT CRUD ---
export const updateSubject = async (id: string, data: Partial<SubjectModel>) => {
  const ref = doc(db, 'subjects', id);
  return await updateDoc(ref, data);
};

export const deleteSubject = async (id: string) => {
  await deleteDoc(doc(db, 'subjects', id));
};

// --- EXTENDED TOPIC CRUD ---
export const getAllTopics = async (): Promise<TopicModel[]> => {
  const q = query(collection(db, 'topics'), orderBy('order', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TopicModel));
};

export const updateTopic = async (id: string, data: Partial<TopicModel>) => {
  const ref = doc(db, 'topics', id);
  return await updateDoc(ref, data);
};

export const deleteTopic = async (id: string) => {
  await deleteDoc(doc(db, 'topics', id));
};

// --- QUESTION REPORTS ---
export const getReports = async (status?: string): Promise<QuestionReport[]> => {
  let q;
  if (status && status !== 'all') {
    q = query(
      collection(db, 'questionReports'),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
  } else {
    q = query(collection(db, 'questionReports'), orderBy('createdAt', 'desc'));
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as QuestionReport));
};

export const createReport = async (data: Omit<QuestionReport, 'id' | 'createdAt'>) => {
  return await addDoc(collection(db, 'questionReports'), {
    ...data,
    createdAt: serverTimestamp()
  });
};

export const updateReport = async (id: string, data: Partial<QuestionReport>) => {
  const ref = doc(db, 'questionReports', id);
  const updateData: any = { ...data };
  if (data.status === 'resolved') {
    updateData.resolvedAt = serverTimestamp();
  }
  return await updateDoc(ref, updateData);
};

export const deleteReport = async (id: string) => {
  await deleteDoc(doc(db, 'questionReports', id));
};

export const getReportCounts = async () => {
  const reports = await getReports();
  return {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    reviewed: reports.filter(r => r.status === 'reviewed').length,
    resolved: reports.filter(r => r.status === 'resolved').length
  };
};

// --- USERS / STUDENTS ---
export const getStudents = async (): Promise<UserProfile[]> => {
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'student'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
};

export const getUser = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as UserProfile;
};

export const updateUser = async (uid: string, data: Partial<UserProfile>) => {
  const ref = doc(db, 'users', uid);
  return await updateDoc(ref, data);
};

// --- STUDENT PROGRESS ---
export const getStudentProgress = async (userId: string): Promise<StudentProgress | null> => {
  const snap = await getDoc(doc(db, 'studentProgress', userId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as StudentProgress;
};

export const getAllStudentProgress = async (): Promise<StudentProgress[]> => {
  const snapshot = await getDocs(collection(db, 'studentProgress'));
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StudentProgress));
};

// --- STATS HELPERS ---
export const getQuestionCount = async (): Promise<number> => {
  const snapshot = await getDocs(collection(db, 'questions'));
  return snapshot.size;
};

export const getStudentCount = async (): Promise<number> => {
  const q = query(collection(db, 'users'), where('role', '==', 'student'));
  const snapshot = await getDocs(q);
  return snapshot.size;
};

export const getQuestionsAddedThisWeek = async (): Promise<number> => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const q = query(
    collection(db, 'questions'),
    where('createdAt', '>=', Timestamp.fromDate(oneWeekAgo))
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
};
