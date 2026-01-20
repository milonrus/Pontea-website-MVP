import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  query, 
  where, 
  updateDoc,
  serverTimestamp,
  increment,
  arrayUnion,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { ExerciseFilters, ExerciseSet, QuestionModel, OptionId } from '../types';

export const generateExerciseSet = async (
  userId: string, 
  filters: ExerciseFilters
): Promise<{ id: string; questions: QuestionModel[] }> => {
  // 1. Get student's mastered questions to avoid repetition
  const progressRef = doc(db, 'studentProgress', userId);
  const progressSnap = await getDoc(progressRef);
  const masteredIds: string[] = progressSnap.exists() 
    ? progressSnap.data()?.masteredQuestionIds || []
    : [];
  
  // 2. Build Query
  let constraints = [where('isActive', '==', true)];
  
  if (filters.subjectId && filters.subjectId !== 'all') {
    constraints.push(where('subjectId', '==', filters.subjectId));
  }
  if (filters.topicId && filters.topicId !== 'all') {
    constraints.push(where('topicId', '==', filters.topicId));
  }
  if (filters.difficulty && filters.difficulty !== 'any' as any) {
    constraints.push(where('difficulty', '==', filters.difficulty));
  }
  
  // Note: Firestore doesn't support random access natively easily.
  // For MVP, we fetch more than needed and shuffle client-side.
  // In production, use a dedicated solution like 'random' field.
  const q = query(collection(db, 'questions'), ...constraints);
  const snapshot = await getDocs(q);
  
  let candidates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuestionModel));
  
  // Filter mastered
  candidates = candidates.filter(q => !masteredIds.includes(q.id));
  
  // Shuffle
  const shuffled = candidates.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, filters.count);
  
  if (selected.length === 0) {
    throw new Error("No available questions found for these filters.");
  }

  // Create Exercise Set
  const exerciseSetData: Omit<ExerciseSet, 'id'> = {
    studentId: userId,
    filters,
    questionIds: selected.map(q => q.id),
    currentIndex: 0,
    status: 'in_progress',
    startedAt: serverTimestamp() as any,
    correctCount: 0,
    totalQuestions: selected.length,
    totalTimeSpent: 0
  };
  
  const docRef = await addDoc(collection(db, 'exerciseSets'), exerciseSetData);
  
  return { id: docRef.id, questions: selected };
};

export const getExerciseSet = async (id: string): Promise<ExerciseSet | null> => {
  const snap = await getDoc(doc(db, 'exerciseSets', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ExerciseSet;
};

export const getQuestionsByIds = async (ids: string[]): Promise<QuestionModel[]> => {
  // Firestore "in" query limited to 10. We will fetch individually for simplicity or batch
  // For MVP, we assume small sets (e.g. 10-20). 
  // Optimization: If many questions, implement batched fetching.
  
  const promises = ids.map(id => getDoc(doc(db, 'questions', id)));
  const snaps = await Promise.all(promises);
  return snaps.map(s => ({ id: s.id, ...s.data() } as QuestionModel));
};

export const submitAnswer = async (
  userId: string,
  setId: string,
  questionId: string,
  selectedAnswer: OptionId,
  timeSpent: number,
  isCorrect: boolean
) => {
  // 1. Save response
  await setDoc(doc(db, `exerciseSets/${setId}/responses`, questionId), {
    questionId,
    selectedAnswer,
    isCorrect,
    timeSpent,
    answeredAt: serverTimestamp()
  });

  // 2. Update Exercise Set
  const setRef = doc(db, 'exerciseSets', setId);
  await updateDoc(setRef, {
    currentIndex: increment(1),
    correctCount: increment(isCorrect ? 1 : 0),
    totalTimeSpent: increment(timeSpent)
  });

  // 3. Update Student Progress
  const progressRef = doc(db, 'studentProgress', userId);
  const progressUpdate: any = {
    totalQuestionsAttempted: increment(1),
    totalTimeSpent: increment(timeSpent),
    lastActivityAt: serverTimestamp()
  };

  if (isCorrect) {
    progressUpdate.totalCorrect = increment(1);
    progressUpdate.masteredQuestionIds = arrayUnion(questionId);
  }

  await setDoc(progressRef, progressUpdate, { merge: true });
  
  // 4. Update Question Stats (optional, good for admin)
  const qRef = doc(db, 'questions', questionId);
  await updateDoc(qRef, {
    'stats.totalAttempts': increment(1),
    'stats.totalTimeSpent': increment(timeSpent),
    'stats.correctCount': increment(isCorrect ? 1 : 0)
  });
};

export const completeExercise = async (setId: string) => {
  await updateDoc(doc(db, 'exerciseSets', setId), {
    status: 'completed',
    completedAt: serverTimestamp()
  });
};