'use client';

import { useState } from 'react';
import {
    Lightbulb,
    Search,
    ArrowRight,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Shield,
    Target,
    Sparkles,
    TrendingUp
} from 'lucide-react';
import { validateIdea, type IdeaAnalysis } from '@/lib/idea-validator';

export default function IdeaValidatorPage() {
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<IdeaAnalysis | null>(null);
    const [formData, setFormData] = useState({
        icp: '',
        problem: '',
        niche: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.icp || !formData.problem) return;

        setLoading(true);
        setAnalysis(null);

        try {
            const result = await validateIdea(formData.icp, formData.problem, formData.niche);
            setAnalysis(result);
        } catch (error) {
            console.error('Validation failed:', error);
            // You might want to show an error toast here
        } finally {
            setLoading(false);
        }
    };

    const getVerdictColor = (verdict: string) => {
        switch (verdict) {
            case 'Strong Potential': return 'bg-green-100 text-green-800 border-green-200';
            case 'Niche Opportunity': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'High Competition': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'Needs Refinement': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-6 py-12">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Idea Validator</h1>
                    <p className="text-gray-600">
                        AI-powered market analysis to validate your next big idea.
                    </p>
                </div>

                {/* Input Form */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Who is it for? (Target ICP) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Freelance Graphic Designers"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    value={formData.icp}
                                    onChange={(e) => setFormData({ ...formData, icp: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    What niche/category? (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g., Design Tools"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                    value={formData.niche}
                                    onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                What problem does it solve? <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                required
                                rows={3}
                                placeholder="e.g., Managing multiple client revisions and feedback in one place is chaotic."
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                                value={formData.problem}
                                onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`
                  flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white shadow-md transition-all
                  ${loading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-gray-900 hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5'
                                    }
                `}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Analyzing Market...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        Validate Idea
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Results Section */}
                {analysis && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

                        {/* Verdict Card */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${getVerdictColor(analysis.verdict)}`}>
                                        {analysis.verdict}
                                    </span>
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <span>Confidence Score:</span>
                                        <span className="font-bold text-gray-900">{analysis.score}/100</span>
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Market Analysis</h2>
                                <p className="text-gray-600 leading-relaxed">
                                    {analysis.summary}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                                <div className="p-8">
                                    <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-4">
                                        <Shield className="w-5 h-5 text-blue-600" />
                                        Differentiation Opportunities
                                    </h3>
                                    <ul className="space-y-3">
                                        {analysis.differentiation_opportunities.map((item, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="p-8">
                                    <h3 className="flex items-center gap-2 font-bold text-gray-900 mb-4">
                                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                                        Market Risks
                                    </h3>
                                    <ul className="space-y-3">
                                        {analysis.market_risks.map((item, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                                <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Competitors Section */}
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-gray-400" />
                                Potential Competitors
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                {analysis.competitors.map((competitor) => (
                                    <div
                                        key={competitor.id}
                                        className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6"
                                    >
                                        {/* Logo/Thumbnail */}
                                        <div className="flex-shrink-0">
                                            <div className="w-16 h-16 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden">
                                                {competitor.thumbnail_url ? (
                                                    <img src={competitor.thumbnail_url} alt={competitor.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-2xl font-bold text-gray-300">{competitor.name.charAt(0)}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <h4 className="text-lg font-bold text-gray-900">{competitor.name}</h4>
                                                    <p className="text-sm text-gray-500 line-clamp-1">{competitor.tagline}</p>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-center gap-1 text-orange-500 font-bold text-sm">
                                                        <TrendingUp className="w-3 h-3" />
                                                        {competitor.votes_count}
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                                {competitor.description}
                                            </p>

                                            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 border border-gray-100">
                                                <span className="font-semibold text-gray-900">Why it's a competitor: </span>
                                                {competitor.relevance_reason}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {analysis.competitors.length === 0 && (
                                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                                        <p className="text-gray-500">No direct competitors found in our database.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
