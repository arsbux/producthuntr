
'use client';

import { useState } from 'react';
import { ArrowLeft, Check, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClientComponentClient();

    const handleSubscribe = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (!user || userError) {
                setError('You must be logged in to complete registration.');
                return;
            }

            // Call API to create Polar checkout
            const response = await fetch('/api/subscription/polar/create-checkout', {
                method: 'POST',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to initialize checkout');
            }

            // Redirect to Polar
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL received');
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Something went wrong. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row font-sans">
            {/* LEFT SIDE - Dark (Welcome) */}
            <div className="w-full lg:w-1/2 bg-[#1a1a1a] text-white p-8 lg:p-12 flex flex-col relative">
                <div className="absolute top-8 left-8 flex items-center gap-6">
                    <Link href="/" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Back</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <img src="/Favicon.png" alt="ProductHuntr" className="w-6 h-6 rounded" />
                        <span className="font-bold text-lg">ProductHuntr</span>
                    </div>
                </div>

                <div className="mt-16 lg:mt-24 max-w-md mx-auto w-full flex-1">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-4">Welcome to ProductHuntr</h1>
                        <p className="text-gray-400 text-lg">
                            Join thousands of makers analyzing trends and finding their next big opportunity.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4 py-4 border-t border-gray-800">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                                <Zap className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-medium">Instant Access</h3>
                                <p className="text-sm text-gray-400">Start analyzing trends immediately</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 py-4 border-t border-gray-800">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-medium">Pro Features Included</h3>
                                <p className="text-sm text-gray-400">Full access to all analytics tools</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE - Light (Action) */}
            <div className="w-full lg:w-1/2 bg-white p-8 lg:p-12 flex flex-col justify-center items-center">
                <div className="max-w-md mx-auto w-full">
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Subscription</h2>
                        <p className="text-gray-600 text-sm">You will be redirected to a secure checkout page.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleSubscribe}
                        disabled={loading}
                        className="w-full py-4 bg-[#FF6154] hover:bg-[#ff4f40] text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Redirecting...
                            </>
                        ) : (
                            <>
                                Proceed to Checkout
                                <Sparkles className="w-5 h-5" />
                            </>
                        )}
                    </button>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        By continuing, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>
        </div>
    );
}

