'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CheckoutSuccessPage() {
    const router = useRouter();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        // Play success sound
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'); // Cash register sound
        audio.volume = 0.5;
        audio.play().catch(e => console.log('Audio play failed:', e));

        // Fire confetti
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        }

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);

        // Countdown to redirect
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push('/desk');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(interval);
            clearInterval(timer);
        };
    }, [router]);

    return (
        <div className="min-h-screen bg-[#0A0A0C] flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF6154]/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-md w-full bg-[#151518] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
                <div className="mx-auto w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
                <p className="text-gray-400 mb-8">
                    Welcome to the pro league. Your subscription is now active.
                </p>

                <div className="space-y-4">
                    <Link
                        href="/desk"
                        className="block w-full py-4 bg-[#FF6154] hover:bg-[#ff4f40] text-white rounded-xl font-bold transition-all shadow-lg shadow-[#FF6154]/20 hover:scale-[1.02]"
                    >
                        Go to Dashboard
                    </Link>

                    <p className="text-sm text-gray-500">
                        Redirecting in {countdown} seconds...
                    </p>
                </div>
            </div>
        </div>
    );
}
