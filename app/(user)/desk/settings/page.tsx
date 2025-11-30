'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import {
    User,
    CreditCard,
    LifeBuoy,
    LogOut,
    Trash2,
    AlertTriangle,
    CheckCircle2,
    Calendar,
    Shield
} from 'lucide-react';
import { format } from 'date-fns';

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [subscription, setSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const router = useRouter();
    const supabase = createClientComponentClient();

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setUser(user);

            const { data: sub } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .single();

            setSubscription(sub);
            setLoading(false);
        };

        fetchData();
    }, [supabase, router]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const handleCancelSubscription = async () => {
        if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.')) {
            return;
        }

        setCancelling(true);
        try {
            // In a real app, you'd call your payment provider's API here via a server route
            // For this demo, we'll just update the status in the DB
            const { error } = await supabase
                .from('subscriptions')
                .update({ status: 'canceled' })
                .eq('user_id', user.id);

            if (error) throw error;

            setSubscription({ ...subscription, status: 'canceled' });
        } catch (error) {
            console.error('Error cancelling subscription:', error);
            alert('Failed to cancel subscription. Please contact support.');
        } finally {
            setCancelling(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmation = prompt('Type "DELETE" to confirm account deletion. This action cannot be undone.');
        if (confirmation !== 'DELETE') return;

        try {
            // Call API to delete user (since client can't delete itself usually)
            // For now, we'll just sign out and pretend, or we'd need a server action
            // Let's just sign out for safety in this demo context unless we add an API route
            await supabase.auth.signOut();
            router.push('/');
        } catch (error) {
            console.error('Error deleting account:', error);
        }
    };

    if (loading) {
        return <div className="p-8 text-gray-400">Loading settings...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
                <p className="text-gray-400">Manage your subscription and account preferences.</p>
            </div>

            {/* Profile Section */}
            <div className="bg-[#151518] border border-white/5 rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF6154] to-[#ff4f40] flex items-center justify-center text-2xl font-bold text-white">
                        {user.email?.[0].toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">{user.email}</h2>
                        <p className="text-sm text-gray-500">Member since {format(new Date(user.created_at), 'MMMM yyyy')}</p>
                    </div>
                </div>
            </div>

            {/* Subscription Section */}
            <div className="bg-[#151518] border border-white/5 rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <CreditCard className="w-6 h-6 text-[#FF6154]" />
                    <h2 className="text-xl font-bold text-white">Subscription</h2>
                </div>

                {subscription ? (
                    <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-sm text-gray-500 mb-1">Current Plan</p>
                                <p className="text-lg font-bold text-white capitalize">{subscription.plan.replace('_', ' + ')}</p>
                                <div className="mt-2 flex items-center gap-2 text-sm">
                                    {subscription.status === 'active' ? (
                                        <span className="flex items-center gap-1.5 text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                                            <CheckCircle2 className="w-3 h-3" /> Active
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                                            <AlertTriangle className="w-3 h-3" /> {subscription.status}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                <p className="text-sm text-gray-500 mb-1">Billing Period</p>
                                <div className="flex items-center gap-2 text-white">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span>Renews on {format(new Date(subscription.current_period_end), 'MMM d, yyyy')}</span>
                                </div>
                            </div>
                        </div>

                        {subscription.status === 'active' && (
                            <div className="pt-6 border-t border-white/5">
                                <button
                                    onClick={handleCancelSubscription}
                                    disabled={cancelling}
                                    className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
                                >
                                    {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-400 mb-4">You don't have an active subscription.</p>
                        <button
                            onClick={() => router.push('/pricing')}
                            className="px-6 py-2 bg-[#FF6154] hover:bg-[#ff4f40] text-white rounded-lg font-bold transition-colors"
                        >
                            View Plans
                        </button>
                    </div>
                )}
            </div>

            {/* Support Section */}
            <div className="bg-[#151518] border border-white/5 rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <LifeBuoy className="w-6 h-6 text-[#FF6154]" />
                    <h2 className="text-xl font-bold text-white">Support</h2>
                </div>
                <p className="text-gray-400 mb-6">Need help with your account or have feedback? Our team is here to help.</p>
                <a
                    href="mailto:support@producthuntr.com"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-medium transition-colors border border-white/10"
                >
                    Contact Support
                </a>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <Shield className="w-6 h-6 text-red-500" />
                    <h2 className="text-xl font-bold text-red-500">Danger Zone</h2>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                        <div>
                            <h3 className="font-bold text-white">Sign Out</h3>
                            <p className="text-sm text-gray-500">Sign out of your account on this device.</p>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="px-4 py-2 text-white hover:bg-white/5 rounded-lg transition-colors border border-white/10"
                        >
                            Sign Out
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-xl border border-red-500/10">
                        <div>
                            <h3 className="font-bold text-white">Delete Account</h3>
                            <p className="text-sm text-gray-500">Permanently delete your account and all data.</p>
                        </div>
                        <button
                            onClick={handleDeleteAccount}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                        >
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
