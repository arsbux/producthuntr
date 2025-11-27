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
    growth_health: {
        score: number;
        verdict: 'Build' | 'Iterate' | 'Launch' | 'Pause';
        sub_scores: {
            demand: number;
            messaging: number;
            distribution: number;
            engagement: number;
        };
        summary: string;
    };
    competitor_grid: {
        id: string;
        name: string;
        rank_history: number[]; // Sparkline data
        monthly_mentions: number;
        top_channel: string;
        engagement_score: number;
        estimated_traction: string;
        website_url?: string;
        thumbnail_url?: string;
    }[];
    messaging_decoder: {
        top_phrases: { text: string; value: number }[];
        headline_variants: { text: string; predicted_ctr: string }[];
        gaps: string[];
    };
    channel_radar: {
        sources: { name: string; value: number }[]; // For Radar/Sankey
        roi_predictions: { channel: string; roi: string }[];
    };
    tactics_library: {
        title: string;
        description: string;
        evidence: string;
    }[];
    next_action: string;
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

    // 1. Fetch potential competitors from Supabase (Historical & Live)

    // A. Historical Giants (Top voted of all time)
    const { data: historicalProducts, error: historicalError } = await supabase
        .from('ph_launches')
        .select('id, name, tagline, description, votes_count, website_url, thumbnail_url, ai_analysis, created_at')
        .order('votes_count', { ascending: false })
        .limit(15);

    if (historicalError) {
        console.error('Error fetching historical products:', historicalError);
    }

    // B. Live/Recent Trends (Launched in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentProducts, error: recentError } = await supabase
        .from('ph_launches')
        .select('id, name, tagline, description, votes_count, website_url, thumbnail_url, ai_analysis, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('votes_count', { ascending: false })
        .limit(15);

    if (recentError) {
        console.error('Error fetching recent products:', recentError);
    }

    // Combine and Deduplicate
    const allProducts = [...(historicalProducts || []), ...(recentProducts || [])];
    const uniqueProducts = Array.from(new Map(allProducts.map(item => [item.id, item])).values());

    const products = uniqueProducts;

    // 2. Prepare data for Claude
    const productsContext = products?.map(p => ({
        id: p.id,
        name: p.name,
        tagline: p.tagline,
        description: p.description,
        votes: p.votes_count,
        icp: p.ai_analysis?.icp || 'Unknown',
        problem: p.ai_analysis?.problem || 'Unknown'
    })).slice(0, 20);

    const prompt = `
    You are a Growth Engineer and Data Scientist.
    
    User's Project:
    - ICP: ${icp}
    - Problem: ${problem}
    - Niche: ${niche || 'General'}

    Market Data (Competitors):
    ${JSON.stringify(productsContext)}

    Generate a "Growth Workbench" analysis.
    
    Tasks:
    1. Calculate a "Growth Health" score (0-100) based on market demand and competition.
    2. Analyze competitors to create a "Competitor Grid" with estimated traction and engagement.
    3. Decode messaging: extract top phrases and generate high-CTR headline variants.
    4. Predict the best growth channels (Channel Radar).
    5. Suggest data-backed tactics (Tactics Library).

    Return ONLY the JSON object with this EXACT structure. Do not include any introductory text or markdown formatting.
    {
      "growth_health": {
        "score": <number>,
        "verdict": "Build" | "Iterate" | "Launch" | "Pause",
        "sub_scores": { "demand": <num>, "messaging": <num>, "distribution": <num>, "engagement": <num> },
        "summary": "<short summary>"
      },
      "competitor_grid": [
        {
          "id": "<product_id>",
          "rank_history": [<num>, <num>, <num>, <num>, <num>], // 5 random numbers for sparkline
          "monthly_mentions": <number>,
          "top_channel": "<channel name>",
          "engagement_score": <number 0-100>,
          "estimated_traction": "<e.g. 10k users>"
        }
      ],
      "messaging_decoder": {
        "top_phrases": [{ "text": "<phrase>", "value": <num> }],
        "headline_variants": [{ "text": "<headline>", "predicted_ctr": "+<num>%" }],
        "gaps": ["<gap 1>", "<gap 2>"]
      },
      "channel_radar": {
        "sources": [{ "name": "Product Hunt", "value": <num> }, { "name": "Twitter", "value": <num> }, ...],
        "roi_predictions": [{ "channel": "<name>", "roi": "<val>" }]
      },
      "tactics_library": [
        { "title": "<tactic name>", "description": "<desc>", "evidence": "<data proof>" }
      ],
      "next_action": "<one liner next step>"
    }
  `;

    try {
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 4000,
            messages: [{ role: 'user', content: prompt }],
        });

        const content = response.content[0].type === 'text' ? response.content[0].text : '';

        // Robust JSON extraction
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : content;

        const analysis = JSON.parse(jsonStr);

        // Merge AI analysis with full product details for the grid
        const enrichedGrid = analysis.competitor_grid.map((c: any) => {
            const original = products?.find(p => p.id === c.id);
            return {
                ...c,
                name: original?.name || c.id,
                website_url: original?.website_url,
                thumbnail_url: original?.thumbnail_url
            };
        });

        return {
            ...analysis,
            competitor_grid: enrichedGrid
        };

    } catch (error) {
        console.error('Error validating idea:', error);
        throw new Error('Failed to analyze idea');
    }
}

