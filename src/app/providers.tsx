"use client";

import type { ReactNode } from 'react';
import ScrollToTop from '@/components/shared/ScrollToTop';

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <ScrollToTop />
      {children}
    </>
  );
};

export default Providers;
