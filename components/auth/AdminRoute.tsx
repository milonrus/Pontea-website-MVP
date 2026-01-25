"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { currentUser, userProfile, loading, profileLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || (currentUser && profileLoading)) {
      return;
    }
    if (!currentUser) {
      router.replace('/auth');
      return;
    }
    if (userProfile?.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [currentUser, userProfile, loading, profileLoading, router]);

  if (loading || (currentUser && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  if (userProfile?.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
};

export default AdminRoute;
