import { NextResponse } from 'next/server';
import { calculateSuccessPatterns } from '@/lib/analytics';

export async function GET() {
    try {
        console.log('[Success Patterns API] Fetching patterns...');
        const patterns = await calculateSuccessPatterns(50);
        console.log(`[Success Patterns API] Found ${patterns.length} patterns`);
        return NextResponse.json({ success: true, patterns });
    } catch (error: any) {
        console.error('[Success Patterns API] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch success patterns', details: error.toString() },
            { status: 500 }
        );
    }
}
