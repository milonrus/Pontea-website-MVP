"use client";

import type { ReactNode } from 'react';
import ScrollToTop from '@/components/shared/ScrollToTop';
import LanguagePreferenceSync from '@/components/shared/LanguagePreferenceSync';

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <ScrollToTop />
      <LanguagePreferenceSync />
      {children}
    </>
  );
};

export default Providers;
