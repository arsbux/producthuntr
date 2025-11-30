'use server';

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import * as ChartsData from '@/lib/charts-data';

// Initialize Supabase client for server-side usage
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

let anthropic: Anthropic | null = null;

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

export interface IntelligenceResult {
    answer: string;
    visualization: {
        type: 'bar' | 'line' | 'radar' | 'pie' | 'scatter' | 'radial_bar' | 'multi_line' | 'treemap' | 'heatmap';
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

// Tool Definitions
const TOOLS = [
    {
        name: "search_products",
        description: "Search for products in the internal database by keyword. Returns details including name, description, and upvotes. Use this to find specific products or examples.",
        input_schema: {
            type: "object",
            properties: {
                query: { type: "string", description: "Search keywords" },
                limit: { type: "number", description: "Number of results (default 10)" },
                min_votes: { type: "number", description: "Minimum upvotes required (default 50)" }
            },
            required: ["query"]
        }
    },
    {
        name: "get_topic_velocity",
        description: "Analyze the growth trend of different topics/niches over time. Returns formatted 'chartData' suitable for multi-line charts (month vs topic volume).",
        input_schema: {
            type: "object",
            properties: {
                months: { type: "number", description: "Number of months to analyze (default 12)" }
            }
        }
    },
    {
        name: "get_market_treemap",
        description: "Get a hierarchical view of the market landscape. Returns a tree structure suitable for Treemaps. Useful for 'Market Overview'.",
        input_schema: {
            type: "object",
            properties: {}
        }
    },
    {
        name: "get_keyword_trends",
        description: "Analyze the trend of a specific keyword. Returns 'chartData' array suitable for line charts (month vs count/upvotes).",
        input_schema: {
            type: "object",
            properties: {
                keyword: { type: "string", description: "The keyword to analyze (e.g., 'AI', 'Notion', 'Crypto')" },
                months: { type: "number", description: "Number of months (default 12)" }
            },
            required: ["keyword"]
        }
    },
    {
        name: "get_category_performance",
        description: "Get a performance matrix of all categories. Returns array suitable for Scatter or Bar charts.",
        input_schema: {
            type: "object",
            properties: {}
        }
    },
    {
        name: "get_niche_histogram",
        description: "Get the distribution of success (upvotes) for a specific niche. Returns histogram data.",
        input_schema: {
            type: "object",
            properties: {
                niche: { type: "string", description: "The niche category name (e.g., 'Developer Tools', 'Productivity')" }
            },
            required: ["niche"]
        }
    },
    {
        name: "get_product_scatter",
        description: "Get scatter plot data (Votes vs Comments) for products in a category.",
        input_schema: {
            type: "object",
            properties: {
                category: { type: "string", description: "Optional category to filter by" }
            }
        }
    },
    {
        name: "get_feature_correlation",
        description: "Analyze which features or keywords correlate with higher upvotes. Returns bar chart data.",
        input_schema: {
            type: "object",
            properties: {
                category: { type: "string", description: "The category to analyze" }
            },
            required: ["category"]
        }
    },
    {
        name: "get_launch_time_heatmap",
        description: "Analyze the best times to launch. Returns heatmap data (day, hour, value).",
        input_schema: {
            type: "object",
            properties: {}
        }
    },
    {
        name: "get_market_gap_matrix",
        description: "Find 'Blue Ocean' opportunities. Returns scatter plot data for Market Gaps.",
        input_schema: {
            type: "object",
            properties: {}
        }
    },
    {
        name: "search_web",
        description: "Search the live web for external context. Use ONLY when internal data is insufficient.",
        input_schema: {
            type: "object",
            properties: {
                query: { type: "string", description: "The search query" }
            },
            required: ["query"]
        }
    },
    {
        name: "generate_report",
        description: "Finalize the analysis and generate the report. Call this when you have enough data.",
        input_schema: {
            type: "object",
            properties: {
                answer: { type: "string", description: "The comprehensive answer to the user's query (Markdown supported)." },
                visualization: {
                    type: "object",
                    description: "Configuration for the primary chart.",
                    properties: {
                        type: { type: "string", enum: ["bar", "line", "radar", "pie", "scatter", "radial_bar", "multi_line", "treemap", "heatmap"] },
                        title: { type: "string" },
                        description: { type: "string" },
                        data: {
                            type: "array",
                            items: { type: "object", additionalProperties: true }
                        },
                        dataKey: { type: "string" },
                        categoryKey: { type: "string" },
                        seriesKeys: { type: "array", items: { type: "string" } }
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
                    description: "IDs of relevant products found during analysis. These will be displayed as cards below the result."
                }
            },
            required: ["answer", "trends", "related_product_ids"]
        }
    }
];

export async function askGrowthIntelligence(query: string): Promise<IntelligenceResult> {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');
    if (!anthropic) anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Prepend instruction to force tool usage
    const enhancedQuery = `${query}

IMPORTANT: You MUST use data analysis tools to answer this query. Do not respond with text only. Use tools like get_topic_velocity, search_products, or other relevant tools, then call generate_report with a visualization.`;

    const messages: any[] = [{ role: 'user', content: enhancedQuery }];
    let turnCount = 0;
    const MAX_TURNS = 15;

    try {
        while (turnCount < MAX_TURNS) {
            turnCount++;
            console.log(`[Agent] Turn ${turnCount}`);

            const response = await anthropic.messages.create({
                model: 'claude-3-haiku-20240307',
                max_tokens: 4000,
                tools: TOOLS as any,
                messages: messages,
                system: `You are the "AI Data Analysis Agent" for ProductHuntr.
                
                🚨 CRITICAL REQUIREMENTS 🚨
                1. **EVERY response MUST include a data visualization.** No exceptions. A response without a chart fails the user.
                2. **EVERY response MUST include at least 2 trend insights.**
                3. **EVERY response MUST include related products when applicable.**
                4. **ALWAYS use real data from tools.** Never make up numbers or charts.

                WORKFLOW FOR EVERY QUERY:
                
                Step 1: UNDERSTAND the user's question
                - What category/niche are they asking about?
                - What timeframe? (default to 12 months if not specified)
                - Do they want trends, comparisons, or opportunities?

                Step 2: SELECT THE RIGHT TOOL
                - Topic comparison? → get_topic_velocity
                - Specific keyword trend? → get_keyword_trends
                - Market overview? → get_market_treemap
                - Best launch times? → get_launch_time_heatmap
                - Market gaps? → get_market_gap_matrix
                - Category performance? → get_category_performance
                - Product examples? → search_products

                Step 3: FETCH DATA
                - Call the tool(s) you selected
                - If you need product examples, also call search_products

                Step 4: GENERATE REPORT
                - Call 'generate_report' with:
                  - answer: Your analysis in Markdown
                  - visualization: The chart configuration (MANDATORY)
                  - trends: At least 2 insights with growth percentages
                  - related_product_ids: IDs from search_products

                🎨 CHART CONFIGURATION GUIDE:

                📊 get_topic_velocity → Multi-Line Chart
                {
                  "type": "multi_line",
                  "title": "Topic Growth Comparison",
                  "description": "Monthly launch volume",
                  "data": toolResult.chartData,
                  "categoryKey": "month",
                  "dataKey": "launchCount",
                  "seriesKeys": toolResult.topics
                }

                📈 get_keyword_trends → Line Chart
                {
                  "type": "line",
                  "title": "Keyword Trend: [KEYWORD]",
                  "description": "Monthly mentions",
                  "data": toolResult.chartData,
                  "categoryKey": "month",
                  "dataKey": "count"
                }

                🗂️ get_market_treemap → Treemap
                {
                  "type": "treemap",
                  "title": "Market Landscape",
                  "description": "Category sizes",
                  "data": toolResult.children,
                  "categoryKey": "name",
                  "dataKey": "size"
                }

                🔥 get_launch_time_heatmap → Heatmap
                {
                  "type": "heatmap",
                  "title": "Best Launch Times",
                  "description": "Day vs Hour performance",
                  "data": toolResult,
                  "categoryKey": "day",
                  "dataKey": "hour"
                }

                💎 get_market_gap_matrix → Scatter Plot
                {
                  "type": "scatter",
                  "title": "Market Opportunities",
                  "description": "Low competition, high demand",
                  "data": toolResult,
                  "categoryKey": "launchVolume",
                  "dataKey": "avgUpvotes"
                }

                📊 get_category_performance → Bar Chart
                {
                  "type": "bar",
                  "title": "Category Performance",
                  "description": "Average upvotes by category",
                  "data": toolResult,
                  "categoryKey": "category",
                  "dataKey": "avgUpvotes"
                }

                🔄 FALLBACK STRATEGY:
                If the user's query is vague (e.g., "Tell me about AI"):
                1. Call get_topic_velocity to show AI vs other categories
                2. Call search_products with query="AI" for examples
                3. Generate a multi_line chart comparing AI to Dev Tools

                ❌ NEVER ALLOWED:
                - Responding without calling tools
                - Responding without a visualization
                - Making up data or trends
                - Saying "I don't have that data" (use tools to find it)

                ✅ GOOD RESPONSE PATTERN:
                1. Fetch data with 1-3 tools
                2. Generate a clear, insightful answer
                3. Include a properly configured chart
                4. List 2-3 actionable trends
                5. Show 3-5 related products
                `
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

                    try {
                        switch (toolName) {
                            case 'search_products': {
                                let queryBuilder = supabase
                                    .from('ph_launches')
                                    .select('id, name, tagline, description, votes_count, created_at')
                                    .or(`name.ilike.%${toolInput.query}%,description.ilike.%${toolInput.query}%`)
                                    .order('votes_count', { ascending: false })
                                    .limit(toolInput.limit || 10);
                                if (toolInput.min_votes) queryBuilder = queryBuilder.gte('votes_count', toolInput.min_votes);
                                const { data } = await queryBuilder;
                                toolResult = JSON.stringify(data || []);
                                break;
                            }
                            case 'get_topic_velocity': {
                                const rawData = await ChartsData.getTopicVelocity(toolInput.months);

                                // Transform for Multi-Line Chart
                                const monthMap = new Map<string, any>();
                                const allTopics = new Set<string>();

                                rawData.forEach(topicData => {
                                    allTopics.add(topicData.topic);
                                    topicData.timeSeriesData.forEach(point => {
                                        if (!monthMap.has(point.month)) {
                                            monthMap.set(point.month, { month: point.month });
                                        }
                                        const entry = monthMap.get(point.month);
                                        entry[topicData.topic] = point.launchCount;
                                    });
                                });

                                const chartData = Array.from(monthMap.values())
                                    .sort((a, b) => a.month.localeCompare(b.month));

                                toolResult = JSON.stringify({
                                    chartData,
                                    topics: Array.from(allTopics),
                                    rawSummary: rawData.map(t => ({ topic: t.topic, total: t.totalLaunches, trend: t.trend }))
                                });
                                break;
                            }
                            case 'get_market_treemap': {
                                const data = await ChartsData.getMarketTreemap();
                                toolResult = JSON.stringify(data);
                                break;
                            }
                            case 'get_keyword_trends': {
                                const data = await ChartsData.getKeywordTrends(toolInput.keyword, toolInput.months);
                                if (!data) {
                                    toolResult = JSON.stringify({ error: "No data found for keyword" });
                                } else {
                                    // Flatten for easier consumption
                                    toolResult = JSON.stringify({
                                        chartData: data.monthlyData,
                                        totalMentions: data.totalMentions,
                                        keyword: data.keyword
                                    });
                                }
                                break;
                            }
                            case 'get_category_performance': {
                                const data = await ChartsData.getCategoryPerformanceMatrix();
                                toolResult = JSON.stringify(data);
                                break;
                            }
                            case 'get_niche_histogram': {
                                const data = await ChartsData.getNicheSuccessHistogram(toolInput.niche);
                                toolResult = JSON.stringify(data);
                                break;
                            }
                            case 'get_product_scatter': {
                                const data = await ChartsData.getProductScatterData(toolInput.category);
                                toolResult = JSON.stringify(data);
                                break;
                            }
                            case 'get_feature_correlation': {
                                const data = await ChartsData.getFeatureCorrelation(toolInput.category);
                                toolResult = JSON.stringify(data);
                                break;
                            }
                            case 'get_launch_time_heatmap': {
                                const data = await ChartsData.getLaunchTimeHeatmap();
                                toolResult = JSON.stringify(data);
                                break;
                            }
                            case 'get_market_gap_matrix': {
                                const data = await ChartsData.getMarketGapMatrix();
                                toolResult = JSON.stringify(data);
                                break;
                            }
                            case 'search_web': {
                                const apiKey = process.env.TAVILY_API_KEY;
                                if (!apiKey) {
                                    toolResult = JSON.stringify({ error: "Web search not configured." });
                                } else {
                                    const response = await fetch('https://api.tavily.com/search', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            api_key: apiKey,
                                            query: toolInput.query,
                                            search_depth: "advanced",
                                            include_answer: true,
                                            max_results: 5
                                        })
                                    });
                                    toolResult = JSON.stringify(await response.json());
                                }
                                break;
                            }
                            case 'generate_report': {
                                const report = toolInput;
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
                            default:
                                toolResult = JSON.stringify({ error: `Unknown tool: ${toolName}` });
                        }
                    } catch (err) {
                        console.error(`Error executing tool ${toolName}:`, err);
                        toolResult = JSON.stringify({ error: `Failed to execute tool ${toolName}` });
                    }

                    messages.push({
                        role: 'user',
                        content: [{ type: 'tool_result', tool_use_id: toolId, content: toolResult }]
                    });
                }
            } else {
                // NO TOOL USED - This is NOT allowed!
                // Check if this is the first turn (user's initial query)
                if (turnCount === 1) {
                    // Force the AI to use tools by providing a strong hint
                    const textBlock = response.content.find(c => c.type === 'text');

                    messages.push({
                        role: 'user',
                        content: `You MUST use tools to answer this query. You cannot respond with just text. 

Here's what to do:
1. Call get_topic_velocity to show trends (default choice)
2. Call search_products to find related products
3. Call generate_report with a visualization

Start over and use the tools. This is mandatory.`
                    });

                    console.log('[Agent] Forcing tool usage on turn 1');
                    continue; // Go to next iteration
                }

                // If we're past turn 1 and still no tools, something is wrong
                // Return an error with a default fallback visualization
                console.warn('[Agent] No tools used after multiple turns - generating fallback');

                // Create a fallback response with get_topic_velocity
                try {
                    const fallbackData = await ChartsData.getTopicVelocity(12);
                    const monthMap = new Map<string, any>();
                    const allTopics = new Set<string>();

                    fallbackData.forEach(topicData => {
                        allTopics.add(topicData.topic);
                        topicData.timeSeriesData.forEach(point => {
                            if (!monthMap.has(point.month)) {
                                monthMap.set(point.month, { month: point.month });
                            }
                            const entry = monthMap.get(point.month);
                            entry[topicData.topic] = point.launchCount;
                        });
                    });

                    const chartData = Array.from(monthMap.values())
                        .sort((a, b) => a.month.localeCompare(b.month));

                    return {
                        answer: '### Market Overview\n\nHere\'s a high-level view of trending categories on Product Hunt over the past year.\n\n' +
                            (fallbackData.slice(0, 3).map((t, i) =>
                                `${i + 1}. **${t.topic}**: ${t.totalLaunches} launches (${t.trend})`
                            ).join('\n')),
                        visualization: {
                            type: 'multi_line' as const,
                            title: 'Topic Velocity - Last 12 Months',
                            description: 'Monthly launch volume by category',
                            data: chartData,
                            categoryKey: 'month',
                            dataKey: 'launchCount',
                            seriesKeys: Array.from(allTopics).slice(0, 5)
                        },
                        trends: fallbackData.slice(0, 3).map(t => {
                            const sentiment: 'positive' | 'neutral' | 'negative' =
                                t.trend === 'rising' ? 'positive' :
                                    t.trend === 'declining' ? 'negative' : 'neutral';
                            return {
                                name: t.topic,
                                growth: t.trend === 'rising' ? '+30%' : t.trend === 'declining' ? '-15%' : '0%',
                                sentiment
                            };
                        }),
                        related_products: []
                    };
                } catch (fallbackError) {
                    console.error('Fallback failed:', fallbackError);
                    return {
                        answer: '### Unable to Generate Analysis\n\nPlease try rephrasing your query or ask about a specific topic like "AI trends" or "SaaS products".',
                        visualization: null,
                        trends: [],
                        related_products: []
                    };
                }
            }
        }

        throw new Error('Agent exceeded max turns');

    } catch (error) {
        console.error('Error in askGrowthIntelligence:', error);
        return {
            answer: `### Analysis Error\n\nI encountered an issue while processing your request. Please try again.\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
            visualization: null,
            trends: [],
            related_products: []
        };
    }
}
