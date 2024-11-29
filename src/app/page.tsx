import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-8">Welcome to Availability</h1>
        <div className="text-center">
          <Link
            href="/projects"
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            View Projects
          </Link>
        </div>
      </div>
    </main>
  );
}
