"use client";

import type { ReactNode } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import ScrollToTop from '../components/shared/ScrollToTop';

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <AuthProvider>
      <ScrollToTop />
      {children}
    </AuthProvider>
  );
};

export default Providers;