// Tool Definitions
const TOOLS = [
    {
        name: "search_products",
        description: "Search for products in the internal database by keyword. Returns details including name, description, and upvotes (votes_count). Results are sorted by popularity (votes) by default to ensure quality.",
        input_schema: {
            type: "object",
            properties: {
                query: { type: "string", description: "Search keywords" },
                limit: { type: "number", description: "Number of results (default 10)" },
                min_votes: { type: "number", description: "Minimum upvotes required (default 50 to filter noise)" }
            },
            required: ["query"]
        }
    },
    {
        name: "search_web",
        description: "Search the live web for information. Use this ONLY when the internal database ('search_products') returns no relevant results or when you need recent external context (e.g., news, competitor pricing, blog posts).",
        input_schema: {
            type: "object",
            properties: {
                query: { type: "string", description: "The search query for the web." }
            },
            required: ["query"]
        }
    },
    {
        name: "get_top_products",
        description: "Get the top products sorted by upvotes (popularity). Use this for queries like 'most upvoted', 'top products', 'best of all time', or 'most popular'.",
        input_schema: {
            type: "object",
            properties: {
                limit: { type: "number", description: "Number of results (default 10)" },
                time_range: { type: "string", enum: ["all_time", "this_month", "this_week", "today"], description: "Time range for the query (default: all_time)" }
            }
        }
    },
    {
        name: "get_vote_snapshots",
        description: "Get historical vote snapshots for a specific product to analyze growth trends over time. Use this when you need to see how a product grew.",
        input_schema: {
            type: "object",
            properties: {
                product_id: { type: "string", description: "The ID of the product (from ph_launches)" },
                limit: { type: "number", description: "Number of snapshots to return (default 20)" }
            },
            required: ["product_id"]
        }
    },
    {
        name: "get_category_distribution",
        description: "Get the distribution of products across different categories/niches. Useful for 'Category Split' or understanding market composition.",
        input_schema: {
            type: "object",
            properties: {
                limit: { type: "number", description: "Number of top categories to return (default 10)" }
            }
        }
    },
    {
        name: "get_market_gaps",
        description: "Analyze the market to find 'Blue Ocean' opportunities where demand (upvotes) is high but supply (product count) is low.",
        input_schema: {
            type: "object",
            properties: {
                limit: { type: "number", description: "Number of gaps to return (default 20)" }
            }
        }
    },
    {
        name: "generate_report",
        description: "Finalize the analysis and generate the report for the user. Call this tool when you have gathered enough information.",
        input_schema: {
            type: "object",
            properties: {
                answer: { type: "string", description: "The main answer to the user's query (Markdown supported)." },
                visualization: {
                    type: "object",
                    description: "Data for a chart to visualize the insights.",
                    properties: {
                        type: { type: "string", enum: ["bar", "line", "radar", "pie", "scatter", "radial_bar", "multi_line"] },
                        title: { type: "string" },
                        description: { type: "string" },
                        data: {
                            type: "array",
                            items: {
                                type: "object",
                                additionalProperties: true
                            }
                        },
                        dataKey: { type: "string", description: "Primary data key for values" },
                        categoryKey: { type: "string", description: "Key for X-axis or categories" },
                        seriesKeys: {
                            type: "array",
                            items: { type: "string" },
                            description: "For multi_line charts, list the keys for each line (e.g. product names)"
                        }
                    },
                    required: ["type", "title", "data", "dataKey", "categoryKey"]
                },
                trends: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                            growth: { type: "string" },
                            sentiment: { type: "string", enum: ["positive", "neutral", "negative"] }
                        }
                    }
                },
                related_product_ids: {
                    type: "array",
                    items: { type: "string" },
                    description: "IDs of the products found in the search that are relevant."
                }
            },
            required: ["answer", "trends", "related_product_ids"]
        }
    }
];

