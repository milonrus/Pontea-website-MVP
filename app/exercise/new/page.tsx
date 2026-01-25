"use client";

import NewExercisePage from '../../../views/student/NewExercisePage';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';

const Page = () => {
  return (
    <ProtectedRoute>
      <NewExercisePage />
    </ProtectedRoute>
  );
};

export default Page;
