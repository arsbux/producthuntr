import { NextResponse } from 'next/server';
import { findMarketGaps } from '@/lib/analytics';

export async function GET() {
    try {
        const gaps = await findMarketGaps(20);
        return NextResponse.json({ success: true, gaps });
    } catch (error) {
        console.error('Error finding market gaps:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to find market gaps' },
            { status: 500 }
        );
    }
}
