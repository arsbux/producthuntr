import { NextResponse } from 'next/server';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: { slug: string } }
) {
    try {
        const supabase = createClientComponentClient();
        const keyword = decodeURIComponent(params.slug);

        // Fetch products for this keyword
        // We check if the 'topics' array contains the keyword
        const { data: products, error } = await supabase
            .from('ph_launches')
            .select('*')
            .contains('topics', [keyword])
            .order('votes_count', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json([], { status: 500 });
        }

        return NextResponse.json(products || []);
    } catch (error) {
        console.error('Error fetching keyword products:', error);
        return NextResponse.json([], { status: 500 });
    }
}
