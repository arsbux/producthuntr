'use server'
import { getTrendOverview, getAggregatedTrends } from '@/lib/trends';

export async function fetchTrends(timeframe: number) {
    return await getTrendOverview(timeframe);
}

export async function fetchAggregatedTrends(timeframeKey: string) {
    const now = new Date();
    let startDate = new Date();
    let useSnapshots = false;

    switch (timeframeKey) {
        case '24h':
            startDate.setHours(now.getHours() - 24);
            useSnapshots = true;
            break;
        case '7d': startDate.setDate(now.getDate() - 7); break;
        case '30d': startDate.setDate(now.getDate() - 30); break;
        case '3m': startDate.setMonth(now.getMonth() - 3); break;
        case '6m': startDate.setMonth(now.getMonth() - 6); break;
        case '12m': startDate.setFullYear(now.getFullYear() - 1); break;
        case '18m': startDate.setMonth(now.getMonth() - 18); break;
        default: startDate.setDate(now.getDate() - 30); // Default 30d
    }

    return await getAggregatedTrends(startDate, useSnapshots);
}
