"use client";

import { useSearchParams } from 'next/navigation';
import TestSessionPage from '@/views/student/TestSessionPage';
import TimedTestPage from '@/views/student/TimedTestPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const Page = () => {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  // Use TimedTestPage for timed exams, TestSessionPage for practice mode
  const isTimedMode = mode === 'timed';

  return (
    <ProtectedRoute>
      {isTimedMode ? <TimedTestPage /> : <TestSessionPage />}
    </ProtectedRoute>
  );
};

export default Page;
