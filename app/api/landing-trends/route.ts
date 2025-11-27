import { NextResponse } from 'next/server';
import {
    getTopicVelocity,
    getTopCategories,
    getMarketHealth,
    getMarketGaps
} from '@/lib/charts-data';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Parallelize fetches for performance
        const [
            velocityData,
            volumeData,
            marketHealth,
            marketGaps
        ] = await Promise.all([
            getTopicVelocity(12),
            getTopCategories('launches'),
            getMarketHealth(),
            getMarketGaps()
        ]);

        // Format trends for the frontend
        const trends = velocityData.map((topic, index) => {
            const firstMonth = topic.timeSeriesData[0]?.launchCount || 0;
            const lastMonth = topic.timeSeriesData[topic.timeSeriesData.length - 1]?.launchCount || 0;

            let growth = 0;
            // Use a minimum baseline of 5 to avoid massive percentage jumps from small numbers
            const baseline = Math.max(firstMonth, 5);

            if (lastMonth > 0) {
                growth = Math.round(((lastMonth - baseline) / baseline) * 100);
            }

            // Cap growth at 950% to avoid looking like fake data
            if (growth > 950) growth = 950;
            if (growth < 0) growth = 0; // Don't show negative growth on landing page trends

            let status = 'Regular';
            if (growth > 50) status = 'Exploding';
            else if (growth > 20) status = 'Rising';

            return {
                id: `trend-${index}`,
                title: topic.topic,
                subtitle: `${topic.totalLaunches} Launches`,
                metric: `${growth > 0 ? '+' : ''}${growth}%`,
                metricLabel: 'Growth',
                chartData: topic.timeSeriesData.map(d => ({ value: d.launchCount })),
                status: status,
                type: 'Niche'
            };
        });

        return NextResponse.json({
            trends: trends.slice(0, 9),
            topNiches: volumeData.slice(0, 5),
            marketGaps: marketGaps.slice(0, 10),
            stats: {
                totalProducts: marketHealth?.totalProducts || 0,
                successRate: marketHealth?.successRate || 0,
                marketGaps: marketGaps.length || 0,
                highPerformers: marketHealth?.highPerformers || 0
            }
        });
    } catch (error) {
        console.error('Error fetching landing trends:', error);
        return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
    }
}
