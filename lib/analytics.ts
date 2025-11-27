import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface SuccessPattern {
    icp: string;
    problem: string;
    niche: string;
    count: number;
    avgVotes: number;
    avgComments: number;
    successScore: number; // Calculated metric
}

export interface NicheAnalysis {
    niche: string;
    totalLaunches: number;
    avgVotes: number;
    avgComments: number;
    topProducts: Array<{
        name: string;
        votes: number;
        icp: string;
        problem: string;
    }>;
    commonProblems: Array<{ problem: string; count: number }>;
    commonICPs: Array<{ icp: string; count: number }>;
    saturationScore: number; // 0-100, higher = more saturated
    trendDirection: 'rising' | 'stable' | 'declining';
}

export interface ICPIntelligence {
    icp: string;
    frequency: number;
    avgEngagement: number;
    topProblems: Array<{ problem: string; count: number; avgVotes: number }>;
    isUnderserved: boolean; // Low launches, high engagement
}

export interface MarketGap {
    problem: string;
    suggestedICP: string;
    suggestedNiche: string;
    opportunityScore: number;
    reasoning: string;
}

/**
 * Calculate success patterns from launch data
 */
export async function calculateSuccessPatterns(limit = 50): Promise<SuccessPattern[]> {
    const { data: launches } = await supabase
        .from('ph_launches')
        .select('ai_analysis, votes_count, comments_count')
        .not('ai_analysis', 'is', null);

    if (!launches) return [];

    // Group by ICP + Problem + Niche combination
    const patterns = new Map<string, {
        count: number;
        totalVotes: number;
        totalComments: number;
        icp: string;
        problem: string;
        niche: string;
    }>();

    launches.forEach(launch => {
        const analysis = launch.ai_analysis;
        const key = `${analysis.icp}|${analysis.problem}|${analysis.niche}`;

        const existing = patterns.get(key) || {
            count: 0,
            totalVotes: 0,
            totalComments: 0,
            icp: analysis.icp,
            problem: analysis.problem,
            niche: analysis.niche,
        };

        existing.count++;
        existing.totalVotes += launch.votes_count || 0;
        existing.totalComments += launch.comments_count || 0;

        patterns.set(key, existing);
    });

    // Convert to array and calculate success score
    const results: SuccessPattern[] = Array.from(patterns.values())
        .filter(p => p.count >= 2) // At least 2 launches to be a "pattern"
        .map(p => ({
            icp: p.icp,
            problem: p.problem,
            niche: p.niche,
            count: p.count,
            avgVotes: Math.round(p.totalVotes / p.count),
            avgComments: Math.round(p.totalComments / p.count),
            successScore: calculateSuccessScore(
                p.totalVotes / p.count,
                p.totalComments / p.count,
                p.count
            ),
        }))
        .sort((a, b) => b.successScore - a.successScore)
        .slice(0, limit);

    return results;
}

/**
 * Analyze a specific niche in depth
 */
