'use client';

import { usePathname } from 'next/navigation';

export function PathDetails() {
  const pathname = usePathname();
  
  if (!pathname) return null;
  
  return (
    <div className="mt-4 text-center text-sm text-gray-500">
      Requested path: <code className="rounded bg-gray-100 px-2 py-1">{pathname}</code>
    </div>
  );
}
