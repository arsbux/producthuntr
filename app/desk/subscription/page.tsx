'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';
import Link from 'next/link';
import {
    CreditCard,
    Calendar,
    CheckCircle2,
    XCircle,
    ExternalLink,
    Loader2,
    AlertCircle
} from 'lucide-react';

interface SubscriptionData {
    status: string;
    whop_membership_id: string;
    subscription_created_at: string;
    subscription_expires_at: string | null;
    last_payment_at: string | null;
}

export default function SubscriptionPage() {
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        loadSubscription();
    }, []);

    async function loadSubscription() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            setUser(session.user);

            const { data, error } = await supabase
                .from('users')
                .select('subscription_status, whop_membership_id, subscription_created_at, subscription_expires_at, last_payment_at')
                .eq('id', session.user.id)
                .single();

            if (data) {
                setSubscription({
                    status: data.subscription_status,
                    whop_membership_id: data.whop_membership_id,
                    subscription_created_at: data.subscription_created_at,
                    subscription_expires_at: data.subscription_expires_at,
                    last_payment_at: data.last_payment_at,
                });
            }
        } catch (error) {
            console.error('Error loading subscription:', error);
        } finally {
            setLoading(false);
        }
    }

    const getStatusDisplay = () => {
        if (!subscription) return { icon: XCircle, text: 'No Subscription', color: 'text-neutral-500' };

        switch (subscription.status) {
            case 'active':
                return { icon: CheckCircle2, text: 'Active', color: 'text-green-500' };
            case 'trialing':
                return { icon: CheckCircle2, text: 'Trial', color: 'text-blue-500' };
            case 'past_due':
                return { icon: AlertCircle, text: 'Past Due', color: 'text-yellow-500' };
            case 'canceled':
                return { icon: XCircle, text: 'Canceled', color: 'text-red-500' };
            default:
                return { icon: XCircle, text: 'Inactive', color: 'text-neutral-500' };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
            </div>
        );
    }

    const statusDisplay = getStatusDisplay();
    const StatusIcon = statusDisplay.icon;

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="max-w-4xl mx-auto p-6 sm:p-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/desk" className="text-sm text-neutral-600 hover:text-neutral-900 mb-4 inline-block">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-neutral-900">Subscription</h1>
                    <p className="text-neutral-600 mt-2">Manage your Product Huntr subscription</p>
                </div>

                {/* Subscription Status Card */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-neutral-900 mb-2">Pro Plan</h2>
                            <div className="flex items-center gap-2">
                                <StatusIcon className={`w-5 h-5 ${statusDisplay.color}`} />
                                <span className={`font-semibold ${statusDisplay.color}`}>{statusDisplay.text}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-neutral-900">$15</div>
                            <div className="text-sm text-neutral-500">per month</div>
                        </div>
                    </div>

                    {subscription && subscription.status === 'active' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-neutral-50 rounded-lg mb-6">
                            <div>
                                <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Started</div>
                                <div className="font-semibold text-neutral-900">
                                    {subscription.subscription_created_at
                                        ? new Date(subscription.subscription_created_at).toLocaleDateString()
                                        : 'N/A'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Last Payment</div>
                                <div className="font-semibold text-neutral-900">
                                    {subscription.last_payment_at
                                        ? new Date(subscription.last_payment_at).toLocaleDateString()
                                        : 'N/A'}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Next Billing</div>
                                <div className="font-semibold text-neutral-900">
                                    {subscription.subscription_expires_at
                                        ? new Date(subscription.subscription_expires_at).toLocaleDateString()
                                        : 'Monthly'}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Manage Subscription Button */}
                    <a
                        href="https://whop.com/hub/memberships"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-lg font-semibold hover:bg-neutral-800 transition-all"
                    >
                        <CreditCard className="w-4 h-4" />
                        Manage Subscription
                        <ExternalLink className="w-4 h-4" />
                    </a>

                    <p className="text-sm text-neutral-500 mt-4">
                        Manage your subscription, update payment method, or cancel anytime on Whop.
                    </p>
                </div>

                {/* What's Included */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                    <h3 className="text-lg font-bold text-neutral-900 mb-4">What's Included</h3>
                    <ul className="space-y-3">
                        {[
                            'Real-time trend velocity tracking',
                            'Blue Ocean market gap analysis',
                            'AI-powered idea validation',
                            'Access to 50,000+ launch analytics',
                            'Competitor intelligence reports',
                            'Niche success probability scores',
                            'Priority support',
                        ].map((feature, i) => (
                            <li key={i} className="flex items-center gap-3 text-neutral-700">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Need Help */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-blue-900 mb-1">Need Help?</h4>
                            <p className="text-sm text-blue-800">
                                If you have any questions about your subscription or billing, contact us at{' '}
                                <a href="mailto:support@producthuntr.com" className="underline font-semibold">
                                    support@producthuntr.com
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
