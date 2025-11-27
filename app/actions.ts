'use server';

import { getTopicVelocity } from '@/lib/charts-data';

export async function fetchMarketTrends() {
    const data = await getTopicVelocity(6); // Get last 6 months

    // Transform to the format expected by the UI
    const trends: Record<string, { growth: string; description: string; data: { month: string; votes: number }[] }> = {};

    data.forEach((item) => {
        // Calculate growth
        const firstMonth = item.timeSeriesData[0]?.avgUpvotes || 0;
        const lastMonth = item.timeSeriesData[item.timeSeriesData.length - 1]?.avgUpvotes || 0;
        let growthPercent = 0;
        if (firstMonth > 0) {
            growthPercent = ((lastMonth - firstMonth) / firstMonth) * 100;
        }

        // Determine description based on trend
        let description = "Stable Performance";
        if (item.trend === 'rising') description = "Rising Interest";
        if (item.trend === 'declining') description = "Cooling Down";
        if (growthPercent > 50) description = "High Growth Trajectory";

        // Map data
        trends[item.topic] = {
            growth: `${growthPercent > 0 ? '+' : ''}${growthPercent.toFixed(0)}%`,
            description: description,
            data: item.timeSeriesData.map(d => ({
                month: d.month,
                votes: Math.round(d.avgUpvotes) // Using avg upvotes as the metric
            }))
        };
    });

    return trends;
}

import { getDailyLaunchData, getMarketGapData } from '@/lib/charts-data';

export async function fetchDailyLaunchData() {
    const data = await getDailyLaunchData();
    return data;
}

export async function fetchMarketGapData() {
    const data = await getMarketGapData();
    return data;
}

import { getMarketGaps } from '@/lib/charts-data';

export async function fetchMarketOpportunities() {
    const data = await getMarketGaps();
    return data;
}
