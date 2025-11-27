import { NextResponse } from 'next/server';
import { getICPIntelligence } from '@/lib/analytics';

export async function GET() {
    try {
        const intelligence = await getICPIntelligence(30);
        return NextResponse.json({ success: true, intelligence });
    } catch (error) {
        console.error('Error fetching ICP intelligence:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch ICP intelligence' },
            { status: 500 }
        );
    }
}
