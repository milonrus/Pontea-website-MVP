"use client";

import type { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import ScrollToTop from '@/components/shared/ScrollToTop';
import LanguagePreferenceSync from '@/components/shared/LanguagePreferenceSync';

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      <ScrollToTop />
      <LanguagePreferenceSync />
      {children}
    </AuthProvider>
  );
};

export default Providers;
