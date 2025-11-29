'use client';

import { useState } from 'react';
import { Sparkles, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GenerateAuditButton({ launchId, hasAudit }: { launchId: string, hasAudit: boolean }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleGenerate = async () => {
        setLoading(true);
        try {
            // For MVP: Direct free generation
            // Future: Check for subscription/payment here
            const res = await fetch(`/api/launch/${launchId}/audit`, {
                method: 'POST',
            });

            if (!res.ok) throw new Error('Failed to generate audit');

            router.refresh(); // Refresh server component to show new data
        } catch (error) {
            console.error(error);
            alert('Failed to generate audit. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-[#FF6154] hover:bg-[#ff4f40] text-white font-bold py-2 px-6 rounded-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
        >
            {loading ? (
                <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    Analyzing...
                </>
            ) : (
                <>
                    {hasAudit ? 'Regenerate Analysis' : 'Run Growth Analysis'}
                    <Sparkles className="w-4 h-4" />
                </>
            )}
        </button>
    );
}
