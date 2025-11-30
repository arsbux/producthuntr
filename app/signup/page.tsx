'use client';

import { useState, Suspense } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import Image from 'next/image';

function SignupForm() {
    const searchParams = useSearchParams();
    const [email, setEmail] = useState(searchParams.get('email') || '');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(searchParams.get('success') === 'true');
    const redirect = searchParams.get('redirect') || '/desk';
    const supabase = createClientComponentClient();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirect}`,
                },
            });

            if (error) throw error;

            setSuccess(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="w-full max-w-md p-8 bg-[#0A0A0C] rounded-2xl border border-white/10 shadow-2xl text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-[#FF6154]/20 mb-6">
                    <Sparkles className="h-8 w-8 text-[#FF6154]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Check your email</h3>
                <p className="text-gray-400 mb-8">
                    We've sent a confirmation link to <strong className="text-white">{email}</strong>. Please check your inbox to complete your registration.
                </p>
                <Link href="/login" className="text-[#FF6154] font-semibold hover:text-[#ff4f40] flex items-center justify-center gap-2 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to login
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md space-y-8 p-8 bg-[#0A0A0C] rounded-2xl border border-white/10 shadow-2xl">
            <div className="text-center">
                <div className="mx-auto w-12 h-12 relative mb-6">
                    <Image src="/logo.png" alt="ProductHuntr" fill className="object-contain" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-white">
                    Create your account
                </h2>
                <p className="mt-2 text-sm text-gray-400">
                    Join thousands of entrepreneurs discovering their next big idea.
                </p>
            </div>

            <form className="space-y-6" onSubmit={handleSignup}>
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        {error}
                    </div>
                )}

                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                        Email
                    </label>
                    <div className="mt-1">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full appearance-none rounded-lg bg-[#151518] border border-white/10 px-3 py-2 text-white placeholder-gray-500 shadow-sm focus:border-[#FF6154] focus:outline-none focus:ring-1 focus:ring-[#FF6154] sm:text-sm transition-colors"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                        Password
                    </label>
                    <div className="mt-1">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            minLength={6}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full appearance-none rounded-lg bg-[#151518] border border-white/10 px-3 py-2 text-white placeholder-gray-500 shadow-sm focus:border-[#FF6154] focus:outline-none focus:ring-1 focus:ring-[#FF6154] sm:text-sm transition-colors"
                        />
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full justify-center rounded-lg border border-transparent bg-[#FF6154] py-2.5 px-4 text-sm font-bold text-white shadow-lg shadow-[#FF6154]/20 hover:bg-[#ff4f40] focus:outline-none focus:ring-2 focus:ring-[#FF6154] focus:ring-offset-2 focus:ring-offset-[#0A0A0C] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02]"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </div>
            </form>

            <div className="text-center border-t border-white/10 pt-6">
                <p className="text-sm text-gray-400">
                    Already have an account?{' '}
                    <Link href={`/login?redirect=${redirect}`} className="font-medium text-white hover:text-[#FF6154] transition-colors">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default function SignupPage() {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#FF6154]/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="absolute top-8 left-8">
                <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>
            </div>

            <Suspense fallback={<div className="flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#FF6154]" /></div>}>
                <SignupForm />
            </Suspense>
        </div>
    );
}
