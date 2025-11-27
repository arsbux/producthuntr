'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import Link from 'next/link';
import { Loader2, ArrowRight, Mail, Lock, CheckCircle2 } from 'lucide-react';

export default function SuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const receiptId = searchParams.get('receipt_id');

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/signup-from-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, receiptId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Signup failed');
            }

            // CRITICAL: Use window.location for hard redirect to establish session
            window.location.href = '/desk';
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/20 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-md w-full relative z-10">
                {/* Success Icon */}
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                    <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-20"></div>
                    <CheckCircle2 className="w-10 h-10 text-green-500 relative z-10" />
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2 tracking-tight">
                        Payment Successful! 🎉
                    </h1>
                    <p className="text-neutral-400">
                        Create your account to access Product Huntr Pro
                    </p>
                </div>

                {/* Signup Form */}
                <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl p-8 shadow-2xl">

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all"
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">Minimum 6 characters</p>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg text-sm bg-red-500/10 text-red-400 border border-red-500/20">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3.5 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-green-900/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Create Account & Continue <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-neutral-800">
                        <p className="text-center text-sm text-neutral-400">
                            Already have an account?{' '}
                            <Link href="/login" className="text-green-500 hover:text-green-400 font-medium transition-colors">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-center text-xs text-neutral-500 mt-6">
                    By creating an account, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
}
