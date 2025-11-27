'use server';

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

let anthropic: Anthropic | null = null;

export interface ProductSearchResult {
    id: string;
    name: string;
    tagline: string;
    thumbnail_url: string | null;
    votes_count: number;
    comments_count: number;
    created_at: string;
    daily_rank?: number;
}

export interface ProductProfile {
    product: {
        id: string;
        name: string;
        tagline: string;
        description: string;
        thumbnail_url: string | null;
        website_url: string | null;
        votes_count: number;
        comments_count: number;
        created_at: string;
        topics: string[];
        makers: any[];
    };
    analysis: {
        niche: string;
        icp: string;
        problem: string;
    };
    metrics: {
        daily_rank: number;
        weekly_rank: number;
        category_rank: number;
        total_products_in_category: number;
        percentile_in_category: number;
    };
    market_analysis: string; // AI generated summary
}

export async function searchProducts(query: string): Promise<ProductSearchResult[]> {
    if (!query || query.length < 2) return [];

    const { data, error } = await supabase
        .from('ph_launches')
        .select('id, name, tagline, thumbnail_url, votes_count, comments_count, created_at')
        .or(`name.ilike.%${query}%,tagline.ilike.%${query}%`)
        .order('votes_count', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Search error:', error);
        return [];
    }

    // Calculate daily rank for each result (this is a bit expensive, but okay for 5 items)
    // Actually, for autocomplete, maybe we skip rank or do a simplified version.
    // The user image shows rank "2". Let's try to get it.

    const resultsWithRank = await Promise.all(data.map(async (product) => {
        // Get start and end of the product's launch day
        const launchDate = new Date(product.created_at);
        const startOfDay = new Date(launchDate.setHours(0, 0, 0, 0)).toISOString();
        const endOfDay = new Date(launchDate.setHours(23, 59, 59, 999)).toISOString();

        const { count } = await supabase
            .from('ph_launches')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startOfDay)
            .lte('created_at', endOfDay)
            .gt('votes_count', product.votes_count);

        return {
            ...product,
            daily_rank: (count || 0) + 1
        };
    }));

    return resultsWithRank;
}

export async function getProductProfile(productId: string): Promise<ProductProfile> {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');
    if (!anthropic) anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // 1. Fetch Product Data
    const { data: product, error } = await supabase
        .from('ph_launches')
        .select('*')
        .eq('id', productId)
        .single();

    if (error || !product) throw new Error('Product not found');

    // 2. Calculate Ranks
    const launchDate = new Date(product.created_at);
    const startOfDay = new Date(launchDate.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(launchDate.setHours(23, 59, 59, 999)).toISOString();

    // Daily Rank
    const { count: betterDaily } = await supabase
        .from('ph_launches')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .gt('votes_count', product.votes_count);

    const daily_rank = (betterDaily || 0) + 1;

    // Weekly Rank
    const startOfWeek = new Date(launchDate);
    startOfWeek.setDate(launchDate.getDate() - launchDate.getDay()); // Sunday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const { count: betterWeekly } = await supabase
        .from('ph_launches')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfWeek.toISOString())
        .lte('created_at', endOfWeek.toISOString())
        .gt('votes_count', product.votes_count);

    const weekly_rank = (betterWeekly || 0) + 1;

    // Category Rank
    const niche = product.ai_analysis?.niche;
    let category_rank = 0;
    let total_products_in_category = 0;
    let percentile_in_category = 0;

    if (niche) {
        // Total in category
        const { count: totalCat } = await supabase
            .from('ph_launches')
            .select('*', { count: 'exact', head: true })
            .contains('ai_analysis', { niche: niche });

        total_products_in_category = totalCat || 0;

        // Better in category
        const { count: betterCat } = await supabase
            .from('ph_launches')
            .select('*', { count: 'exact', head: true })
            .contains('ai_analysis', { niche: niche })
            .gt('votes_count', product.votes_count);

        category_rank = (betterCat || 0) + 1;

        if (total_products_in_category > 0) {
            percentile_in_category = Math.round(((total_products_in_category - category_rank) / total_products_in_category) * 100);
        }
    }

    // 3. AI Market Analysis
    const prompt = `
    Analyze the market position of this Product Hunt launch.
    
    Product: ${product.name}
    Tagline: ${product.tagline}
    Description: ${product.description}
    Votes: ${product.votes_count}
    Daily Rank: #${daily_rank}
    Category: ${niche || 'General'}
    Category Rank: #${category_rank} out of ${total_products_in_category}
    
    Provide a concise, data-driven market analysis (max 150 words).
    Focus on:
    1. How it stands out in its category.
    2. What its engagement (votes/rank) signals about market demand.
    3. Who the likely ICP (Ideal Customer Profile) is based on the description.
    
    Format as a clean markdown paragraph.
    `;

    const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
    });

    const market_analysis = response.content[0].type === 'text' ? response.content[0].text : 'Analysis unavailable.';

    return {
        product: {
            id: product.id,
            name: product.name,
            tagline: product.tagline,
            description: product.description,
            thumbnail_url: product.thumbnail_url,
            website_url: product.website_url,
            votes_count: product.votes_count,
            comments_count: product.comments_count,
            created_at: product.created_at,
            topics: product.topics || [],
            makers: product.makers || []
        },
        analysis: {
            niche: product.ai_analysis?.niche || 'Uncategorized',
            icp: product.ai_analysis?.icp || 'Unknown',
            problem: product.ai_analysis?.problem || 'Unknown'
        },
        metrics: {
            daily_rank,
            weekly_rank,
            category_rank,
            total_products_in_category,
            percentile_in_category
        },
        market_analysis
    };
}
