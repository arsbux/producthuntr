import { NextResponse } from 'next/server';
import { analyzeNiche } from '@/lib/analytics';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const niche = searchParams.get('niche');

        if (!niche) {
            return NextResponse.json(
                { success: false, error: 'Niche parameter required' },
                { status: 400 }
            );
        }

        const analysis = await analyzeNiche(niche);

        if (!analysis) {
            return NextResponse.json(
                { success: false, error: 'Niche not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, analysis });
    } catch (error) {
        console.error('Error analyzing niche:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to analyze niche' },
            { status: 500 }
        );
    }
}
