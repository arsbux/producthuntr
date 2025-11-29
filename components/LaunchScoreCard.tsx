import { Zap, TrendingUp, Users, Tag } from 'lucide-react';

interface LaunchScoreCardProps {
    score: number;
    grade: string;
    breakdown: {
        velocity: number;
        traction: number;
        makers: number;
        topics: number;
    };
}

export default function LaunchScoreCard({ score, grade, breakdown }: LaunchScoreCardProps) {
    const getGradeColor = (g: string) => {
        if (g.startsWith('A')) return 'text-green-400';
        if (g.startsWith('B')) return 'text-blue-400';
        if (g.startsWith('C')) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Predictive Launch Score</h3>
                <div className={`text-3xl font-bold ${getGradeColor(grade)}`}>{grade}</div>
            </div>

            <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden mb-6">
                <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#FF6154] to-orange-500 transition-all duration-1000"
                    style={{ width: `${score}%` }}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <TrendingUp className="w-3 h-3" />
                        Velocity Impact
                    </div>
                    <div className="text-white font-bold">+{breakdown.velocity}</div>
                </div>
                <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <Zap className="w-3 h-3" />
                        Traction Rate
                    </div>
                    <div className="text-white font-bold">+{breakdown.traction}</div>
                </div>
                <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <Users className="w-3 h-3" />
                        Maker Influence
                    </div>
                    <div className="text-white font-bold">+{breakdown.makers}</div>
                </div>
                <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                        <Tag className="w-3 h-3" />
                        Topic Bonus
                    </div>
                    <div className="text-white font-bold">+{breakdown.topics}</div>
                </div>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center">
                AI-calculated probability of reaching Top 5
            </p>
        </div>
    );
}
