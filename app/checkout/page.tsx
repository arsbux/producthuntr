'use client';

import { useState } from 'react';
import { ArrowLeft, CreditCard, Check, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { PaymentForm, CreditCard as SquareCreditCard } from 'react-square-web-payments-sdk';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClientComponentClient();

    const handlePaymentSuccess = async (token: any) => {
        setLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();

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

            // Redirect to success or dashboard
            router.push('/desk/idea-validator?success=true');
        } catch (err) {
            console.error(err);
            setError('Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row font-sans">
            {/* LEFT SIDE - Dark (Order Summary) */}
            <div className="w-full lg:w-1/2 bg-[#1a1a1a] text-white p-8 lg:p-12 flex flex-col relative">
                <div className="absolute top-8 left-8 flex items-center gap-6">
                    <Link href="/pricing" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
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
                        <p className="text-gray-400 text-sm mb-2">Subscribe to Pro Monthly Membership</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold">$29.00</span>
                            <span className="text-gray-400 text-sm">per month</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Item */}
                        <div className="flex justify-between items-start py-4 border-t border-gray-800">
                            <div>
                                <h3 className="font-medium">Pro Monthly Membership</h3>
                                <p className="text-sm text-gray-400 mt-1">Get access to everything in the Pro Tier</p>
                                <p className="text-sm text-gray-400">Billed monthly</p>
                            </div>
                            <span className="font-medium">$29.00</span>
                        </div>

                        {/* Subtotal */}
                        <div className="flex justify-between items-center py-4 border-t border-gray-800">
                            <span className="text-gray-300">Subtotal</span>
                            <span className="font-medium">$29.00</span>
                        </div>

                        {/* Promo Code */}
                        <button className="text-sm text-blue-400 hover:text-blue-300 transition-colors text-left">
                            Add promotion code
                        </button>

                        {/* Total */}
                        <div className="flex justify-between items-center py-6 border-t border-gray-800 mt-4">
                            <span className="text-gray-300 font-medium">Total due today</span>
                            <span className="text-2xl font-bold">$29.00</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE - Light (Payment Form) */}
            <div className="w-full lg:w-1/2 bg-white p-8 lg:p-12 flex flex-col">
                <div className="max-w-md mx-auto w-full mt-8 lg:mt-16">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Details</h2>
                        <p className="text-gray-600 text-sm">Complete your subscription to unlock full access.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
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
                                <SquareCreditCard
                                    buttonProps={{
                                        css: {
                                            backgroundColor: '#000000',
                                            fontSize: '16px',
                                            color: '#fff',
                                            '&:hover': {
                                                backgroundColor: '#333333',
                                            },
                                            padding: '16px',
                                            borderRadius: '8px',
                                            fontWeight: '600',
                                        },
                                    }}
                                />
                            </PaymentForm>
                        ) : (
                            <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                                <p className="text-sm text-gray-500 mb-2 font-medium">Square Setup Required</p>
                                <p className="text-xs text-gray-400 mb-4">
                                    The payment form cannot load because the Square credentials are invalid or missing in .env.local
                                </p>

                                <button
                                    onClick={() => handlePaymentSuccess({ token: 'mock-token' })}
                                    className="w-full px-4 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    [DEV] Simulate Successful Payment
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="text-center text-xs text-gray-500 mt-8 space-y-2">
                        <p>By subscribing, you authorize ProductHuntr to charge you according to the terms until you cancel.</p>
                        <div className="flex justify-center gap-4">
                            <span>Powered by <span className="font-bold">Square</span></span>
                            <a href="#" className="hover:underline">Terms</a>
                            <a href="#" className="hover:underline">Privacy</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
