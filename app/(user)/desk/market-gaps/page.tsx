'use client';

import { useState, useEffect } from 'react';
import { Lightbulb, TrendingUp, AlertCircle, CheckCircle, Sparkles, Target, Shield, Zap, Brain } from 'lucide-react';

interface MarketGap {
    problem: string;
    suggestedICP: string;
    suggestedNiche: string;
    opportunityScore: number;
    reasoning: string;
}

interface AIValidation {
    verdict: 'STRONG_GO' | 'CAUTIOUS_GO' | 'PIVOT_RECOMMENDED' | 'RED_FLAG';
    verdictTitle: string;
    overallScore: number;
    marketSaturation: 'LOW' | 'MEDIUM' | 'HIGH';
    competitionLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    opportunityScore: number;
    strengths: string[];
    risks: string[];
    recommendations: string[];
    uniqueAngle: string;
    estimatedTraction: string;
    summary: string;
}

export default function MarketGapsPage() {
    const [gaps, setGaps] = useState<MarketGap[]>([]);
    const [loading, setLoading] = useState(true);
    const [validatorMode, setValidatorMode] = useState(false);
    const [ideaInput, setIdeaInput] = useState({ icp: '', problem: '', niche: '' });
    const [aiValidation, setAiValidation] = useState<AIValidation | null>(null);
    const [marketData, setMarketData] = useState<any>(null);
    const [validating, setValidating] = useState(false);

    useEffect(() => {
        fetchGaps();
    }, []);

    async function fetchGaps() {
        try {
            const res = await fetch('/api/analytics/market-gaps');
            const data = await res.json();
            if (data.success) {
                setGaps(data.gaps);
            }
        } catch (error) {
            console.error('Error fetching market gaps:', error);
        } finally {
            setLoading(false);
        }
    }

    async function validateIdea() {
        setValidating(true);
        setAiValidation(null);

        try {
            const res = await fetch('/api/validate-idea', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ideaInput),
            });

            const data = await res.json();

            if (data.success) {
                setAiValidation(data.analysis);
                setMarketData(data.marketData);
            } else {
                alert('Validation failed: ' + data.error);
            }
        } catch (error) {
            console.error('Error validating idea:', error);
            alert('Failed to validate idea. Please try again.');
        } finally {
            setValidating(false);
        }
    }

    const getVerdictColor = (verdict: string) => {
        switch (verdict) {
            case 'STRONG_GO': return 'green';
            case 'CAUTIOUS_GO': return 'blue';
            case 'PIVOT_RECOMMENDED': return 'yellow';
            case 'RED_FLAG': return 'red';
            default: return 'gray';
        }
    };

    const getVerdictIcon = (verdict: string) => {
        switch (verdict) {
            case 'STRONG_GO': return <CheckCircle className="w-8 h-8" />;
            case 'CAUTIOUS_GO': return <Lightbulb className="w-8 h-8" />;
            case 'PIVOT_RECOMMENDED': return <AlertCircle className="w-8 h-8" />;
            case 'RED_FLAG': return <Shield className="w-8 h-8" />;
            default: return <Brain className="w-8 h-8" />;
        }
    };

    return (
        <div className="p-4 md:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">
                    {validatorMode ? 'AI Idea Validator' : 'Market Gaps'}
                </h1>
                <p className="text-sm md:text-base text-neutral-600">
                    {validatorMode
                        ? 'Get AI-powered insights on your startup idea backed by real Product Hunt data'
                        : 'Discover underserved opportunities with high engagement potential'}
                </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex flex-col md:flex-row gap-2 mb-8">
                <button
                    onClick={() => { setValidatorMode(false); setAiValidation(null); }}
                    className={`px-6 py-3 rounded-lg font-medium transition-all text-sm md:text-base ${!validatorMode
                        ? 'bg-neutral-900 text-white'
                        : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-900'
                        }`}
                >
                    <Lightbulb className="w-4 h-4 inline mr-2" />
                    Market Gaps
                </button>
                <button
                    onClick={() => setValidatorMode(true)}
                    className={`px-6 py-3 rounded-lg font-medium transition-all text-sm md:text-base ${validatorMode
                        ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white'
                        : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-900'
                        }`}
                >
                    <Sparkles className="w-4 h-4 inline mr-2" />
                    Validate My Idea (AI)
                </button>
            </div>

            {validatorMode ? (
                // AI Idea Validator Mode
                <div className="max-w-4xl">
                    <div className="bg-white border border-neutral-200 rounded-xl p-4 md:p-8 mb-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg md:text-xl font-bold text-neutral-900">Tell us about your idea</h3>
                                <p className="text-xs md:text-sm text-neutral-600">AI will analyze it against 300+ Product Hunt launches</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                    Who is it for? (Target ICP) *
                                </label>
                                <input
                                    type="text"
                                    value={ideaInput.icp}
                                    onChange={(e) => setIdeaInput({ ...ideaInput, icp: e.target.value })}
                                    placeholder="e.g., Freelance Designers, React Developers"
                                    className="w-full border border-neutral-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm md:text-base"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                    What problem does it solve? *
                                </label>
                                <input
                                    type="text"
                                    value={ideaInput.problem}
                                    onChange={(e) => setIdeaInput({ ...ideaInput, problem: e.target.value })}
                                    placeholder="e.g., Managing multiple invoices, Debugging hydration errors"
                                    className="w-full border border-neutral-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm md:text-base"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                                    What niche/category? (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={ideaInput.niche}
                                    onChange={(e) => setIdeaInput({ ...ideaInput, niche: e.target.value })}
                                    placeholder="e.g., Fintech for Creatives, DevTools for Frontend"
                                    className="w-full border border-neutral-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm md:text-base"
                                />
                            </div>
                        </div>

                        <button
                            onClick={validateIdea}
                            disabled={!ideaInput.icp || !ideaInput.problem || validating}
                            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white py-4 rounded-lg font-semibold hover:from-orange-700 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-200 flex items-center justify-center gap-2 text-sm md:text-base"
                        >
                            {validating ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    AI is analyzing your idea...
                                </>
                            ) : (
                                <>
                                    <Brain className="w-5 h-5" />
                                    Get AI Validation
                                </>
                            )}
                        </button>
                    </div>

                    {/* AI Analysis Results */}
                    {aiValidation && (
                        <div className="space-y-6">
                            {/* Verdict Card */}
                            <div className={`border-2 rounded-xl p-4 md:p-8 bg-gradient-to-br ${getVerdictColor(aiValidation.verdict) === 'green' ? 'from-green-50 to-emerald-50 border-green-300' :
                                getVerdictColor(aiValidation.verdict) === 'blue' ? 'from-blue-50 to-cyan-50 border-blue-300' :
                                    getVerdictColor(aiValidation.verdict) === 'yellow' ? 'from-yellow-50 to-orange-50 border-yellow-300' :
                                        'from-red-50 to-rose-50 border-red-300'
                                }`}>
                                <div className="flex flex-col md:flex-row items-start gap-4">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${getVerdictColor(aiValidation.verdict) === 'green' ? 'bg-green-500 text-white' :
                                        getVerdictColor(aiValidation.verdict) === 'blue' ? 'bg-blue-500 text-white' :
                                            getVerdictColor(aiValidation.verdict) === 'yellow' ? 'bg-yellow-500 text-white' :
                                                'bg-red-500 text-white'
                                        }`}>
                                        {getVerdictIcon(aiValidation.verdict)}
                                    </div>
                                    <div className="flex-1 w-full">
                                        <div className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">{aiValidation.verdictTitle}</div>
                                        <p className="text-neutral-700 text-base md:text-lg mb-4">{aiValidation.summary}</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div className="px-4 py-2 bg-white rounded-lg border border-neutral-200">
                                                <div className="text-xs text-neutral-600 mb-1">Overall Score</div>
                                                <div className="text-2xl font-bold text-neutral-900">{aiValidation.overallScore}/100</div>
                                            </div>
                                            <div className="px-4 py-2 bg-white rounded-lg border border-neutral-200">
                                                <div className="text-xs text-neutral-600 mb-1">Competition</div>
                                                <div className="text-sm font-bold text-neutral-900">{aiValidation.competitionLevel}</div>
                                            </div>
                                            <div className="px-4 py-2 bg-white rounded-lg border border-neutral-200">
                                                <div className="text-xs text-neutral-600 mb-1">Market Saturation</div>
                                                <div className="text-sm font-bold text-neutral-900">{aiValidation.marketSaturation}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Analysis Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Strengths */}
                                <div className="bg-white border border-neutral-200 rounded-xl p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <h4 className="font-bold text-neutral-900">Strengths</h4>
                                    </div>
                                    <ul className="space-y-2">
                                        {aiValidation.strengths.map((strength, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                                                <span className="text-green-600 mt-0.5">✓</span>
                                                <span>{strength}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Risks */}
                                <div className="bg-white border border-neutral-200 rounded-xl p-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <AlertCircle className="w-5 h-5 text-orange-600" />
                                        <h4 className="font-bold text-neutral-900">Risks to Consider</h4>
                                    </div>
                                    <ul className="space-y-2">
                                        {aiValidation.risks.map((risk, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                                                <span className="text-orange-600 mt-0.5">⚠</span>
                                                <span>{risk}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Zap className="w-5 h-5 text-blue-600" />
                                    <h4 className="font-bold text-neutral-900">Recommended Actions</h4>
                                </div>
                                <ol className="space-y-3">
                                    {aiValidation.recommendations.map((rec, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                {i + 1}
                                            </div>
                                            <span className="text-sm text-neutral-800">{rec}</span>
                                        </li>
                                    ))}
                                </ol>
                            </div>

                            {/* Unique Angle */}
                            <div className="bg-white border border-neutral-200 rounded-xl p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Target className="w-5 h-5 text-purple-600" />
                                    <h4 className="font-bold text-neutral-900">Your Unique Angle</h4>
                                </div>
                                <p className="text-neutral-700">{aiValidation.uniqueAngle}</p>
                            </div>

                            {/* Market Data */}
                            {marketData && (
                                <div className="bg-white border border-neutral-200 rounded-xl p-6">
                                    <h4 className="font-bold text-neutral-900 mb-4">Market Data</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div>
                                            <div className="text-xs text-neutral-600 mb-1">Total Products</div>
                                            <div className="text-2xl font-bold text-neutral-900">{marketData.totalProducts}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-neutral-600 mb-1">Direct Competitors</div>
                                            <div className="text-2xl font-bold text-neutral-900">{marketData.directCompetitors}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-neutral-600 mb-1">Avg Votes</div>
                                            <div className="text-2xl font-bold text-neutral-900">{marketData.avgVotes}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-neutral-600 mb-1">Estimated Traction</div>
                                            <div className="text-sm font-bold text-neutral-900">{aiValidation.estimatedTraction}</div>
                                        </div>
                                    </div>
                                    {marketData.similarProducts && marketData.similarProducts.length > 0 && (
                                        <div>
                                            <div className="text-sm font-semibold text-neutral-700 mb-2">Similar Products:</div>
                                            <div className="space-y-2">
                                                {marketData.similarProducts.map((product: any, i: number) => (
                                                    <div key={i} className="text-sm text-neutral-600 flex items-center justify-between">
                                                        <span>{product.name}</span>
                                                        <span className="text-neutral-900 font-medium">{product.votes} votes</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                // Market Gaps Mode
                <div>
                    {loading ? (
                        <div className="text-center py-12 text-neutral-600">Finding opportunities...</div>
                    ) : (
                        <div className="grid gap-4">
                            {gaps.map((gap, index) => (
                                <div
                                    key={index}
                                    className="bg-white border border-neutral-200 rounded-xl p-4 md:p-6 hover:border-neutral-900 hover:shadow-lg transition-all"
                                >
                                    <div className="flex flex-col md:flex-row items-start justify-between mb-4 gap-4">
                                        <div className="flex-1 w-full">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                                                    Score: {gap.opportunityScore}
                                                </div>
                                                <TrendingUp className="w-4 h-4 text-green-600" />
                                            </div>

                                            <h3 className="text-lg font-bold text-neutral-900 mb-2">{gap.problem}</h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                                <div className="bg-neutral-50 p-3 rounded-lg md:bg-transparent md:p-0">
                                                    <div className="text-xs font-medium text-neutral-500 mb-1">SUGGESTED ICP</div>
                                                    <div className="text-sm text-neutral-900">{gap.suggestedICP}</div>
                                                </div>
                                                <div className="bg-neutral-50 p-3 rounded-lg md:bg-transparent md:p-0">
                                                    <div className="text-xs font-medium text-neutral-500 mb-1">SUGGESTED NICHE</div>
                                                    <div className="text-sm text-neutral-900">{gap.suggestedNiche}</div>
                                                </div>
                                            </div>

                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                                                <strong>Why this is an opportunity:</strong> {gap.reasoning}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
