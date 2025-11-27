import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const timeframe = searchParams.get('timeframe') || '24h';

        let startDate = new Date();
        let groupBy: 'hour' | 'day' = 'hour';

        switch (timeframe) {
            case '24h':
                startDate.setHours(startDate.getHours() - 24);
                groupBy = 'hour';
                break;
            case '7d':
                startDate.setDate(startDate.getDate() - 7);
                groupBy = 'day';
                break;
            case '30d':
                startDate.setDate(startDate.getDate() - 30);
                groupBy = 'day';
                break;
            case '90d':
                startDate.setDate(startDate.getDate() - 90);
                groupBy = 'day';
                break;
            default:
                startDate.setHours(startDate.getHours() - 24);
                groupBy = 'hour';
        }

        const { data, error } = await supabase
            .from('analytics_visits')
            .select('*')
            .gte('created_at', startDate.toISOString())
            .order('created_at', { ascending: true });

        if (error) throw error;

        const visits = data || [];

        // Aggregation
        const timeline: Record<string, number> = {};
        const pages: Record<string, number> = {};
        const devices: Record<string, number> = {};
        const countries: Record<string, number> = {};

        // Initialize timeline with 0s to ensure continuous chart
        const now = new Date();
        let current = new Date(startDate);

        while (current <= now) {
            let key;
            if (groupBy === 'hour') {
                key = current.toISOString().slice(0, 13) + ':00:00.000Z';
                current.setHours(current.getHours() + 1);
            } else {
                key = current.toISOString().slice(0, 10) + 'T00:00:00.000Z';
                current.setDate(current.getDate() + 1);
            }
            timeline[key] = 0;
        }

        visits.forEach(visit => {
            // Timeline
            const date = new Date(visit.created_at);
            let key;
            if (groupBy === 'hour') {
                key = date.toISOString().slice(0, 13) + ':00:00.000Z';
            } else {
                key = date.toISOString().slice(0, 10) + 'T00:00:00.000Z';
            }

            // Only count if within our generated range (handles slight edge cases)
            if (timeline.hasOwnProperty(key)) {
                timeline[key] = (timeline[key] || 0) + 1;
            }

            // Pages
            const path = visit.page_path || '/';
            pages[path] = (pages[path] || 0) + 1;

            // Devices
            const device = visit.device_type || 'unknown';
            devices[device] = (devices[device] || 0) + 1;

            // Countries
            const country = visit.country || 'Unknown';
            countries[country] = (countries[country] || 0) + 1;
        });

        // Format for Recharts
        const timelineData = Object.entries(timeline)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        const pagesData = Object.entries(pages)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        const devicesData = Object.entries(devices)
            .map(([name, value]) => ({ name, value }));

        const countriesData = Object.entries(countries)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        return NextResponse.json({
            timeline: timelineData,
            pages: pagesData,
            devices: devicesData,
            countries: countriesData,
            totalVisits: visits.length,
            avgDuration: Math.round(visits.reduce((acc, v) => acc + (v.duration_seconds || 0), 0) / (visits.length || 1)),
            timeframe,
            groupBy
        });

    } catch (error: any) {
        console.error('Analytics Fetch Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
