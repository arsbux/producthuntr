import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Anthropic client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { niche } = await request.json();

        if (!niche) {
            return NextResponse.json({ error: 'Niche is required' }, { status: 400 });
        }

        // 1. Fetch Top 60 Products for the Niche
        // Try matching by ai_analysis->niche (most accurate for this app)
        let { data: products, error } = await supabase
            .from('ph_launches')
            .select('name, tagline, votes_count, comments_count, topics, description, ai_analysis')
            .contains('ai_analysis', { niche: niche })
            .order('votes_count', { ascending: false })
            .limit(60);

        let analyzedProducts = products || [];

        // Fallback: Try matching by topics if ai_analysis match fails
        if (analyzedProducts.length < 5) {
            const { data: fallbackProducts } = await supabase
                .from('ph_launches')
                .select('name, tagline, votes_count, comments_count, topics, description, ai_analysis')
                .contains('topics', JSON.stringify([{ name: niche }]))
                .order('votes_count', { ascending: false })
                .limit(60);

            if (fallbackProducts && fallbackProducts.length > analyzedProducts.length) {
                analyzedProducts = fallbackProducts;
            }
        }

        // Second Fallback: Text search
        if (analyzedProducts.length < 5) {
            const { data: textSearchProducts } = await supabase
                .from('ph_launches')
                .select('name, tagline, votes_count, comments_count, topics, description, ai_analysis')
                .textSearch('topics', `'${niche}'`)
                .order('votes_count', { ascending: false })
                .limit(60);

            if (textSearchProducts && textSearchProducts.length > analyzedProducts.length) {
                analyzedProducts = textSearchProducts;
            }
        }

        if (analyzedProducts.length < 5) {
            return NextResponse.json({ error: 'Not enough data for analysis' }, { status: 404 });
        }

        // 2. Prepare Context for Claude
        const top10 = analyzedProducts.slice(0, 10);
        const rest = analyzedProducts.slice(10);

        const avgVotesTop10 = top10.reduce((sum, p) => sum + (p.votes_count || 0), 0) / top10.length;
        const avgVotesRest = rest.length > 0 ? rest.reduce((sum, p) => sum + (p.votes_count || 0), 0) / rest.length : avgVotesTop10 / 2;
        const multiplier = (avgVotesTop10 / avgVotesRest).toFixed(1);

        const productsContext = top10.map(p =>
            `- ${p.name}: ${p.tagline} (${p.votes_count} votes). Desc: ${p.description?.substring(0, 100)}...`
        ).join('\n');

        // 3. Call Claude Haiku
        const prompt = `
      You are an expert product analyst. Analyze these top performing products in the "${niche}" niche on Product Hunt.
      
      Top 10 Products Context:
      ${productsContext}
      
      Statistical Context:
      - Top 10 Avg Votes: ${Math.round(avgVotesTop10)}
      - Rest of Market Avg Votes: ${Math.round(avgVotesRest)}
      - Performance Multiplier: ${multiplier}x

      Task: Identify the critical "Success Factors" that separate these top winners. Write a 2-paragraph analysis.
      - Paragraph 1: Focus on the primary value proposition or problem-solving approach that is winning.
      - Paragraph 2: Focus on execution details, community strategy, or specific features that drive engagement.

      Return a JSON object with exactly this structure (no markdown, just JSON):
      {
        "engagementGap": {
          "value": "${multiplier}x",
          "label": "more upvotes"
        },
        "brief": {
          "paragraph1": "First paragraph of analysis...",
          "paragraph2": "Second paragraph of analysis..."
        },
        "key_insight": "Short 3-5 word highlight (e.g. 'Community-Led Growth')"
      }
    `;

        const message = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 300,
            messages: [{ role: 'user', content: prompt }],
        });

        // Parse Response
        const content = message.content[0].type === 'text' ? message.content[0].text : '{}';

        let analysis;
        try {
            // Robustly extract JSON object
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? jsonMatch[0] : '{}';
            analysis = JSON.parse(jsonString);
        } catch (e) {
            console.error('Failed to parse AI response:', content);
            analysis = {
                engagementGap: { value: "N/A", label: "unavailable" },
                brief: {
                    paragraph1: "Analysis currently unavailable.",
                    paragraph2: "Please try again later."
                },
                key_insight: "Analysis Failed"
            };
        }

        return NextResponse.json(analysis);

    } catch (error: any) {
        console.error('AI Analysis Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to analyze niche' },
            { status: 500 }
        );
    }
}
