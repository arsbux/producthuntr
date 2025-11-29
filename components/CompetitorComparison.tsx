import { TrendingUp, MessageSquare, Calendar, Tag } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    tagline: string;
    votes_count: number;
    comments_count: number;
    topics: string[];
    thumbnail_url?: string;
    launched_at?: string;
}

interface CompetitorComparisonProps {
    currentProduct: Product;
    competitors: Product[];
}

export default function CompetitorComparison({ currentProduct, competitors }: CompetitorComparisonProps) {
    const allProducts = [currentProduct, ...competitors.slice(0, 3)];

    const calculateDailyVelocity = (p: Product) => {
        if (!p.launched_at) return 0;
        const launchDate = new Date(p.launched_at);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - launchDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.round(p.votes_count / Math.max(1, diffDays));
    };

    return (
        <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-bold text-white mb-6">Competitor Snapshot</h3>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-800">
                            <th className="py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">Product</th>
                            <th className="py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Upvotes</th>
                            <th className="py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Daily Growth</th>
                            <th className="py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Comments</th>
                            <th className="py-4 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Top Tags</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {allProducts.map((p, index) => {
                            const isCurrent = index === 0;
                            const velocity = calculateDailyVelocity(p);

                            return (
                                <tr key={p.id} className={`group transition-colors ${isCurrent ? 'bg-white/5' : 'hover:bg-white/5'}`}>
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            {p.thumbnail_url ? (
                                                <img src={p.thumbnail_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-500 font-bold">
                                                    {p.name[0]}
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-medium ${isCurrent ? 'text-white' : 'text-gray-300'}`}>
                                                        {p.name}
                                                    </span>
                                                    {isCurrent && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                                            YOU
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 line-clamp-1 max-w-[200px]">{p.tagline}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-800 border border-gray-700">
                                            <TrendingUp className="w-3 h-3 text-[#FF6154]" />
                                            <span className="text-sm font-bold text-white">{p.votes_count}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-sm font-medium text-green-400">+{velocity}/day</span>
                                            <span className="text-[10px] text-gray-600">Est. velocity</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-center">
                                        <div className="flex items-center justify-center gap-1 text-gray-400">
                                            <MessageSquare className="w-3 h-3" />
                                            <span className="text-sm">{p.comments_count}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <div className="flex flex-wrap justify-end gap-1">
                                            {p.topics?.slice(0, 2).map(t => (
                                                <span key={t} className="px-2 py-1 rounded text-xs bg-gray-800 text-gray-400 border border-gray-700">
                                                    {t}
                                                </span>
                                            ))}
                                            {p.topics?.length > 2 && (
                                                <span className="px-2 py-1 rounded text-xs bg-gray-800 text-gray-500 border border-gray-700">
                                                    +{p.topics.length - 2}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
