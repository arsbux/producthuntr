'use client';

import { useState } from 'react';
import { PaymentForm, CreditCard } from 'react-square-web-payments-sdk';
import { Check, Sparkles, Lock, X } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

interface PremiumModalProps {
    isOpen: boolean;
    onClose?: () => void;
    user: any; // Supabase user object
}

export default function PremiumModal({ isOpen, onClose, user }: PremiumModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClientComponentClient();

    if (!isOpen) return null;

    const handlePaymentSuccess = async (token: any) => {
        setLoading(true);
        setError(null);
        try {
            // Call your backend to process the payment
            const response = await fetch('/api/subscription/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sourceId: token.token,
                    userId: user?.id,
                    email: user?.email,
                }),
            });

            if (!response.ok) {
                throw new Error('Payment processing failed');
            }

            // Refresh page or redirect
            window.location.reload();
        } catch (err) {
            console.error(err);
            setError('Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative animate-in zoom-in-95 duration-200">
                {/* Close Button (Optional) */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}

                {/* Header */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-white/30">
                            <Sparkles className="w-6 h-6 text-yellow-300" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Unlock Growth Intelligence</h2>
                        <p className="text-blue-100 text-sm">
                            Advanced AI analysis for serious market researchers
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8">
                    {/* Features */}
                    <div className="space-y-3 mb-8">
                        {[
                            'Unlimited AI Market Analysis',
                            'Deep Dive Niche Reports',
                            'Competitor Intelligence',
                            'Growth Strategy Generator'
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                    <Check className="w-3 h-3 text-green-600" />
                                </div>
                                {feature}
                            </div>
                        ))}
                    </div>

                    {/* Pricing */}
                    <div className="text-center mb-8">
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-4xl font-bold text-gray-900">$29</span>
                            <span className="text-gray-500">/month</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Cancel anytime. Secure payment via Square.</p>
                    </div>

                    {/* Auth Check */}
                    {!user ? (
                        <div className="space-y-3">
                            <button
                                onClick={() => router.push('/login?redirect=/desk/idea-validator')}
                                className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-gray-200"
                            >
                                Log in to Subscribe
                            </button>
                            <p className="text-xs text-center text-gray-500">
                                You need an account to manage your subscription.
                            </p>
                        </div>
                    ) : (
                        /* Payment Form */
                        <div className="relative">
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100">
                                    {error}
                                </div>
                            )}

                            {/* Square Payment Form */}
                            <div className="min-h-[100px]">
                                {process.env.NEXT_PUBLIC_SQUARE_APP_ID &&
                                    process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID &&
                                    !process.env.NEXT_PUBLIC_SQUARE_APP_ID.includes('YOUR_APP_ID') ? (
                                    <PaymentForm
                                        applicationId={process.env.NEXT_PUBLIC_SQUARE_APP_ID}
                                        locationId={process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID}
                                        cardTokenizeResponseReceived={async (token, verifiedBuyer) => {
                                            await handlePaymentSuccess(token);
                                        }}
                                    >
                                        <CreditCard
                                            buttonProps={{
                                                css: {
                                                    backgroundColor: '#2563eb',
                                                    fontSize: '14px',
                                                    color: '#fff',
                                                    '&:hover': {
                                                        backgroundColor: '#1d4ed8',
                                                    },
                                                },
                                            }}
                                        />
                                    </PaymentForm>
                                ) : (
                                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                                        <p className="text-sm text-gray-500 mb-2 font-medium">Square Setup Required</p>
                                        <p className="text-xs text-gray-400 mb-2">
                                            The payment form cannot load because the Square credentials are invalid or missing.
                                        </p>
                                        <div className="text-xs text-left bg-gray-100 p-2 rounded border border-gray-200 font-mono overflow-x-auto">
                                            NEXT_PUBLIC_SQUARE_APP_ID=...<br />
                                            NEXT_PUBLIC_SQUARE_LOCATION_ID=...
                                        </div>

                                        <button
                                            onClick={() => handlePaymentSuccess({ token: 'mock-token' })}
                                            className="mt-4 w-full px-4 py-2 bg-gray-800 text-white text-xs font-medium rounded hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Sparkles className="w-3 h-3" />
                                            [DEV] Simulate Successful Payment
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
