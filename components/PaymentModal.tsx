'use client';

import { useState } from 'react';
import { CreditCard, PaymentForm } from 'react-square-web-payments-sdk';
import { Loader2, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PaymentModalProps {
    plan: string;
    amount: number;
    onClose: () => void;
}

export default function PaymentModal({ plan, amount, onClose }: PaymentModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID;
    const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;

    if (!appId || !locationId) {
        return <div className="text-red-500">Missing Square Configuration</div>;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1A1A1E] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Secure Payment</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>

                <div className="p-6">
                    <div className="mb-6">
                        <p className="text-gray-400 text-sm mb-1">Total due today</p>
                        <p className="text-3xl font-bold text-white">${amount}</p>
                        <p className="text-sm text-gray-500 mt-1">{plan === 'analytics' ? 'Analytics Plan' : 'Analytics + AI Plan'}</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <PaymentForm
                        applicationId={appId}
                        locationId={locationId}
                        cardTokenizeResponseReceived={async (tokenResult, verifiedBuyer) => {
                            if (tokenResult.status !== 'OK') {
                                setError((tokenResult as any).errors?.[0]?.message || 'Payment failed');
                                return;
                            }

                            setLoading(true);
                            setError(null);
                            try {
                                const response = await fetch('/api/pay', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        sourceId: tokenResult.token,
                                        plan,
                                    }),
                                });

                                const data = await response.json();

                                if (response.ok) {
                                    router.push('/desk');
                                } else {
                                    setError(data.error || 'Payment failed');
                                }
                            } catch (e) {
                                setError('An unexpected error occurred');
                            } finally {
                                setLoading(false);
                            }
                        }}
                    >
                        <CreditCard
                            buttonProps={{
                                css: {
                                    backgroundColor: '#FF6154',
                                    fontSize: '16px',
                                    color: '#fff',
                                    '&:hover': {
                                        backgroundColor: '#ff4f40',
                                    },
                                },
                            }}
                            style={{
                                input: {
                                    fontSize: '16px',
                                    color: '#fff',
                                },
                                'input::placeholder': {
                                    color: '#6b7280',
                                },
                            }}
                        />
                    </PaymentForm>

                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                        <Lock className="w-3 h-3" />
                        <span>Payments secured by Square</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
