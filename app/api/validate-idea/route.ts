import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function getAnthropicClient() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY not set');
    }
    return new Anthropic({ apiKey });
}

export async function POST(request: Request) {
    try {
        const { icp, problem, niche } = await request.json();

        if (!icp || !problem) {
            return NextResponse.json(
                { error: 'ICP and problem are required' },
                { status: 400 }
            );
        }

        // Fetch all launches from database
        const { data: launches, error: dbError } = await supabase
            .from('ph_launches')
            .select('name, tagline, votes_count, comments_count, ai_analysis, launched_at')
            .not('ai_analysis', 'is', null);

        if (dbError || !launches) {
            throw new Error('Failed to fetch market data');
        }

        // Filter similar products
        const similarProducts = launches.filter(l => {
            const analysis = l.ai_analysis;
            const icpMatch = analysis?.icp?.toLowerCase().includes(icp.toLowerCase()) ||
                icp.toLowerCase().includes(analysis?.icp?.toLowerCase());
            const problemMatch = analysis?.problem?.toLowerCase().includes(problem.toLowerCase()) ||
                problem.toLowerCase().includes(analysis?.problem?.toLowerCase());
            const nicheMatch = !niche || analysis?.niche?.toLowerCase().includes(niche.toLowerCase()) ||
                niche.toLowerCase().includes(analysis?.niche?.toLowerCase());

            return (icpMatch || problemMatch) && nicheMatch;
        }).slice(0, 20); // Top 20 similar products

        // Calculate market stats
        const totalProducts = launches.length;
        const directCompetitors = similarProducts.length;
        const avgVotes = similarProducts.length > 0
            ? Math.round(similarProducts.reduce((sum, p) => sum + (p.votes_count || 0), 0) / similarProducts.length)
            : 0;
        const topPerformer = similarProducts.sort((a, b) => (b.votes_count || 0) - (a.votes_count || 0))[0];

        // Prepare data for AI analysis
        const marketContext = {
            userIdea: { icp, problem, niche: niche || 'Not specified' },
            totalProductsAnalyzed: totalProducts,
            directCompetitors: directCompetitors,
            similarProducts: similarProducts.slice(0, 10).map(p => ({
                name: p.name,
                tagline: p.tagline,
                votes: p.votes_count,
                icp: p.ai_analysis?.icp,
                problem: p.ai_analysis?.problem,
                niche: p.ai_analysis?.niche,
            })),
            marketStats: {
                avgVotes,
                topPerformer: topPerformer ? {
                    name: topPerformer.name,
                    votes: topPerformer.votes_count,
                } : null,
            },
        };

        // Get AI analysis
        const anthropic = getAnthropicClient();
        const completion = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 2000,
            messages: [{
                role: 'user',
                content: `You are a startup validation expert analyzing Product Hunt data. Based on the following market data, provide a comprehensive validation analysis for this startup idea.

USER'S IDEA:
- Target Audience (ICP): ${icp}
- Problem Solving: ${problem}
- Niche/Category: ${niche || 'Not specified'}

MARKET DATA:
- Total products analyzed: ${totalProducts}
- Direct competitors found: ${directCompetitors}
- Average votes for similar products: ${avgVotes}
- Top performer: ${topPerformer ? `${topPerformer.name} (${topPerformer.votes_count} votes)` : 'N/A'}

SIMILAR PRODUCTS:
${similarProducts.slice(0, 5).map((p, i) => `${i + 1}. ${p.name} - ${p.tagline} (${p.votes_count} votes)`).join('\n')}

Provide a structured analysis in JSON format with these fields:
{
  "verdict": "STRONG_GO" | "CAUTIOUS_GO" | "PIVOT_RECOMMENDED" | "RED_FLAG",
  "verdictTitle": "A catchy one-line verdict",
  "overallScore": 0-100,
  "marketSaturation": "LOW" | "MEDIUM" | "HIGH",
  "competitionLevel": "LOW" | "MEDIUM" | "HIGH",
  "opportunityScore": 0-100,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "risks": ["risk 1", "risk 2", "risk 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "uniqueAngle": "What unique angle should they focus on to stand out",
  "estimatedTraction": "Expected vote range if launched today",
  "summary": "2-3 sentence executive summary"
}

Be honest, data-driven, and actionable. If there's high competition, suggest how to differentiate.`
            }],
        });

        const aiResponse = completion.content[0].type === 'text' ? completion.content[0].text : '';

        // Parse AI response
        let analysis;
        try {
            // Extract JSON from response
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (parseError) {
            // Fallback if JSON parsing fails
            analysis = {
                verdict: 'CAUTIOUS_GO',
                verdictTitle: 'Analysis Complete',
                overallScore: 70,
                marketSaturation: directCompetitors > 10 ? 'HIGH' : directCompetitors > 5 ? 'MEDIUM' : 'LOW',
                competitionLevel: directCompetitors > 10 ? 'HIGH' : directCompetitors > 5 ? 'MEDIUM' : 'LOW',
                opportunityScore: Math.max(0, 100 - (directCompetitors * 5)),
                strengths: ['Market exists', 'Clear problem', 'Defined audience'],
                risks: ['Competition present', 'Market validation needed'],
                recommendations: ['Focus on differentiation', 'Build MVP quickly', 'Talk to users'],
                uniqueAngle: 'Find your unique positioning',
                estimatedTraction: `${Math.max(50, avgVotes - 50)}-${avgVotes + 100} votes`,
                summary: aiResponse.substring(0, 300),
            };
        }

        return NextResponse.json({
            success: true,
            analysis,
            marketData: {
                totalProducts,
                directCompetitors,
                avgVotes,
                topPerformer: topPerformer ? {
                    name: topPerformer.name,
                    votes: topPerformer.votes_count,
                } : null,
                similarProducts: similarProducts.slice(0, 5).map(p => ({
                    name: p.name,
                    votes: p.votes_count,
                    icp: p.ai_analysis?.icp,
                })),
            },
        });

    } catch (error: any) {
        console.error('Validation error:', error);
        return NextResponse.json(
            { error: error.message || 'Validation failed' },
            { status: 500 }
        );
    }
}
