import { NextResponse } from 'next/server';
import { fetchLaunchesForDate } from '@/lib/product-processor';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key-here';

/**
 * Background job that fetches live Product Hunt data and stores FULL details in vote_snapshots
 */
export async function GET(request: Request) {
    try {
        // Verify authorization (Header OR Query Param)
        const authHeader = request.headers.get('authorization');
        const url = new URL(request.url);
        const queryKey = url.searchParams.get('key');

        const isAuthorized =
            authHeader === `Bearer ${CRON_SECRET}` ||
            queryKey === CRON_SECRET;

        if (!isAuthorized) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[Snapshot Job] Starting live data fetch...');

        // Use Pacific Time to determine "today" since Product Hunt operates on PT
        const today = new Date();
        let posts: any[] = [];

        try {
            posts = await fetchLaunchesForDate(today);
            console.log(`[Snapshot Job] Fetched ${posts.length} posts from Product Hunt API`);
        } catch (e) {
            console.error('[Snapshot Job] Failed to fetch from Product Hunt API:', e);
            return NextResponse.json({ error: 'Failed to fetch from API' }, { status: 500 });
        }

        if (posts.length === 0) {
            return NextResponse.json({ message: 'No posts fetched', postsCount: 0 });
        }

        // Calculate snapshot date in Pacific Time
        const todayDate = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

        // Prepare FULL snapshot records
        const snapshotTime = new Date().toISOString();
        const snapshotRecords = posts.map((post, index) => ({
            product_id: String(post.id),
            product_name: post.name,
            tagline: post.tagline,
            description: post.description,
            votes_count: post.votes_count || 0,
            comments_count: post.comments_count || 0,
            rank_of_day: index + 1, // Assumes posts are sorted by votes
            website_url: post.website,
            ph_url: post.redirect_url,
            thumbnail_url: post.thumbnail_url,
            topics: post.topics?.map((t: any) => t.name) || [],
            makers: post.makers,
            launched_at: post.created_at,
            snapshot_date: todayDate,
            snapshot_time: snapshotTime,
            created_at: snapshotTime
        }));

        // Upsert into ph_launches to ensure detail pages work
        const launchRecords = posts.map(post => ({
            id: String(post.id),
            name: post.name,
            tagline: post.tagline,
            description: post.description,
            votes_count: post.votes_count || 0,
            comments_count: post.comments_count || 0,
            website_url: post.website,
            ph_url: post.redirect_url,
            thumbnail_url: post.thumbnail_url,
            topics: post.topics?.map((t: any) => t.name) || [],
            makers: post.makers,
            launched_at: post.created_at,
            updated_at: new Date().toISOString()
        }));

        const { error: launchError } = await supabase
            .from('ph_launches')
            .upsert(launchRecords, { onConflict: 'id' });

        if (launchError) {
            console.error('[Snapshot Job] Launch upsert error:', launchError);
        }

        // Insert in batches
        const batchSize = 50;
        let insertedCount = 0;

        for (let i = 0; i < snapshotRecords.length; i += batchSize) {
            const batch = snapshotRecords.slice(i, i + batchSize);
            const { error } = await supabase.from('vote_snapshots').insert(batch);

            if (error) {
                console.error(`[Snapshot Job] Insert error:`, error);
            } else {
                insertedCount += batch.length;
            }
        }

        console.log(`[Snapshot Job] Completed: ${insertedCount}/${posts.length} stored`);

        return NextResponse.json({
            success: true,
            message: 'Snapshot updated successfully',
            stats: { total: posts.length, inserted: insertedCount }
        });

    } catch (error: any) {
        console.error('[Snapshot Job] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
