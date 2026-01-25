"use client";

import AuthPage from '../../views/AuthPage';
import PublicRoute from '../../components/auth/PublicRoute';

const Page = () => {
  return (
    <PublicRoute>
      <AuthPage />
    </PublicRoute>
  );
};

export default Page;
