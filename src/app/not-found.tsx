import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: {
    index: false,
    follow: false
  }
};

const NotFound = () => {
  return (
    <main className="min-h-screen bg-white px-4 py-24 text-center">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">404</p>
        <h1 className="mt-3 text-4xl font-bold text-primary">Page not found</h1>
        <p className="mt-4 text-lg text-gray-600">
          The page you requested does not exist or has been moved.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/ru/"
            className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            На главную
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-primary/20 px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            Go to English home
          </Link>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
