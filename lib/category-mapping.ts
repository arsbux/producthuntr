/**
 * CATEGORY CONSOLIDATION MAPPING
 * 
 * Maps granular niches to 15 main categories
 * This will reduce 875+ niches to ~15 main categories
 */

export const MAIN_CATEGORIES = {
    // 1. Developer Tools & Software
    DEVELOPER_TOOLS: 'Developer Tools',

    // 2. AI & Machine Learning
    AI_ML: 'AI & Machine Learning',

    // 3. Productivity & Organization
    PRODUCTIVITY: 'Productivity & Organization',

    // 4. Marketing & Growth
    MARKETING: 'Marketing & Growth',

    // 5. Design & Creative
    DESIGN: 'Design & Creative',

    // 6. Business & Finance
    BUSINESS: 'Business & Finance',

    // 7. Communication & Collaboration
    COMMUNICATION: 'Communication & Collaboration',

    // 8. Media & Entertainment
    MEDIA: 'Media & Entertainment',

    // 9. Education & Learning
    EDUCATION: 'Education & Learning',

    // 10. E-commerce & Sales
    ECOMMERCE: 'E-commerce & Sales',

    // 11. Health & Wellness
    HEALTH: 'Health & Wellness',

    // 12. Analytics & Data
    ANALYTICS: 'Analytics & Data',

    // 13. Social & Community
    SOCIAL: 'Social & Community',

    // 14. Security & Privacy
    SECURITY: 'Security & Privacy',

    // 15. Other Tools
    OTHER: 'Other Tools'
};

/**
 * Category mapping rules
 * Each rule contains keywords that if found in the niche name, maps to that category
 */
