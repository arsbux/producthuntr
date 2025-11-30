import { NextResponse } from 'next/server';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { categorizeNiche } from '@/lib/category-mapping';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: { slug: string } }
) {
    try {
        const supabase = createClientComponentClient();
        const category = decodeURIComponent(params.slug);

        // Fetch a larger set of products to filter in memory
        // We can't easily filter by mapped category in SQL without a generated column or view
        const { data: products, error } = await supabase
            .from('ph_launches')
            .select('*')
            .order('votes_count', { ascending: false })
            .limit(500);

        if (error) {
            console.error('Supabase error:', error);
            return NextResponse.json([], { status: 500 });
        }

        if (!products) return NextResponse.json([]);

        // Filter by category using the mapping logic
        const filteredProducts = products.filter(p => {
            const rawNiche = p.ai_analysis?.niche || 'Unknown';
            // Check if it matches the category directly or via mapping
            if (rawNiche === category) return true;
            return categorizeNiche(rawNiche) === category;
        });

        return NextResponse.json(filteredProducts.slice(0, 100));
    } catch (error) {
        console.error('Error fetching category products:', error);
        return NextResponse.json([], { status: 500 });
    }
}
