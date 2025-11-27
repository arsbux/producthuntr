'use client';

import { useState } from 'react';
import { ShieldCheck, Sparkles, AlertCircle, Loader2, Lock } from 'lucide-react';
import { validateIdea } from '@/lib/idea-validator';
import Link from 'next/link';

export default function IdeaValidatorDemo() {
    const [icp, setIcp] = useState('');
    const [problem, setProblem] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    const handleValidate = async () => {
        if (!icp || !problem) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const analysis = await validateIdea(icp, problem);
            setResult(analysis);
        } catch (err) {
            console.error(err);
            setError('Failed to validate idea. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-neutral-900 rounded-3xl border border-neutral-800 shadow-2xl overflow-hidden flex flex-col h-full min-h-[500px] relative">
            <div className="p-6 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-sm z-10">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <h3 className="text-sm font-bold text-neutral-300 uppercase tracking-wider">AI Validator</h3>
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col relative">
                {!result ? (
                    <div className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Target Audience (ICP)</label>
                            <input
                                type="text"
                                value={icp}
                                onChange={(e) => setIcp(e.target.value)}
                                placeholder="e.g. Freelance Graphic Designers"
                                className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Problem to Solve</label>
                            <textarea
                                value={problem}
                                onChange={(e) => setProblem(e.target.value)}
                                placeholder="e.g. Spending too much time managing client invoices and payments."
                                className="w-full px-4 py-3 rounded-xl bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-all h-32 resize-none text-sm"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-900/20 text-red-400 rounded-lg text-xs flex items-center gap-2 border border-red-900/50">
                                <AlertCircle className="w-3 h-3" /> {error}
                            </div>
                        )}

                        <button
                            onClick={handleValidate}
                            disabled={loading || !icp || !problem}
                            className="w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Market...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" /> Validate Idea
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="animate-fade-in space-y-6 h-full flex flex-col">
                        {/* Visible Score Section */}
                        <div className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-xl border border-neutral-800">
                            <div>
                                <div className="text-xs text-neutral-500 mb-1 uppercase tracking-wider">Validation Score</div>
                                <div className="text-4xl font-bold text-white">{result.score}/100</div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold border ${result.verdict === 'Strong Potential' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                    result.verdict === 'High Competition' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                }`}>
                                {result.verdict}
                            </div>
                        </div>

                        {/* Blurred Content Container */}
                        <div className="relative flex-1">
                            <div className="space-y-6 filter blur-[6px] opacity-50 select-none pointer-events-none">
                                {/* Blurred Summary */}
                                <div className="space-y-2">
                                    <div className="h-4 bg-neutral-700 rounded w-3/4"></div>
                                    <div className="h-4 bg-neutral-700 rounded w-full"></div>
                                    <div className="h-4 bg-neutral-700 rounded w-5/6"></div>
                                </div>

                                {/* Blurred Competitors */}
                                <div>
                                    <h4 className="font-bold text-white mb-3 text-xs uppercase tracking-wider">Competitors Detected</h4>
                                    <div className="space-y-3">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 bg-neutral-800 rounded-lg border border-neutral-700">
                                                <div className="w-8 h-8 bg-neutral-700 rounded flex-shrink-0"></div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 bg-neutral-600 rounded w-1/3"></div>
                                                    <div className="h-2 bg-neutral-700 rounded w-2/3"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Blurred Risks */}
                                <div>
                                    <h4 className="font-bold text-white mb-3 text-xs uppercase tracking-wider">Market Risks</h4>
                                    <div className="space-y-2">
                                        <div className="h-8 bg-red-900/20 border border-red-900/30 rounded w-full"></div>
                                        <div className="h-8 bg-red-900/20 border border-red-900/30 rounded w-full"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Unlock Overlay */}
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
                                <div className="bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 p-6 rounded-2xl shadow-2xl max-w-xs text-center transform transition-all duration-500 hover:scale-105 hover:border-green-500/30">
                                    <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-green-500/20">
                                        <Lock className="w-5 h-5 text-green-500" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-1">Unlock Full Report</h3>
                                    <p className="text-neutral-400 text-xs mb-4 leading-relaxed">
                                        See detailed competitor analysis, market risks, and differentiation strategies.
                                    </p>
                                    <Link href="/login" className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-all shadow-lg shadow-green-900/20 text-sm">
                                        <Sparkles className="w-4 h-4" /> Get Full Analysis
                                    </Link>
                                    <button
                                        onClick={() => setResult(null)}
                                        className="mt-3 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                                    >
                                        Try another idea
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
