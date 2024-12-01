import { Suspense } from 'react';
import Link from 'next/link';
import { PathDetails } from '@/components/not-found/path-details';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div>
        <h1 className="text-4xl font-bold">404</h1>
        <h2 className="mt-4 text-xl">Page Not Found</h2>
        <p className="mt-2 text-gray-600">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="mt-6 block rounded-md bg-primary px-4 py-2 text-center text-white hover:bg-primary/90"
        >
          Go Home
        </Link>
      </div>
      <Suspense fallback={null}>
        <PathDetails />
      </Suspense>
    </div>
  );
}
