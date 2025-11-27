'use server';

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side usage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

let anthropic: Anthropic | null = null;

export interface Competitor {
    id: string;
    name: string;
    tagline: string;
    description: string;
    votes_count: number;
    website_url?: string;
    thumbnail_url?: string;
    relevance_score?: number;
    relevance_reason?: string;
}

export interface IdeaAnalysis {
    verdict: 'Strong Potential' | 'High Competition' | 'Niche Opportunity' | 'Needs Refinement';
    score: number; // 0-100
    summary: string;
    competitors: Competitor[];
    differentiation_opportunities: string[];
    market_risks: string[];
    target_audience_feedback: string;
}

export async function validateIdea(
    icp: string,
    problem: string,
    niche?: string
): Promise<IdeaAnalysis> {
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not set');
    }

    if (!anthropic) {
        anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
    }

    // 1. Fetch potential competitors from Supabase
    // We'll try to find products in similar niches or with similar keywords
    let query = supabase
        .from('ph_launches')
        .select('id, name, tagline, description, votes_count, website_url, thumbnail_url, ai_analysis')
        .order('votes_count', { ascending: false })
        .limit(50);

    if (niche) {
        // If niche is provided, try to filter by it (assuming we can text search or it matches topics)
        // Since we don't have full text search setup guaranteed, we'll fetch a broader set and let AI filter
        // But we can try to filter by ai_analysis->niche if possible, or just fetch top products
    }

    const { data: products, error } = await query;

    if (error) {
        console.error('Error fetching products:', error);
        throw new Error('Failed to fetch market data');
    }

    // 2. Prepare data for Claude
    const productsContext = products?.map(p => ({
        id: p.id,
        name: p.name,
        tagline: p.tagline,
        description: p.description,
        votes: p.votes_count,
        icp: p.ai_analysis?.icp || 'Unknown',
        problem: p.ai_analysis?.problem || 'Unknown'
    })).slice(0, 30); // Limit context window

    const prompt = `
    You are a brutally honest startup validator and market analyst. 
    
    User's Idea:
    - Target Audience (ICP): ${icp}
    - Problem Solved: ${problem}
    - Niche/Category: ${niche || 'General'}

    Here is a list of potential competitors/existing solutions in the market (from Product Hunt):
    ${JSON.stringify(productsContext)}

    Analyze this idea against the market data.
    
    Tasks:
    1. Identify the top 3-5 most relevant direct or indirect competitors from the provided list.
    2. Evaluate the idea's potential (Verdict).
    3. Suggest differentiation strategies.
    4. Identify risks.

    Return a JSON object with this structure:
    {
      "verdict": "Strong Potential" | "High Competition" | "Niche Opportunity" | "Needs Refinement",
      "score": <number 0-100>,
      "summary": "<2-3 sentences explaining the verdict>",
      "competitors": [
        {
          "id": "<product_id_from_list>",
          "relevance_score": <number 0-100>,
          "relevance_reason": "<why is this a competitor?>"
        }
      ],
      "differentiation_opportunities": ["<point 1>", "<point 2>", "<point 3>"],
      "market_risks": ["<risk 1>", "<risk 2>"],
      "target_audience_feedback": "<analysis of the ICP fit>"
    }
  `;

    try {
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 2048,
            messages: [{ role: 'user', content: prompt }],
        });

        const content = response.content[0].type === 'text' ? response.content[0].text : '';
        const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(jsonStr);

        // Merge AI analysis with full product details
        const analyzedCompetitors = analysis.competitors.map((c: any) => {
            const original = products?.find(p => p.id === c.id);
            return {
                ...original,
                relevance_score: c.relevance_score,
                relevance_reason: c.relevance_reason
            };
        }).filter((c: any) => c.name); // Filter out any not found

        return {
            ...analysis,
            competitors: analyzedCompetitors
        };

    } catch (error) {
        console.error('Error validating idea:', error);
        throw new Error('Failed to analyze idea');
    }
}
