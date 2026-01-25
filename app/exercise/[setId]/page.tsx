"use client";

import ExerciseSessionPage from '../../../views/student/ExerciseSessionPage';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';

const Page = () => {
  return (
    <ProtectedRoute>
      <ExerciseSessionPage />
    </ProtectedRoute>
  );
};

export default Page;