export async function analyzeNiche(niche: string): Promise<NicheAnalysis | null> {
    const { data: launches } = await supabase
        .from('ph_launches')
        .select('id, name, votes_count, comments_count, ai_analysis, launched_at')
        .not('ai_analysis', 'is', null);

    if (!launches) return null;

    const nicheLaunches = launches.filter(
        l => l.ai_analysis.niche?.toLowerCase() === niche.toLowerCase()
    );

    if (nicheLaunches.length === 0) return null;

    // Calculate metrics
    const totalVotes = nicheLaunches.reduce((sum, l) => sum + (l.votes_count || 0), 0);
    const totalComments = nicheLaunches.reduce((sum, l) => sum + (l.comments_count || 0), 0);

    // Top products
    const topProducts = nicheLaunches
        .sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0))
        .slice(0, 10)
        .map(l => ({
            name: l.name,
            votes: l.votes_count || 0,
            icp: l.ai_analysis.icp,
            problem: l.ai_analysis.problem,
        }));

    // Common problems
    const problemCount = new Map<string, number>();
    nicheLaunches.forEach(l => {
        const problem = l.ai_analysis.problem;
        problemCount.set(problem, (problemCount.get(problem) || 0) + 1);
    });
    const commonProblems = Array.from(problemCount.entries())
        .map(([problem, count]) => ({ problem, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    // Common ICPs
    const icpCount = new Map<string, number>();
    nicheLaunches.forEach(l => {
        const icp = l.ai_analysis.icp;
        icpCount.set(icp, (icpCount.get(icp) || 0) + 1);
    });
    const commonICPs = Array.from(icpCount.entries())
        .map(([icp, count]) => ({ icp, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    // Saturation score (based on launch count and avg engagement)
    const avgVotes = totalVotes / nicheLaunches.length;
    const saturationScore = Math.min(100, Math.round(
        (nicheLaunches.length / 10) * 50 + // More launches = more saturated
        (1 / (avgVotes / 100)) * 50 // Lower engagement = more saturated
    ));

    // Trend direction (last 7 days vs previous 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentLaunches = nicheLaunches.filter(l =>
        new Date(l.launched_at) > sevenDaysAgo
    ).length;
    const previousLaunches = nicheLaunches.filter(l =>
        new Date(l.launched_at) > fourteenDaysAgo && new Date(l.launched_at) <= sevenDaysAgo
    ).length;

    let trendDirection: 'rising' | 'stable' | 'declining' = 'stable';
    if (recentLaunches > previousLaunches * 1.5) trendDirection = 'rising';
    else if (recentLaunches < previousLaunches * 0.5) trendDirection = 'declining';

    return {
        niche,
        totalLaunches: nicheLaunches.length,
        avgVotes: Math.round(avgVotes),
        avgComments: Math.round(totalComments / nicheLaunches.length),
        topProducts,
        commonProblems,
        commonICPs,
        saturationScore,
        trendDirection,
    };
}

/**
 * Get ICP intelligence data
 */
export async function getICPIntelligence(limit = 30): Promise<ICPIntelligence[]> {
    const { data: launches } = await supabase
        .from('ph_launches')
        .select('ai_analysis, votes_count, comments_count')
        .not('ai_analysis', 'is', null);

    if (!launches) return [];

    // Group by ICP
    const icpData = new Map<string, {
        count: number;
        totalVotes: number;
        totalComments: number;
        problems: Map<string, { count: number; totalVotes: number }>;
    }>();

    launches.forEach(launch => {
        const icp = launch.ai_analysis.icp;
        const problem = launch.ai_analysis.problem;

        const existing = icpData.get(icp) || {
            count: 0,
            totalVotes: 0,
            totalComments: 0,
            problems: new Map(),
        };

        existing.count++;
        existing.totalVotes += launch.votes_count || 0;
        existing.totalComments += launch.comments_count || 0;

        const problemData = existing.problems.get(problem) || { count: 0, totalVotes: 0 };
        problemData.count++;
        problemData.totalVotes += launch.votes_count || 0;
        existing.problems.set(problem, problemData);

        icpData.set(icp, existing);
    });

    // Convert to array
    const results: ICPIntelligence[] = Array.from(icpData.entries())
        .map(([icp, data]) => {
            const avgEngagement = (data.totalVotes + data.totalComments * 2) / data.count;

            const topProblems = Array.from(data.problems.entries())
                .map(([problem, pData]) => ({
                    problem,
                    count: pData.count,
                    avgVotes: Math.round(pData.totalVotes / pData.count),
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            // Underserved = high engagement, low launch count
            const isUnderserved = avgEngagement > 300 && data.count < 10;

            return {
                icp,
                frequency: data.count,
                avgEngagement: Math.round(avgEngagement),
                topProblems,
                isUnderserved,
            };
        })
        .sort((a, b) => b.avgEngagement - a.avgEngagement)
        .slice(0, limit);

    return results;
}

/**
 * Find market gaps (underserved opportunities)
 */
export async function findMarketGaps(limit = 20): Promise<MarketGap[]> {
    const icpIntel = await getICPIntelligence(100);

    // Find underserved ICPs with unique problem opportunities
    const gaps: MarketGap[] = [];

    icpIntel
        .filter(i => i.isUnderserved || (i.avgEngagement > 200 && i.frequency < 15))
        .forEach(intel => {
            intel.topProblems.forEach(prob => {
                if (prob.count < 3 && prob.avgVotes > 150) {
                    gaps.push({
                        problem: prob.problem,
                        suggestedICP: intel.icp,
                        suggestedNiche: inferNiche(intel.icp, prob.problem),
                        opportunityScore: calculateOpportunityScore(
                            intel.avgEngagement,
                            intel.frequency,
                            prob.avgVotes,
                            prob.count
                        ),
                        reasoning: `Low competition (${prob.count} products), high engagement (${prob.avgVotes} avg votes), underserved ICP`,
                    });
                }
            });
        });

    return gaps
        .sort((a, b) => b.opportunityScore - a.opportunityScore)
        .slice(0, limit);
}

// Helper functions
function calculateSuccessScore(avgVotes: number, avgComments: number, frequency: number): number {
    // Higher votes = better, more comments = better, more frequency = validated pattern
    return Math.round(
        (avgVotes * 0.6) +
        (avgComments * 0.3 * 5) + // Comments weight more per count
        (Math.min(frequency, 10) * 10) // Cap frequency bonus at 10
    );
}

function calculateOpportunityScore(
    avgEngagement: number,
    frequency: number,
    problemVotes: number,
    problemCount: number
): number {
    return Math.round(
        (avgEngagement * 0.3) +
        (problemVotes * 0.4) +
        ((15 - problemCount) * 20) + // Inverse of problem count (less = better)
        ((20 - frequency) * 5) // Inverse of ICP frequency (less = better)
    );
}

function inferNiche(icp: string, problem: string): string {
    // Simple inference based on common patterns
    if (icp.toLowerCase().includes('developer')) return 'Developer Tools';
    if (icp.toLowerCase().includes('designer')) return 'Design Tools';
    if (icp.toLowerCase().includes('marketer')) return 'Marketing Tools';
    if (icp.toLowerCase().includes('freelancer')) return 'Productivity Tools';
    if (problem.toLowerCase().includes('finance')) return 'Fintech';
    if (problem.toLowerCase().includes('sale')) return 'Sales Tools';
    return 'General SaaS';
}
