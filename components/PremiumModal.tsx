'use client';

import { useRouter } from 'next/navigation';
import { Check, Sparkles, X, ArrowRight } from 'lucide-react';

interface PremiumModalProps {
    isOpen: boolean;
    onClose?: () => void;
    user: any; // Supabase user object
}

export default function PremiumModal({ isOpen, onClose, user }: PremiumModalProps) {
    const router = useRouter();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative animate-in zoom-in-95 duration-200">
                {/* Close Button */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-20"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}

                {/* Header */}
                <div className="bg-black p-8 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-gray-800 to-black opacity-50"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-500/20">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold mb-3 tracking-tight">Unlock Growth Intelligence</h2>
                        <p className="text-gray-300 text-sm leading-relaxed max-w-xs mx-auto">
                            We apologize for the gate, but this feature uses advanced AI to process millions of data points for precise market analysis. To sustain these high-compute costs, we require a pro subscription.
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 bg-white dark:bg-zinc-900">
                    {/* Features */}
                    <div className="space-y-4 mb-8">
                        {[
                            'Unlimited AI Market Analysis',
                            'Deep Dive Niche Reports',
                            'Competitor Intelligence',
                            'Growth Strategy Generator'
                        ].map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                                    <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                </div>
                                <span className="font-medium">{feature}</span>
                            </div>
                        ))}
                    </div>

                    {/* Pricing */}
                    <div className="text-center mb-8 p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-100 dark:border-zinc-800">
                        <div className="flex items-baseline justify-center gap-1">
                            <span className="text-4xl font-bold text-gray-900 dark:text-white">$29</span>
                            <span className="text-gray-500 dark:text-gray-400">/month</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Cancel anytime. Secure payment via Stripe.</p>
                    </div>

                    {/* Actions */}
                    {!user ? (
                        <div className="space-y-3">
                            <button
                                onClick={() => router.push('/login?redirect=/desk/idea-validator')}
                                className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-gray-200 dark:shadow-none"
                            >
                                Log in to Subscribe
                            </button>
                            <p className="text-xs text-center text-gray-500">
                                You need an account to manage your subscription.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <button
                                onClick={() => router.push('/checkout')}
                                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-blue-200/50 flex items-center justify-center gap-2"
                            >
                                <span>Continue to Checkout</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                            <p className="text-xs text-center text-gray-500">
                                Secure checkout powered by Stripe
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
