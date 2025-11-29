'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Search, Calendar as CalendarIcon, ArrowRight, Trophy, History, ArrowUpRight, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

type ViewMode = 'search' | 'leaderboard';

export default function ArchiveView({ initialLaunches }: { initialLaunches: any[] }) {
    const [viewMode, setViewMode] = useState<ViewMode>('search');
    const [launches, setLaunches] = useState(initialLaunches);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    const supabase = createClientComponentClient();

    // Categories for quick filtering
    const categories = ['All', 'AI', 'Dev Tools', 'Productivity', 'Design', 'Marketing', 'SaaS'];

    // Debounce query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const fetchLeaderboard = async (date: string) => {
        setLoading(true);
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        // 1. Try fetching from ph_launches (historical)
        let { data, error } = await supabase
            .from('ph_launches')
            .select('*')
            .gte('launched_at', start.toISOString())
            .lte('launched_at', end.toISOString())
            .order('votes_count', { ascending: false });

        // 2. If no data found and it's today (or very recent), try live_snapshot
        if ((!data || data.length === 0) && isToday(parseISO(date))) {
            const { data: snapshot } = await supabase
                .from('live_snapshot')
                .select('snapshot_data')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (snapshot && snapshot.snapshot_data && snapshot.snapshot_data.topLaunches) {
                // Map snapshot data to match ph_launches structure if necessary
                // Assuming snapshot_data.topLaunches has similar structure
                data = snapshot.snapshot_data.topLaunches.map((item: any) => ({
                    ...item,
                    votes_count: item.votes || item.votes_count, // Handle potential naming diffs
                    topics: item.topics || [item.niche] // Fallback
                }));
            }
        }

        if (data) setLaunches(data);
        else setLaunches([]);
        setLoading(false);
    };

    const handleSearch = async () => {
        setLoading(true);

        let queryBuilder = supabase
            .from('ph_launches')
            .select('*')
            .order('launched_at', { ascending: false })
            .limit(50);

        if (debouncedQuery) {
            queryBuilder = queryBuilder.or(`name.ilike.%${debouncedQuery}%,tagline.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`);
        }

        if (selectedCategory !== 'All') {
            // Use contains for array column 'topics'
            queryBuilder = queryBuilder.contains('topics', [selectedCategory]);
        }

        const { data } = await queryBuilder;
        if (data) setLaunches(data);
        else setLaunches([]);
        setLoading(false);
    };

    // Effect to trigger search when debounced query or category changes in Search Mode
    useEffect(() => {
        if (viewMode === 'search') {
            handleSearch();
        }
    }, [debouncedQuery, selectedCategory]);

    // Effect to fetch leaderboard when date changes in Leaderboard Mode
    useEffect(() => {
        if (viewMode === 'leaderboard') {
            fetchLeaderboard(selectedDate);
        }
    }, [selectedDate, viewMode]);

    return (
        <div className="space-y-8">
            {/* Header & Controls */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Archive & Time Machine</h1>
                        <p className="text-gray-400">Search the entire history or travel back to see past leaderboards.</p>
                    </div>

                    {/* View Toggles */}
                    <div className="flex bg-[#1a1a1a] p-1 rounded-lg border border-gray-800">
                        <button
                            onClick={() => setViewMode('search')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'search' ? 'bg-[#FF6154] text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <Search className="w-4 h-4" />
                            Search
                        </button>
                        <button
                            onClick={() => setViewMode('leaderboard')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'leaderboard' ? 'bg-[#FF6154] text-white shadow-lg' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            <History className="w-4 h-4" />
                            Time Machine
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="glass-panel p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row gap-4 items-center relative z-20">
                    {viewMode === 'search' ? (
                        <>
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search launches, makers, or tags..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full bg-[#0F0F0F] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6154] transition-colors"
                                />
                            </div>
                            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${selectedCategory === cat
                                                ? 'bg-white text-black border-white'
                                                : 'bg-transparent text-gray-400 border-gray-700 hover:border-gray-500 hover:text-white'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-4 w-full relative">
                            <div className="relative">
                                <button
                                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                                    className="flex items-center gap-3 bg-[#0F0F0F] border border-gray-800 rounded-lg px-4 py-2.5 hover:border-gray-600 transition-colors"
                                >
                                    <CalendarIcon className="w-4 h-4 text-[#FF6154]" />
                                    <span className="text-gray-400 text-sm">Viewing Leaderboard for:</span>
                                    <span className="text-white text-sm font-medium">{format(parseISO(selectedDate), 'MMMM do, yyyy')}</span>
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                </button>

                                {isDatePickerOpen && (
                                    <div className="absolute top-full left-0 mt-2 z-50">
                                        <ModernDatePicker
                                            selectedDate={selectedDate}
                                            onSelect={(date) => {
                                                setSelectedDate(date);
                                                setIsDatePickerOpen(false);
                                            }}
                                            onClose={() => setIsDatePickerOpen(false)}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
                                <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                <span>Travel back to see what was trending</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Results Grid */}
            <div className="space-y-4">
                {viewMode === 'leaderboard' && !loading && launches.length > 0 && (
                    <div className="flex items-center gap-2 text-[#FF6154] mb-2">
                        <Trophy className="w-5 h-5" />
                        <h2 className="font-bold">Top Products on {format(parseISO(selectedDate), 'MMMM do, yyyy')}</h2>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
                                <div className="flex items-start gap-4">
                                    <Skeleton className="w-16 h-16 rounded-lg" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-6 w-48" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        launches.map((launch, index) => (
                            <div key={launch.id} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 hover:border-[#FF6154]/50 transition-all group relative overflow-hidden">
                                {viewMode === 'leaderboard' && index < 3 && (
                                    <div className={`absolute top-0 left-0 w-1 h-full ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-700'
                                        }`} />
                                )}

                                <div className="flex items-start gap-5">
                                    {viewMode === 'leaderboard' && (
                                        <div className={`flex-none w-8 text-center font-mono text-xl font-bold ${index < 3 ? 'text-white' : 'text-gray-600'
                                            }`}>
                                            #{index + 1}
                                        </div>
                                    )}

                                    {launch.thumbnail_url ? (
                                        <img src={launch.thumbnail_url} alt={launch.name} className="w-16 h-16 rounded-lg object-cover bg-gray-800" />
                                    ) : (
                                        <div className="w-16 h-16 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500 font-bold text-xl">
                                            {launch.name[0]}
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="text-lg font-bold text-white truncate group-hover:text-[#FF6154] transition-colors">
                                                <Link href={`/desk/launch/${launch.id}`} className="flex items-center gap-2">
                                                    {launch.name}
                                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                                                </Link>
                                            </h3>
                                            <span className="text-sm text-gray-500 flex items-center gap-1">
                                                <CalendarIcon className="w-3 h-3" />
                                                {launch.launched_at ? format(new Date(launch.launched_at), 'MMM d, yyyy') : 'Unknown'}
                                            </span>
                                        </div>
                                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{launch.tagline}</p>

                                        <div className="flex flex-wrap items-center gap-4 text-sm">
                                            <div className="flex items-center gap-1.5 text-white bg-white/5 px-2 py-1 rounded-md border border-white/10">
                                                <ArrowUpRight className="w-4 h-4 text-[#FF6154]" />
                                                <span className="font-bold">{launch.votes_count}</span>
                                                <span className="text-gray-500 text-xs">votes</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {launch.topics?.slice(0, 3).map((topic: string) => (
                                                    <span key={topic} className="px-2 py-1 rounded text-xs bg-gray-900 text-gray-400 border border-gray-800">
                                                        {topic}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {!loading && launches.length === 0 && (
                        <div className="text-center py-20 bg-[#1a1a1a] rounded-xl border border-gray-800 border-dashed">
                            <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-gray-600" />
                            </div>
                            <h3 className="text-white font-medium mb-1">No launches found</h3>
                            <p className="text-gray-500 text-sm">Try adjusting your search or filters</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ModernDatePicker({ selectedDate, onSelect, onClose }: { selectedDate: string, onSelect: (date: string) => void, onClose: () => void }) {
    const [currentMonth, setCurrentMonth] = useState(parseISO(selectedDate));
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef, onClose]);

    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    });

    const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    return (
        <div ref={wrapperRef} className="bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-2xl p-4 w-[320px]">
            <div className="flex items-center justify-between mb-4">
                <button onClick={previousMonth} className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-white font-medium">
                    {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <button onClick={nextMonth} className="p-1 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="text-center text-xs text-gray-500 font-medium py-1">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map((day, dayIdx) => {
                    const isSelected = isSameDay(day, parseISO(selectedDate));
                    const isTodayDate = isToday(day);

                    return (
                        <button
                            key={day.toString()}
                            onClick={() => onSelect(format(day, 'yyyy-MM-dd'))}
                            className={`
                                h-9 w-9 rounded-lg text-sm font-medium flex items-center justify-center transition-all
                                ${isSelected
                                    ? 'bg-[#FF6154] text-white shadow-lg shadow-[#FF6154]/20'
                                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                                }
                                ${isTodayDate && !isSelected ? 'border border-[#FF6154] text-[#FF6154]' : ''}
                            `}
                        >
                            {format(day, 'd')}
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between">
                <button
                    onClick={() => onSelect(format(new Date(), 'yyyy-MM-dd'))}
                    className="text-xs text-[#FF6154] hover:text-[#ff4f40] font-medium"
                >
                    Jump to Today
                </button>
            </div>
        </div>
    );
}
