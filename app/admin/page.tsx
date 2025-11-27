'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-browser';
import {
    Users,
    DollarSign,
    TrendingUp,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Download,
    Search,
    Filter,
    Loader2
} from 'lucide-react';

interface Subscriber {
    id: string;
    email: string;
    subscription_status: string;
    subscription_created_at: string;
    last_payment_at: string;
    whop_user_id: string;
}

interface Stats {
    totalSubscribers: number;
    activeSubscribers: number;
    canceledSubscribers: number;
    mrr: number;
}

export default function AdminPage() {
    const [loading, setLoading] = useState(true);
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [filteredSubscribers, setFilteredSubscribers] = useState<Subscriber[]>([]);
    const [stats, setStats] = useState<Stats>({
        totalSubscribers: 0,
        activeSubscribers: 0,
        canceledSubscribers: 0,
        mrr: 0,
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterSubscribers();
    }, [searchTerm, statusFilter, subscribers]);

    async function loadData() {
        try {
            // Load all subscribers
            const { data: subsData, error } = await supabase
                .from('users')
                .select('id, email, subscription_status, subscription_created_at, last_payment_at, whop_user_id')
                .not('subscription_status', 'is', null)
                .order('subscription_created_at', { ascending: false });

            if (error) throw error;

            setSubscribers(subsData || []);

            // Calculate stats
            const active = subsData?.filter((s: Subscriber) => s.subscription_status === 'active' || s.subscription_status === 'trialing').length || 0;
            const canceled = subsData?.filter((s: Subscriber) => s.subscription_status === 'canceled').length || 0;
            const total = subsData?.length || 0;
            const mrr = active * 15; // $15 per subscriber

            setStats({
                totalSubscribers: total,
                activeSubscribers: active,
                canceledSubscribers: canceled,
                mrr,
            });
        } catch (error) {
            console.error('Error loading admin data:', error);
        } finally {
            setLoading(false);
        }
    }

    function filterSubscribers() {
        let filtered = subscribers;

        // Filter by status
        if (statusFilter !== 'all') {
            filtered = filtered.filter((s: Subscriber) => s.subscription_status === statusFilter);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter((s: Subscriber) =>
                s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.whop_user_id?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredSubscribers(filtered);
    }

    function exportToCSV() {
        const headers = ['Email', 'Status', 'Started', 'Last Payment', 'Whop User ID'];
        const rows = filteredSubscribers.map(s => [
            s.email,
            s.subscription_status,
            s.subscription_created_at || 'N/A',
            s.last_payment_at || 'N/A',
            s.whop_user_id || 'N/A',
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                );
            case 'trialing':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Trial
                    </span>
                );
            case 'past_due':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                        <AlertCircle className="w-3 h-3" /> Past Due
                    </span>
                );
            case 'canceled':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                        <XCircle className="w-3 h-3" /> Canceled
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-100 text-neutral-700 rounded-full text-xs font-semibold">
                        Inactive
                    </span>
                );
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="max-w-7xl mx-auto p-6 sm:p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
                    <p className="text-neutral-600 mt-2">Manage subscribers and revenue</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-neutral-900">{stats.totalSubscribers}</div>
                        <div className="text-sm text-neutral-500 mt-1">Total Subscribers</div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-neutral-900">{stats.activeSubscribers}</div>
                        <div className="text-sm text-neutral-500 mt-1">Active</div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-neutral-900">${stats.mrr}</div>
                        <div className="text-sm text-neutral-500 mt-1">MRR</div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                        <div className="text-3xl font-bold text-neutral-900">{stats.canceledSubscribers}</div>
                        <div className="text-sm text-neutral-500 mt-1">Canceled</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search by email or Whop ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="trialing">Trialing</option>
                            <option value="past_due">Past Due</option>
                            <option value="canceled">Canceled</option>
                        </select>

                        <button
                            onClick={exportToCSV}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg font-semibold hover:bg-neutral-800 transition-all"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Subscribers Table */}
                <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50 border-b border-neutral-200">
                                <tr>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                                        Started
                                    </th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                                        Last Payment
                                    </th>
                                    <th className="text-left px-6 py-4 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                                        Whop ID
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                                {filteredSubscribers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-neutral-500">
                                            No subscribers found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSubscribers.map((subscriber) => (
                                        <tr key={subscriber.id} className="hover:bg-neutral-50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                                                {subscriber.email}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(subscriber.subscription_status)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-neutral-600">
                                                {subscriber.subscription_created_at
                                                    ? new Date(subscriber.subscription_created_at).toLocaleDateString()
                                                    : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-neutral-600">
                                                {subscriber.last_payment_at
                                                    ? new Date(subscriber.last_payment_at).toLocaleDateString()
                                                    : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-neutral-500 font-mono">
                                                {subscriber.whop_user_id || 'N/A'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Results Count */}
                <div className="mt-4 text-sm text-neutral-500 text-center">
                    Showing {filteredSubscribers.length} of {subscribers.length} subscribers
                </div>
            </div>
        </div>
    );
}
