import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import './globals.css';
import Providers from './providers';
import { getRequiredPublicEnv } from '@/lib/env/public';

export const metadata: Metadata = {
  metadataBase: new URL(getRequiredPublicEnv('NEXT_PUBLIC_APP_URL')),
  title: {
    default: 'PONTEA School | Architecture Exam Prep',
    template: '%s | PONTEA School'
  },
  description:
    'Online ARCHED and TIL-A preparation with diagnostics, structured study plans, and mentor support.',
  applicationName: 'PONTEA School',
  openGraph: {
    type: 'website',
    siteName: 'PONTEA School',
    title: 'PONTEA School | Architecture Exam Prep',
    description:
      'Online ARCHED and TIL-A preparation with diagnostics, structured study plans, and mentor support.',
    url: '/',
    images: [{ url: '/pontea-logo.webp' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PONTEA School | Architecture Exam Prep',
    description:
      'Online ARCHED and TIL-A preparation with diagnostics, structured study plans, and mentor support.',
    images: ['/pontea-logo.webp']
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1
};

const RootLayout = async ({ children }: { children: ReactNode }) => {
  const requestHeaders = await headers();
  const localeHeader = requestHeaders.get('x-site-locale');
  const htmlLang = localeHeader === 'ru' ? 'ru' : 'en';

  return (
    <html lang={htmlLang}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Mulish:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
          integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
};

export default RootLayout;
