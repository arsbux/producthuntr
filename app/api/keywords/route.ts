import { NextResponse } from 'next/server';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = createClientComponentClient();

        // Fetch all unique topics from launches
        const { data: launches } = await supabase
            .from('ph_launches')
            .select('topics');

        if (!launches) return NextResponse.json([]);

        // Count topics
        const topicCounts = new Map<string, number>();
        launches.forEach(launch => {
            launch.topics?.forEach((topic: string) => {
                topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
            });
        });

        // Convert to array and sort
        const keywords = Array.from(topicCounts.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 100); // Top 100

        return NextResponse.json(keywords);
    } catch (error) {
        console.error('Error fetching keywords:', error);
        return NextResponse.json([], { status: 500 });
    }
}
