import { NextResponse } from 'next/server';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = createClientComponentClient();

        // Fetch launches from last 6 months to calculate growth
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const { data: launches } = await supabase
            .from('ph_launches')
            .select('ai_analysis, votes_count, launched_at')
            .not('ai_analysis', 'is', null)
            .gte('launched_at', sixMonthsAgo.toISOString());

        if (!launches) return NextResponse.json([]);

        // Split into recent 3 months and previous 3 months
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const recentLaunches = launches.filter(l => new Date(l.launched_at) >= threeMonthsAgo);
        const olderLaunches = launches.filter(l => new Date(l.launched_at) < threeMonthsAgo);

        // Count categories for both periods
        const recentCounts = new Map<string, number>();
        const olderCounts = new Map<string, number>();

        recentLaunches.forEach(launch => {
            const niche = launch.ai_analysis?.niche;
            if (niche) recentCounts.set(niche, (recentCounts.get(niche) || 0) + 1);
        });

        olderLaunches.forEach(launch => {
            const niche = launch.ai_analysis?.niche;
            if (niche) olderCounts.set(niche, (olderCounts.get(niche) || 0) + 1);
        });

        // Calculate growth for each category
        const allCategories = new Set([...recentCounts.keys(), ...olderCounts.keys()]);
        const categories = Array.from(allCategories).map(name => {
            const recent = recentCounts.get(name) || 0;
            const older = olderCounts.get(name) || 0;
            const growth = older > 0 ? Math.round(((recent - older) / older) * 100) : (recent > 0 ? 100 : 0);

            return {
                name,
                count: recent,
                trend: growth >= 0 ? `+${growth}%` : `${growth}%`
            };
        })
            .filter(c => c.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 50);

        return NextResponse.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json([], { status: 500 });
    }
}
