import { createClient } from '@supabase/supabase-js';
import { fetchLaunches } from '../lib/producthunt';
import { analyzeLaunch } from '../lib/ai-analyst';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfill() {
    console.log('🚀 Starting Product Hunt Backfill (30 Days)...');

    try {
        // 1. Fetch launches
        const launches = await fetchLaunches(30);
        console.log(`📦 Found ${launches.length} launches to process`);

        // 2. Process each launch
        for (const [index, launch] of launches.entries()) {
            console.log(`\n[${index + 1}/${launches.length}] Processing: ${launch.name}`);

            // Check if already exists
            const { data: existing } = await supabase
                .from('ph_launches')
                .select('id')
                .eq('id', launch.id.toString())
                .single();

            if (existing) {
                console.log('  ⏭️  Skipping (already exists)');
                continue;
            }

            // 3. AI Analysis
            console.log('  🤖 Analyzing...');
            const analysis = await analyzeLaunch({
                name: launch.name,
                tagline: launch.tagline,
                description: launch.description,
                topics: launch.topics.map(t => t.name),
            });

            // 4. Save to DB
            const { error } = await supabase.from('ph_launches').insert({
                id: launch.id.toString(),
                name: launch.name,
                tagline: launch.tagline,
                description: launch.description,
                votes_count: launch.votes_count,
                comments_count: launch.comments_count,
                website_url: launch.website,
                ph_url: launch.redirect_url,
                thumbnail_url: launch.thumbnail_url,
                topics: launch.topics.map(t => t.name),
                makers: launch.makers,
                launched_at: launch.created_at,
                ai_analysis: analysis,
                analyzed_at: new Date().toISOString(),
            });

            if (error) {
                console.error('  ❌ Error saving:', error.message);
            } else {
                console.log('  ✅ Saved with AI insights');
                console.log(`     🎯 ICP: ${analysis.icp}`);
                console.log(`     💡 Problem: ${analysis.problem}`);
            }

            // Rate limiting (be nice to APIs)
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('\n✨ Backfill complete!');

    } catch (error) {
        console.error('Fatal error during backfill:', error);
    }
}

backfill();
