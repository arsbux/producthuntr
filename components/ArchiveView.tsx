'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Search, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function ArchiveView({ initialLaunches }: { initialLaunches: any[] }) {
    const [launches, setLaunches] = useState(initialLaunches);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const supabase = createClientComponentClient();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        let queryBuilder = supabase
            .from('ph_launches')
            .select('*')
            .order('launched_at', { ascending: false })
            .limit(50);

        if (query) {
            queryBuilder = queryBuilder.or(`name.ilike.%${query}%,tagline.ilike.%${query}%,description.ilike.%${query}%`);
        }

        const { data } = await queryBuilder;
        if (data) setLaunches(data);
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Historical Archive</h1>
                    <p className="text-gray-400">Explore the database of past launches</p>
                </div>

                <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search by name, tag, or keyword..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full bg-[#1a1a1a] border border-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-[#FF6154]"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-[#FF6154] text-white rounded-lg text-sm font-medium hover:bg-[#ff4f40] transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {launches.map((launch) => (
                    <div key={launch.id} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all group">
                        <div className="flex items-start gap-4">
                            {launch.thumbnail_url ? (
                                <img src={launch.thumbnail_url} alt={launch.name} className="w-16 h-16 rounded-lg object-cover" />
                            ) : (
                                <div className="w-16 h-16 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500 font-bold text-xl">
                                    {launch.name[0]}
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="text-lg font-bold text-white truncate group-hover:text-[#FF6154] transition-colors">
                                        <Link href={`/desk/launch/${launch.id}`}>{launch.name}</Link>
                                    </h3>
                                    <span className="text-sm text-gray-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {launch.launched_at ? format(new Date(launch.launched_at), 'MMM d, yyyy') : 'Unknown'}
                                    </span>
                                </div>
                                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{launch.tagline}</p>

                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1 text-[#FF6154]">
                                        <span className="font-bold">▲ {launch.votes_count}</span>
                                    </div>
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        {launch.topics?.slice(0, 3).map((topic: string) => (
                                            <span key={topic} className="px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-400 border border-gray-700 whitespace-nowrap">
                                                {topic}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Link
                                href={`/desk/launch/${launch.id}`}
                                className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                ))}

                {launches.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No launches found matching your criteria.
                    </div>
                )}
            </div>
        </div>
    );
}