export interface IntelligenceResult {
    answer: string;
    visualization: {
        type: 'bar' | 'line' | 'radar' | 'pie' | 'scatter' | 'radial_bar' | 'multi_line';
        title: string;
        data: any[];
        dataKey: string;
        categoryKey: string;
        seriesKeys?: string[];
        description: string;
    } | null;
    trends: {
        name: string;
        growth: string; // e.g. "+45%"
        sentiment: 'positive' | 'neutral' | 'negative';
    }[];
    related_products: Competitor[];
}

export async function askGrowthIntelligence(query: string): Promise<IntelligenceResult> {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');
    if (!anthropic) anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const messages: any[] = [{ role: 'user', content: query }];
    let turnCount = 0;
    const MAX_TURNS = 12; // Increased max turns for deeper analysis

    try {
        while (turnCount < MAX_TURNS) {
            turnCount++;
            console.log(`[Agent] Turn ${turnCount}`);

            const response = await anthropic.messages.create({
                model: 'claude-3-haiku-20240307',
                max_tokens: 4000,
                tools: TOOLS as any,
                messages: messages,
                system: `You are a Growth Intelligence Agent for a Product Hunt Analytics Platform.
                
                CORE MISSION:
                Your goal is to provide intelligence specifically about the Product Hunt ecosystem. 
                Every answer MUST be grounded in or related to Product Hunt data.
                This is NOT a general market research tool; it is a Product Hunt intelligence tool.

                Table Schema:
                1. 'ph_launches' (Main Product Data):
                - id: Unique ID (text)
                - name: Product Name
                - tagline: Short catchphrase
                - description: Full description
                - votes_count: Total upvotes (int) - IMPORTANT: Higher is better/more popular.
                - comments_count: Total comments (int)
                - topics: Array of tags/topics (_text)
                - makers: Maker info (jsonb)
                - created_at: Launch date (timestamptz)
                - ai_analysis: JSONB containing { niche, icp, problem, solution_type }
                
                2. 'vote_snapshots' (Time-series Data):
                - product_id: Link to ph_launches.id
                - votes_count: Votes at that snapshot time
                - snapshot_time: When the snapshot was taken
                
                EXECUTION STRATEGY:
                1. **ALWAYS START WITH INTERNAL DATA**: Use 'search_products', 'get_top_products', etc. first.
                2. **WEB SEARCH AS SUPPORT**: Use 'search_web' ONLY to:
                   - Find details about a specific Product Hunt launch that is missing metadata.
                   - Understand the broader market context of a Product Hunt niche.
                   - Find competitors to a Product Hunt launch.
                3. **VERIFY WITH PRODUCT HUNT DATA**: If you find insights on the web, you MUST verify them against the internal database.
                   - **Validate Trends**: If the web says "AI Agents are trending", check the DB. Do we see a spike in "AI Agent" products?
                   - **Compare Data**: If the web mentions a competitor, find the closest Product Hunt equivalent and compare their performance (votes, comments).
                   - **Refute if Needed**: If the web hype doesn't match the Product Hunt reality, say so. (e.g., "While the web hypes X, our data shows low engagement for X on Product Hunt.")
                
                CRITICAL RULES:
                - **NEVER** give a generic market research answer without mentioning Product Hunt data.
                - If the user asks about a topic (e.g. "No-code"), SHOW THE PRODUCT HUNT DATA for that topic (top products, trends, gaps).
                - If the user asks about a specific product not in the DB, say: "I couldn't find [Product] in our Product Hunt database, but..." and then relate it to similar PH products.
                
                VISUALIZATION RULES:
                - Use 'scatter' for Market Gaps (Volume vs Demand).
                - Use 'radial_bar' for Category Splits.
                - Use 'multi_line' for comparing growth of multiple products.`
            });

            // Add assistant response to history
            messages.push({ role: 'assistant', content: response.content });

            // Check for tool use
            const toolUseBlocks = response.content.filter(c => c.type === 'tool_use');

            if (toolUseBlocks.length > 0) {
                for (const toolUseBlock of toolUseBlocks) {
                    if (toolUseBlock.type !== 'tool_use') continue;

                    const toolName = toolUseBlock.name;
                    const toolInput = toolUseBlock.input as any;
                    const toolId = toolUseBlock.id;

                    console.log(`[Agent] Calling tool: ${toolName}`);

                    let toolResult;

                    if (toolName === 'search_products') {
                        // Execute DB Search
                        let queryBuilder = supabase
                            .from('ph_launches')
                            .select('id, name, tagline, description, votes_count, created_at')
                            .or(`name.ilike.%${toolInput.query}%,description.ilike.%${toolInput.query}%`)
                            .order('votes_count', { ascending: false })
                            .limit(toolInput.limit || 10);

                        if (toolInput.min_votes) {
                            queryBuilder = queryBuilder.gte('votes_count', toolInput.min_votes);
                        }

                        const { data } = await queryBuilder;
                        toolResult = JSON.stringify(data || []);
                    } else if (toolName === 'search_web') {
                        // Execute Web Search (Tavily)
                        const apiKey = process.env.TAVILY_API_KEY;
                        if (!apiKey) {
                            toolResult = JSON.stringify({ error: "Web search is not configured. Please add TAVILY_API_KEY to your environment variables." });
                        } else {
                            try {
                                const response = await fetch('https://api.tavily.com/search', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({
                                        api_key: apiKey,
                                        query: toolInput.query,
                                        search_depth: "advanced",
                                        include_answer: true,
                                        max_results: 5
                                    })
                                });
                                const data = await response.json();
                                toolResult = JSON.stringify(data);
                            } catch (err) {
                                console.error('Tavily search failed:', err);
                                toolResult = JSON.stringify({ error: "Failed to perform web search." });
                            }
                        }

                    } else if (toolName === 'get_top_products') {
                        // Execute Top Products Query
                        let queryBuilder = supabase
                            .from('ph_launches')
                            .select('id, name, tagline, description, votes_count, created_at')
                            .order('votes_count', { ascending: false })
                            .limit(toolInput.limit || 10);

                        if (toolInput.time_range === 'this_month') {
                            const d = new Date(); d.setDate(1);
                            queryBuilder = queryBuilder.gte('created_at', d.toISOString());
                        } else if (toolInput.time_range === 'this_week') {
                            const d = new Date(); d.setDate(d.getDate() - 7);
                            queryBuilder = queryBuilder.gte('created_at', d.toISOString());
                        } else if (toolInput.time_range === 'today') {
                            const d = new Date(); d.setHours(0, 0, 0, 0);
                            queryBuilder = queryBuilder.gte('created_at', d.toISOString());
                        }

                        const { data } = await queryBuilder;
                        toolResult = JSON.stringify(data || []);

                    } else if (toolName === 'get_vote_snapshots') {
                        // Execute Vote Snapshots Query
                        const { data } = await supabase
                            .from('vote_snapshots')
                            .select('votes_count, snapshot_time')
                            .eq('product_id', toolInput.product_id)
                            .order('snapshot_time', { ascending: true })
                            .limit(toolInput.limit || 20);

                        toolResult = JSON.stringify(data || []);

                    } else if (toolName === 'get_category_distribution') {
                        // Aggregation for categories
                        const { data } = await supabase
                            .from('ph_launches')
                            .select('ai_analysis')
                            .not('ai_analysis', 'is', null);

                        const distribution = new Map<string, number>();
                        data?.forEach((row: any) => {
                            const niche = row.ai_analysis?.niche || 'Other';
                            distribution.set(niche, (distribution.get(niche) || 0) + 1);
                        });

                        const sorted = Array.from(distribution.entries())
                            .map(([name, value]) => ({ name, value }))
                            .sort((a, b) => b.value - a.value)
                            .slice(0, toolInput.limit || 10);

                        toolResult = JSON.stringify(sorted);

                    } else if (toolName === 'get_market_gaps') {
                        // Market Gap Logic (Simplified version of charts-data.ts)
                        const { data } = await supabase
                            .from('ph_launches')
                            .select('votes_count, comments_count, ai_analysis')
                            .not('ai_analysis', 'is', null);

                        const combinationMap = new Map<string, {
                            icp: string;
                            problem: string;
                            niche: string;
                            count: number;
                            totalEngagement: number;
                        }>();

                        data?.forEach((launch: any) => {
                            const icp = launch.ai_analysis?.icp;
                            const problem = launch.ai_analysis?.problem;
                            const niche = launch.ai_analysis?.niche;
                            if (!icp || !problem) return;

                            const key = `${icp}|${problem}`;
                            if (!combinationMap.has(key)) {
                                combinationMap.set(key, { icp, problem, niche, count: 0, totalEngagement: 0 });
                            }
                            const entry = combinationMap.get(key)!;
                            entry.count++;
                            entry.totalEngagement += (launch.votes_count || 0);
                        });

                        const gaps = Array.from(combinationMap.values())
                            .map(d => ({
                                name: d.niche, // For chart label
                                icp: d.icp,
                                problem: d.problem,
                                launchVolume: d.count,
                                avgUpvotes: Math.round(d.totalEngagement / d.count),
                                opportunityScore: Math.round((d.totalEngagement / d.count) * 0.6 + (10 - d.count) * 50)
                            }))
                            .sort((a, b) => b.opportunityScore - a.opportunityScore)
                            .slice(0, toolInput.limit || 20);

                        toolResult = JSON.stringify(gaps);

                    } else if (toolName === 'generate_report') {
                        // Final Result
                        const report = toolInput;

                        // Hydrate related products for the UI
                        const { data: relatedProducts } = await supabase
                            .from('ph_launches')
                            .select('id, name, tagline, description, votes_count, website_url, thumbnail_url, created_at')
                            .in('id', report.related_product_ids || []);

                        return {
                            answer: report.answer,
                            visualization: report.visualization,
                            trends: report.trends || [],
                            related_products: relatedProducts || []
                        };
                    }

                    // Add tool result to history
                    messages.push({
                        role: 'user',
                        content: [
                            {
                                type: 'tool_result',
                                tool_use_id: toolId,
                                content: toolResult
                            }
                        ]
                    });
                }

            } else {
                // No tool used, maybe just text.
                // We'll treat this as the final answer to prevent loops.
                const textBlock = response.content.find(c => c.type === 'text');
                if (textBlock && textBlock.type === 'text') {
                    console.log('[Agent] AI returned text only, treating as final answer.');
                    return {
                        answer: textBlock.text,
                        visualization: null,
                        trends: [],
                        related_products: []
                    };
                }
            }
        }

        throw new Error('Agent exceeded max turns without generating a report.');

    } catch (error) {
        console.error('Error in askGrowthIntelligence:', error);
        return {
            answer: `### Analysis System Error\n\nI was unable to process your request.\n\n**Error Details:**\n${error instanceof Error ? error.message : 'Unknown error'}`,
            visualization: null,
            trends: [],
            related_products: []
        };
    }
}