export const CATEGORY_MAPPINGS = [
    // Developer Tools
    {
        category: MAIN_CATEGORIES.DEVELOPER_TOOLS,
        keywords: [
            'developer', 'dev tools', 'coding', 'programming', 'code',
            'api', 'sdk', 'framework', 'library', 'github', 'git',
            'devops', 'infrastructure', 'deployment', 'hosting',
            'database', 'backend', 'frontend', 'full-stack',
            'testing', 'debugging', 'monitoring', 'logging',
            'cli', 'terminal', 'shell', 'command line',
            'web development', 'app development', 'software development',
            'low-code', 'no-code platform', 'automation tool',
            'version control', 'continuous integration', 'ci/cd'
        ]
    },

    // AI & Machine Learning
    {
        category: MAIN_CATEGORIES.AI_ML,
        keywords: [
            'ai', 'artificial intelligence', 'machine learning', 'ml',
            'deep learning', 'neural network', 'nlp', 'natural language',
            'chatbot', 'chat assistant', 'ai assistant', 'ai-powered',
            'gpt', 'llm', 'large language model', 'generative ai',
            'ai tool', 'ai platform', 'ai agent', 'ai writer',
            'computer vision', 'image recognition', 'voice assistant',
            'ai automation', 'predictive', 'recommendation engine'
        ]
    },

    // Productivity
    {
        category: MAIN_CATEGORIES.PRODUCTIVITY,
        keywords: [
            'productivity', 'task management', 'project management',
            'note-taking', 'notes', 'to-do', 'todo', 'checklist',
            'calendar', 'scheduling', 'time management', 'time tracking',
            'workspace', 'organization', 'planner', 'organizer',
            'knowledge management', 'wiki', 'documentation',
            'workflow', 'automation', 'templates', 'habit tracking',
            'focus', 'distraction', 'pomodoro', 'time blocking'
        ]
    },

    // Marketing & Growth
    {
        category: MAIN_CATEGORIES.MARKETING,
        keywords: [
            'marketing', 'growth', 'seo', 'sem', 'content marketing',
            'email marketing', 'newsletter', 'campaign', 'advertising',
            'social media marketing', 'influencer', 'branding',
            'lead generation', 'conversion', 'a/b testing', 'optimization',
            'crm', 'customer relationship', 'outreach', 'prospecting',
            'copywriting', 'landing page', 'funnel', 'growth hacking',
            'viral', 'referral', 'affiliate marketing'
        ]
    },

    // Design & Creative
    {
        category: MAIN_CATEGORIES.DESIGN,
        keywords: [
            'design', 'graphic design', 'ui', 'ux', 'ui/ux',
            'figma', 'sketch', 'adobe', 'canva',
            'illustration', 'icon', 'logo', 'branding design',
            'photo editing', 'video editing', 'animation',
            'creative', 'visual', 'mockup', 'prototype',
            'typography', 'color', 'font', '3d design',
            'web design', 'mobile design', 'app design'
        ]
    },

    // Business & Finance
    {
        category: MAIN_CATEGORIES.BUSINESS,
        keywords: [
            'business', 'finance', 'fintech', 'accounting',
            'invoicing', 'billing', 'payment', 'payroll',
            'expense', 'budget', 'financial planning',
            'investment', 'trading', 'crypto', 'blockchain',
            'insurance', 'banking', 'loan', 'credit',
            'hr', 'human resources', 'recruiting', 'hiring',
            'legal', 'contract', 'compliance', 'tax'
        ]
    },

    // Communication & Collaboration
    {
        category: MAIN_CATEGORIES.COMMUNICATION,
        keywords: [
            'communication', 'collaboration', 'team collaboration',
            'messaging', 'chat', 'video call', 'video conferencing',
            'meeting', 'zoom', 'slack', 'discord',
            'remote work', 'remote team', 'async', 'asynchronous',
            'feedback', 'review', 'comment', 'discussion',
            'file sharing', 'document collaboration', 'whiteboard',
            'screen sharing', 'presentation'
        ]
    },

    // Media & Entertainment
    {
        category: MAIN_CATEGORIES.MEDIA,
        keywords: [
            'media', 'entertainment', 'music', 'audio', 'podcast',
            'video', 'streaming', 'youtube', 'twitch',
            'gaming', 'game', 'esports', 'content creation',
            'photography', 'photo', 'image', 'gallery',
            'movie', 'film', 'tv', 'news', 'reading',
            'book', 'ebook', 'audiobook', 'magazine',
            'social network', 'social media platform'
        ]
    },

    // Education & Learning
    {
        category: MAIN_CATEGORIES.EDUCATION,
        keywords: [
            'education', 'learning', 'e-learning', 'online course',
            'training', 'tutorial', 'teaching', 'student',
            'university', 'school', 'academy', 'bootcamp',
            'skill development', 'upskilling', 'certification',
            'language learning', 'coding education', 'edtech',
            'study', 'homework', 'exam', 'quiz', 'flashcard',
            'mentor', 'coaching', 'lesson'
        ]
    },

    // E-commerce & Sales
    {
        category: MAIN_CATEGORIES.ECOMMERCE,
        keywords: [
            'ecommerce', 'e-commerce', 'online store', 'shop',
            'marketplace', 'retail', 'merchant', 'seller',
            'shopify', 'woocommerce', 'sales', 'selling',
            'inventory', 'fulfillment', 'shipping', 'logistics',
            'dropshipping', 'wholesale', 'point of sale', 'pos',
            'checkout', 'cart', 'product management'
        ]
    },

    // Health & Wellness
    {
        category: MAIN_CATEGORIES.HEALTH,
        keywords: [
            'health', 'wellness', 'fitness', 'medical', 'healthcare',
            'mental health', 'therapy', 'meditation', 'mindfulness',
            'nutrition', 'diet', 'food', 'recipe', 'meal planning',
            'exercise', 'workout', 'yoga', 'sleep', 'wellness',
            'mental', 'physical', 'wellbeing', 'self-care',
            'doctor', 'patient', 'clinic', 'hospital', 'telemedicine'
        ]
    },

    // Analytics & Data
    {
        category: MAIN_CATEGORIES.ANALYTICS,
        keywords: [
            'analytics', 'data', 'metrics', 'tracking', 'monitoring',
            'dashboard', 'reporting', 'insights', 'business intelligence',
            'bi', 'data visualization', 'chart', 'graph',
            'statistics', 'data science', 'big data',
            'performance monitoring', 'kpi', 'measurement',
            'web analytics', 'user analytics', 'event tracking'
        ]
    },

    // Social & Community
    {
        category: MAIN_CATEGORIES.SOCIAL,
        keywords: [
            'social', 'community', 'forum', 'discussion',
            'networking', 'network', 'connection', 'profile',
            'follower', 'friend', 'group', 'event',
            'dating', 'relationship', 'meetup', 'gathering',
            'membership', 'club', 'organization',
            'reddit', 'twitter', 'facebook', 'instagram',
            'linkedin', 'professional network'
        ]
    },

    // Security & Privacy
    {
        category: MAIN_CATEGORIES.SECURITY,
        keywords: [
            'security', 'privacy', 'encryption', 'vpn',
            'password', 'authentication', '2fa', 'two-factor',
            'cybersecurity', 'antivirus', 'firewall',
            'data protection', 'gdpr', 'compliance',
            'backup', 'recovery', 'secure', 'safety',
            'vulnerability', 'penetration testing', 'security audit'
        ]
    }
];

/**
 * Categorize a niche based on keywords
 */
export function categorizeNiche(niche: string): string {
    if (!niche || niche.toLowerCase() === 'unknown') {
        return MAIN_CATEGORIES.OTHER;
    }

    const lowerNiche = niche.toLowerCase();

    // Check each category's keywords
    for (const mapping of CATEGORY_MAPPINGS) {
        for (const keyword of mapping.keywords) {
            if (lowerNiche.includes(keyword.toLowerCase())) {
                return mapping.category;
            }
        }
    }

    // Default to Other if no match
    return MAIN_CATEGORIES.OTHER;
}

/**
 * Guess category from product description/tagline
 */
export function guessCategory(name: string, tagline: string, description: string): string {
    const text = `${name} ${tagline} ${description}`.toLowerCase();

    for (const mapping of CATEGORY_MAPPINGS) {
        for (const keyword of mapping.keywords) {
            if (text.includes(keyword.toLowerCase())) {
                return mapping.category;
            }
        }
    }

    return MAIN_CATEGORIES.OTHER;
}
