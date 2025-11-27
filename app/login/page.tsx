'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/desk');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF5F0]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
    </div>
  );
}
