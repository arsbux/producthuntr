import Anthropic from '@anthropic-ai/sdk';

// Lazy initialization inside the function to ensure env vars are loaded
let anthropic: Anthropic | null = null;

export interface LaunchAnalysis {
    icp: string;
    problem: string;
    solution_type: string;
    niche: string;
    pricing_model: string;
    one_line_pitch: string;
}

export async function analyzeLaunch(launch: {
    name: string;
    tagline: string;
    description: string;
    topics: string[];
}): Promise<LaunchAnalysis> {
    if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not set');
    }

    if (!anthropic) {
        anthropic = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
    }

    const prompt = `
    You are a startup analyst. Analyze this Product Hunt launch and extract structured data.
    
    Product: ${launch.name}
    Tagline: ${launch.tagline}
    Description: ${launch.description}
    Topics: ${launch.topics.join(', ')}
    
    Return a JSON object with the following fields:
    - icp: The specific target audience (e.g., "Freelance Designers", "React Developers"). Be specific.
    - problem: The core pain point being solved (e.g., "Managing multiple invoices", "Debugging hydration errors").
    - solution_type: The delivery mechanism (e.g., "SaaS", "Mobile App", "Chrome Extension", "Notion Template").
    - niche: The specific market segment (e.g., "Fintech for Creatives", "DevTools for Frontend").
    - pricing_model: Best guess at monetization (e.g., "Freemium", "One-time purchase", "Subscription", "Free").
    - one_line_pitch: A rewritten, clear value prop for a founder (e.g., "Helps [ICP] solve [Problem] by [Solution]").
    
    Return ONLY the JSON. No markdown formatting.
  `;

    try {
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }],
        });

        const content = response.content[0].type === 'text' ? response.content[0].text : '';
        const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim();

        return JSON.parse(jsonStr) as LaunchAnalysis;
    } catch (error) {
        console.error('Error analyzing launch:', error);
        return {
            icp: 'Unknown',
            problem: 'Unknown',
            solution_type: 'Unknown',
            niche: 'Unknown',
            pricing_model: 'Unknown',
            one_line_pitch: 'Analysis failed',
        };
    }
}
