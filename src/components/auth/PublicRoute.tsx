"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && currentUser) {
      router.replace('/dashboard');
    }
  }, [loading, currentUser, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (currentUser) {
    return null;
  }

  return <>{children}</>;
};

export default PublicRoute;
