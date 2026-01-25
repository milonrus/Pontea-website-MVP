"use client";

import ExerciseResultsPage from '../../../../views/student/ExerciseResultsPage';
import ProtectedRoute from '../../../../components/auth/ProtectedRoute';

const Page = () => {
  return (
    <ProtectedRoute>
      <ExerciseResultsPage />
    </ProtectedRoute>
  );
};

export default Page;
