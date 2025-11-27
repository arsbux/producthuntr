#!/usr/bin/env tsx
/**
 * Daily Digest Generator
 * Sends top thesis-matched companies to investors via email/Slack
 * 
 * Usage:
 *   tsx scripts/send-daily-digest.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DigestCompany {
    company_id: string;
    company_name: string;
    match_score: number;
    match_reasons: string[];
    trust_badges: any[];
    recent_signals: any[];
}

async function generateDailyDigest() {
    console.log('🚀 Generating daily digest...');

    // Get all active theses
    const { data: theses } = await supabase
        .from('investment_theses')
        .select('*')
        .eq('is_active', true);

    if (!theses || theses.length === 0) {
        console.log('No active theses found');
        return;
    }

    for (const thesis of theses) {
        console.log(`\n📊 Processing thesis: ${thesis.name}`);

        // Get top matches from last 24 hours
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const { data: matches } = await supabase
            .from('company_thesis_matches')
            .select(`
        *,
        company:canonical_companies(id, canonical_name)
      `)
            .eq('thesis_id', thesis.id)
            .gte('match_score', 70)
            .gte('calculated_at', yesterday.toISOString())
            .order('match_score', { ascending: false })
            .limit(10);

        if (!matches || matches.length === 0) {
            console.log(`  No new matches for ${thesis.name}`);
            continue;
        }

        // Enrich with signals and trust badges
        const digestCompanies: DigestCompany[] = [];

        for (const match of matches) {
            const companyId = match.company_id;

            // Get recent signals (last 7 days)
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const { data: signals } = await supabase
                .from('signal_events')
                .select('*')
                .eq('entity_id', companyId)
                .gte('event_date', weekAgo.toISOString())
                .order('event_date', { ascending: false })
                .limit(5);

            // Get trust badges
            const { data: badges } = await supabase
                .from('company_trust_signals')
                .select('*')
                .eq('company_id', companyId)
                .eq('verified', true);

            digestCompanies.push({
                company_id: companyId,
                company_name: match.company?.canonical_name || 'Unknown',
                match_score: match.match_score,
                match_reasons: match.match_reasons || [],
                trust_badges: badges || [],
                recent_signals: signals || [],
            });
        }

        // Generate email/Slack message
        const message = formatDigestMessage(thesis.name, digestCompanies);

        // Send via Slack (if webhook configured)
        await sendToSlack(thesis.user_id, message);

        console.log(`  ✅ Sent digest with ${digestCompanies.length} companies`);
    }

    console.log('\n✨ Daily digest complete!');
}

function formatDigestMessage(thesisName: string, companies: DigestCompany[]): string {
    let message = `🔥 **Daily Digest: ${thesisName}** - ${new Date().toLocaleDateString()}\n\n`;
    message += `Found ${companies.length} high-match companies:\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    companies.forEach((company, idx) => {
        message += `**${idx + 1}. ${company.company_name}** - Match: ${Math.round(company.match_score)}%\n`;

        // Trust badges
        if (company.trust_badges.length > 0) {
            message += `   ${company.trust_badges.map(b => b.badge_icon + ' ' + b.badge_label).join('  ')}\n`;
        }

        // Match reasons
        if (company.match_reasons.length > 0) {
            message += `   ✓ ${company.match_reasons.slice(0, 2).join(' • ')}\n`;
        }

        // Recent signals
        if (company.recent_signals.length > 0) {
            message += `   Recent signals (${company.recent_signals.length}):\n`;
            company.recent_signals.slice(0, 2).forEach((signal: any) => {
                message += `   • ${signal.event_type}: ${signal.title || 'Update'}\n`;
            });
        }

        message += `   🔗 View: http://localhost:3000/desk/research/${company.company_id}\n\n`;
    });

    message += `━━━━━━━━━━━━━━━━━━━━━━━\n`;

    return message;
}

async function sendToSlack(userId: string, message: string) {
    // Get user preferences for Slack webhook
    const { data: prefs } = await supabase
        .from('investor_preferences')
        .select('notification_settings')
        .eq('user_id', userId)
        .single();

    const slackWebhook = prefs?.notification_settings?.slackWebhook;

    if (!slackWebhook) {
        console.log(`  ⚠️  No Slack webhook configured for user ${userId}`);
        return;
    }

    try {
        const response = await fetch(slackWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: message }),
        });

        if (!response.ok) {
            throw new Error(`Slack API error: ${response.statusText}`);
        }

        console.log(`  ✉️  Sent to Slack`);
    } catch (error) {
        console.error(`  ❌ Failed to send Slack message:`, error);
    }
}

// Run the digest
generateDailyDigest().catch(console.error);
