"use client";

import LandingPage from '@/views/LandingPage';
import PublicRoute from '@/components/auth/PublicRoute';

const Page = () => {
  return (
    <PublicRoute>
      <LandingPage />
    </PublicRoute>
  );
};

export default Page;
