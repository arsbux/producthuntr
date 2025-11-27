import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Frontend API: Reads rich data directly from vote_snapshots
 */
export async function GET() {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Fetch rich snapshots directly
        const { data: snapshots, error } = await supabase
            .from('vote_snapshots')
            .select('*')
            .eq('snapshot_date', today)
            .order('votes_count', { ascending: false });

        if (error || !snapshots) {
            console.error('[Frontend API] Error:', error);
            return NextResponse.json({ chartData: [], topLaunches: [], metrics: {} });
        }

        // Helper: Categorize based on topics/name
        function guessCategory(post: any): string {
            const text = (post.product_name + ' ' + post.tagline + ' ' + (post.topics?.join(' ') || '')).toLowerCase();

            if (text.includes('ai') || text.includes('gpt') || text.includes('machine learning')) return 'AI & Machine Learning';
            if (text.includes('dev') || text.includes('api') || text.includes('code')) return 'Developer Tools';
            if (text.includes('design') || text.includes('ui') || text.includes('figma')) return 'Design & Creative';
            if (text.includes('marketing') || text.includes('seo')) return 'Marketing & Growth';
            if (text.includes('productivity') || text.includes('task')) return 'Productivity & Organization';

            return 'Other';
        }

        function getCategoryColor(category: string): string {
            const colors: Record<string, string> = {
                'AI & Machine Learning': '#8b5cf6',
                'Developer Tools': '#3b82f6',
                'Productivity & Organization': '#10b981',
                'Design & Creative': '#f43f5e',
                'Marketing & Growth': '#f59e0b',
                'Fintech & Finance': '#0ea5e9',
                'Health & Wellness': '#ec4899',
                'Education & Learning': '#14b8a6',
                'E-commerce & Retail': '#f97316',
                'Analytics & Data': '#0ea5e9',
                'Other': '#9ca3af'
            };
            return colors[category] || '#9ca3af';
        }

        // Process data - Calculate from ALL snapshots
        const categoryCount: Record<string, number> = {};
        let aiCount = 0;
        let totalVotes = 0;

        // First pass: Calculate category distribution from ALL products
        snapshots.forEach(s => {
            const category = guessCategory(s);
            categoryCount[category] = (categoryCount[category] || 0) + 1;
            if (category === 'AI & Machine Learning') aiCount++;
            totalVotes += s.votes_count;
        });

        // Second pass: Build topLaunches list (limited to 200 for performance)
        const topLaunches = snapshots.slice(0, 200).map(s => {
            const category = guessCategory(s);

            return {
                name: s.product_name,
                votes: s.votes_count,
                comments: s.comments_count,
                niche: category,
                tagline: s.tagline,
                thumbnail_url: s.thumbnail_url,
                website_url: s.website_url,
                launched_at: s.launched_at || s.snapshot_time
            };
        });

        // Chart Data - Now reflects ALL products
        const chartData = Object.entries(categoryCount)
            .map(([name, value]) => ({ name, value, color: getCategoryColor(name) }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        return NextResponse.json({
            chartData,
            topLaunches,
            metrics: {
                totalLaunches: snapshots.length,
                aiPercentage: snapshots.length > 0 ? Math.round((aiCount / snapshots.length) * 100) : 0,
                avgVotes: snapshots.length > 0 ? Math.round(totalVotes / snapshots.length) : 0,
                topCategory: chartData[0]?.name || 'N/A'
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
