'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/desk');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FFF5F0] dark:bg-hunted-dark">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
    );
}
