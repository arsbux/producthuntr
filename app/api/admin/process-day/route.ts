import { NextResponse } from 'next/server';
import { processDay, fetchLaunchesForDate } from '@/lib/product-processor';

export const maxDuration = 300; // 5 minutes timeout for Vercel

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { date, password, action, limit } = body;

        if (password !== 'producthuntr') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!date) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }

        const targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
            return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
        }

        if (action === 'check') {
            const launches = await fetchLaunchesForDate(targetDate);
            return NextResponse.json({
                success: true,
                count: launches.length,
                launches: launches.map(l => ({ name: l.name, votes: l.votes_count }))
            });
        }

        const stats = await processDay(targetDate, limit);

        return NextResponse.json({ success: true, stats });
    } catch (error: any) {
        console.error('Error processing day:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
