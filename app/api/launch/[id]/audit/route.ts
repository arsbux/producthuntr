import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { analyzeLaunch } from '@/lib/ai-analyst';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const supabase = createRouteHandlerClient({ cookies });
    const { id } = params;

    try {
        // 1. Fetch Product Data
        const { data: product, error } = await supabase
            .from('ph_launches')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // 2. Run AI Analysis
        const analysis = await analyzeLaunch({
            name: product.name,
            tagline: product.tagline,
            description: product.description,
            topics: product.topics || [],
        });

        // 3. Update Database
        const { error: updateError } = await supabase
            .from('ph_launches')
            .update({
                ai_analysis: analysis,
                analyzed_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ success: true, analysis });

    } catch (error: any) {
        console.error('Audit generation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
