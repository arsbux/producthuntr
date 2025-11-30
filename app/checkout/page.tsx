'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { CreditCard, PaymentForm } from 'react-square-web-payments-sdk';
import { Loader2, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const plan = searchParams.get('plan') || 'analytics';
    const supabase = createClientComponentClient();

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID;
    const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push(`/login?returnUrl=/checkout?plan=${plan}`);
                return;
            }
            setUser(session.user);
            setLoading(false);
        };
        checkAuth();
    }, [supabase, router, plan]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#FF6154] animate-spin" />
            </div>
        );
    }

    if (!appId || !locationId) {
        return <div className="min-h-screen bg-[#0A0A0C] text-white flex items-center justify-center">Missing Square Configuration</div>;
    }

    const planDetails = {
        analytics: {
            name: 'Analytics Plan',
            price: 25,
            features: ['Keyword analysis', 'Product & Category tracking', 'Trend alerts', '2-year history']
        },
        analytics_ai: {
            name: 'Analytics + AI Plan',
            price: 39,
            features: ['Everything in Analytics', 'AI-Powered data analysis', 'Predictive Momentum', 'Deep Dive Reports']
        }
    }[plan as 'analytics' | 'analytics_ai'] || {
        name: 'Unknown Plan',
        price: 0,
        features: []
    };

    return (
        <div className="min-h-screen bg-[#0A0A0C] text-white font-sans flex flex-col">
            <Navbar />

            <main className="flex-1 pt-32 pb-20 px-6">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 lg:gap-20">
                    {/* Left Column: Order Summary */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-4">Complete your purchase</h1>
                            <p className="text-gray-400">Unlock professional analytics tools instantly.</p>
                        </div>

                        <div className="bg-[#151518] border border-white/5 rounded-2xl p-6 md:p-8">
                            <div className="flex justify-between items-start mb-6 pb-6 border-b border-white/5">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">{planDetails.name}</h3>
                                    <p className="text-sm text-gray-500">Monthly subscription</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-white">${planDetails.price}</p>
                                    <p className="text-sm text-gray-500">/mo</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                {planDetails.features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-3 text-gray-300">
                                        <CheckCircle2 className="w-5 h-5 text-[#FF6154]" />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center pt-6 border-t border-white/5">
                                <span className="text-lg font-medium">Total due today</span>
                                <span className="text-3xl font-bold text-[#FF6154]">${planDetails.price}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500 bg-[#151518]/50 p-4 rounded-xl border border-white/5">
                            <ShieldCheck className="w-5 h-5 text-gray-400" />
                            <p>Your payment information is encrypted and secure. We never store your credit card details.</p>
                        </div>
                    </div>

                    {/* Right Column: Payment Form */}
                    <div className="bg-[#1A1A1E] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl h-fit">
                        <h2 className="text-xl font-bold mb-6">Payment Details</h2>

                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-3">
                                <div className="mt-0.5">⚠️</div>
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="square-payment-form-wrapper">
                            <PaymentForm
                                applicationId={appId}
                                locationId={locationId}
                                createVerificationDetails={() => ({
                                    amount: planDetails.price.toString(),
                                    currencyCode: 'USD',
                                    intent: 'CHARGE',
                                    billingContact: {
                                        givenName: user?.email?.split('@')[0] || 'Customer',
                                        email: user?.email || '',
                                    },
                                })}
                                cardTokenizeResponseReceived={async (tokenResult, verifiedBuyer) => {
                                    if (tokenResult.status !== 'OK') {
                                        setError((tokenResult as any).errors?.[0]?.message || 'Payment failed');
                                        return;
                                    }

                                    setProcessing(true);
                                    setError(null);
                                    try {
                                        const payload: any = {
                                            sourceId: tokenResult.token,
                                            plan,
                                        };

                                        // Include verification token if buyer was verified
                                        if (verifiedBuyer?.token) {
                                            payload.verificationToken = verifiedBuyer.token;
                                        }

                                        const response = await fetch('/api/pay', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify(payload),
                                        });

                                        const data = await response.json();

                                        if (response.ok) {
                                            router.push('/checkout/success');
                                        } else {
                                            setError(data.error || 'Payment failed');
                                        }
                                    } catch (e) {
                                        setError('An unexpected error occurred. Please try again.');
                                    } finally {
                                        setProcessing(false);
                                    }
                                }}
                            >
                                <CreditCard
                                    buttonProps={{
                                        css: {
                                            backgroundColor: processing ? '#333' : '#FF6154',
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            color: '#fff',
                                            borderRadius: '12px',
                                            height: '56px',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                backgroundColor: processing ? '#333' : '#ff4f40',
                                                transform: processing ? 'none' : 'translateY(-1px)',
                                                boxShadow: processing ? 'none' : '0 4px 12px rgba(255, 97, 84, 0.2)',
                                            },
                                        },
                                    }}
                                    style={{
                                        input: {
                                            fontSize: '16px',
                                            color: '#fff',
                                            backgroundColor: '#0A0A0C',
                                        },
                                        'input::placeholder': {
                                            color: '#6b7280',
                                        },
                                        '.message-text': {
                                            color: '#e5e7eb',
                                        },
                                        '.message-icon': {
                                            color: '#e5e7eb',
                                        },
                                    }}
                                >
                                    {processing ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Processing Payment...</span>
                                        </div>
                                    ) : (
                                        `Pay $${planDetails.price}`
                                    )}
                                </CreditCard>
                            </PaymentForm>
                        </div>

                        <div className="mt-6 flex flex-col items-center justify-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                                <Lock className="w-3 h-3" />
                                <span>Payments secured by Square</span>
                            </div>
                            <div className="text-center">
                                <p>Having trouble checking out?</p>
                                <a
                                    href="https://calendly.com/keithkatale1/discovery-call"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#FF6154] hover:text-white transition-colors border-b border-[#FF6154] hover:border-white pb-0.5 inline-block mt-1"
                                >
                                    Book a call here
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#FF6154] animate-spin" /></div>}>
            <CheckoutContent />
        </Suspense>
    );
}
