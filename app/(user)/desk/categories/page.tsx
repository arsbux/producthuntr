'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    BarChart3,
    Sparkles,
    Search,
    TrendingUp,
    ArrowUpRight,
    Terminal,
    Brain,
    CheckSquare,
    Megaphone,
    Palette,
    Briefcase,
    MessageCircle,
    Film,
    GraduationCap,
    ShoppingBag,
    Heart,
    BarChart2,
    Users,
    Shield,
    Box
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Category Icon Mapping with unique SVG gradients
// Category Style Mapping
const getCategoryStyle = (categoryName: string) => {
    const name = categoryName.toLowerCase();

    if (name.includes('developer') || name.includes('code')) return { Icon: Terminal, gradient: 'from-pink-500 to-rose-500' };
    if (name.includes('ai') || name.includes('machine')) return { Icon: Brain, gradient: 'from-violet-600 to-indigo-600' };
    if (name.includes('productivity')) return { Icon: CheckSquare, gradient: 'from-cyan-500 to-blue-500' };
    if (name.includes('marketing') || name.includes('growth')) return { Icon: Megaphone, gradient: 'from-orange-400 to-pink-500' };
    if (name.includes('design') || name.includes('creative')) return { Icon: Palette, gradient: 'from-purple-500 to-pink-500' };
    if (name.includes('business') || name.includes('finance')) return { Icon: Briefcase, gradient: 'from-blue-600 to-cyan-500' };
    if (name.includes('communication')) return { Icon: MessageCircle, gradient: 'from-teal-400 to-emerald-500' };
    if (name.includes('media') || name.includes('entertainment')) return { Icon: Film, gradient: 'from-red-500 to-orange-500' };
    if (name.includes('education')) return { Icon: GraduationCap, gradient: 'from-yellow-400 to-orange-500' };
    if (name.includes('commerce')) return { Icon: ShoppingBag, gradient: 'from-emerald-500 to-teal-600' };
    if (name.includes('health')) return { Icon: Heart, gradient: 'from-rose-500 to-red-600' };
    if (name.includes('analytics') || name.includes('data')) return { Icon: BarChart2, gradient: 'from-indigo-500 to-purple-600' };
    if (name.includes('social')) return { Icon: Users, gradient: 'from-blue-400 to-indigo-500' };
    if (name.includes('security')) return { Icon: Shield, gradient: 'from-slate-600 to-slate-800' };

    return { Icon: Box, gradient: 'from-gray-600 to-gray-800' };
};

export default function CategoriesPage() {
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<any[]>([]);
    const [keywords, setKeywords] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'categories' | 'keywords'>('categories');

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                // Fetch top categories and keywords
                const [categoriesData, keywordsData] = await Promise.all([
                    fetch('/api/categories').then(r => r.json()).catch(() => []),
                    fetch('/api/keywords').then(r => r.json()).catch(() => [])
                ]);

                setCategories(categoriesData);
                setKeywords(keywordsData);
            } catch (error) {
                console.error('Failed to load data:', error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredKeywords = keywords.filter(k =>
        k.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-hunted-text mb-2">
                    Categories & Keywords
                </h1>
                <p className="text-gray-600 dark:text-hunted-muted">
                    Explore market trends by category and keyword
                </p>
            </div>

            {/* Search & Tabs */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search categories or keywords..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-hunted-card border border-gray-200 dark:border-hunted-border rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-hunted-text"
                    />
                </div>

                <div className="flex bg-gray-100 dark:bg-hunted-card rounded-lg p-1 border border-gray-200 dark:border-hunted-border">
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'categories'
                            ? 'bg-white dark:bg-hunted-dark text-gray-900 dark:text-hunted-text shadow-sm'
                            : 'text-gray-600 dark:text-hunted-muted hover:text-gray-900 dark:hover:text-hunted-text'
                            }`}
                    >
                        Categories
                    </button>
                    <button
                        onClick={() => setActiveTab('keywords')}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'keywords'
                            ? 'bg-white dark:bg-hunted-dark text-gray-900 dark:text-hunted-text shadow-sm'
                            : 'text-gray-600 dark:text-hunted-muted hover:text-gray-900 dark:hover:text-hunted-text'
                            }`}
                    >
                        Keywords
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            ) : activeTab === 'categories' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCategories.map((category) => {
                        const { Icon, gradient } = getCategoryStyle(category.name);
                        const isPositive = category.trend && !category.trend.startsWith('-');

                        return (
                            <Link
                                key={category.name}
                                href={`/desk/category/${encodeURIComponent(category.name)}`}
                                className="group bg-white dark:bg-hunted-card rounded-xl border border-gray-200 dark:border-hunted-border p-6 hover:border-blue-300 dark:hover:border-blue-500 transition-all shadow-sm hover:shadow-md"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <ArrowUpRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 dark:text-hunted-text mb-3 group-hover:text-blue-600 transition-colors">
                                    {category.name}
                                </h3>

                                <div className="flex items-center justify-between mt-4">
                                    <span className="text-sm font-medium text-gray-500 dark:text-hunted-muted">
                                        {category.count} launches
                                    </span>
                                </div>
                            </Link>
                        );
                    })}

                    {filteredCategories.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500 dark:text-hunted-muted">
                            No categories found matching "{searchQuery}"
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {filteredKeywords.map((keyword, index) => {
                        const { Icon, gradient } = getCategoryStyle(keyword.name);
                        return (
                            <Link
                                key={keyword.name}
                                href={`/desk/keyword/${encodeURIComponent(keyword.name)}`}
                                className="group bg-white dark:bg-hunted-card rounded-lg border border-gray-200 dark:border-hunted-border p-4 hover:border-yellow-300 dark:hover:border-yellow-500 transition-all flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm`}>
                                        <Icon className="w-4 h-4 text-white" />
                                    </div>
                                    <span className="font-medium text-gray-900 dark:text-hunted-text group-hover:text-yellow-600 transition-colors truncate max-w-[150px]">
                                        {keyword.name}
                                    </span>
                                </div>
                                <span className="text-sm font-mono text-gray-500 dark:text-hunted-muted">#{index + 1}</span>
                            </Link>
                        );
                    })}

                    {filteredKeywords.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500 dark:text-hunted-muted">
                            No keywords found matching "{searchQuery}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
