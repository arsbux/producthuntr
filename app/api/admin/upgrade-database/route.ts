import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

/**
 * One-Click Setup: Upgrades database schema and fixes permissions
 * Visit: http://localhost:3000/api/admin/upgrade-database
 */
export async function GET() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        console.log('Upgrading database schema...');

        const sql = `
            -- 1. Add missing columns to vote_snapshots
            ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS tagline text;
            ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS description text;
            ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS rank_of_day int4;
            ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS website_url text;
            ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS ph_url text;
            ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS thumbnail_url text;
            ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS topics text[];
            ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS makers jsonb;
            ALTER TABLE vote_snapshots ADD COLUMN IF NOT EXISTS launched_at timestamptz;

            -- 2. Fix Permissions (Unrestricted)
            ALTER TABLE vote_snapshots DISABLE ROW LEVEL SECURITY;
            
            -- Drop policies to be safe
            DROP POLICY IF EXISTS "Allow public read access" ON vote_snapshots;
            DROP POLICY IF EXISTS "Allow public insert access" ON vote_snapshots;
            DROP POLICY IF EXISTS "Allow public update access" ON vote_snapshots;
            DROP POLICY IF EXISTS "Allow public delete access" ON vote_snapshots;

            -- Grant access
            GRANT ALL ON vote_snapshots TO anon;
            GRANT ALL ON vote_snapshots TO authenticated;
            GRANT ALL ON vote_snapshots TO service_role;
        `;

        // Try to execute via RPC
        const { error } = await supabase.rpc('exec_sql' as any, {
            sql_query: sql
        });

        if (error) {
            console.error('RPC failed:', error);
            return NextResponse.json({
                success: false,
                error: error.message,
                instructions: 'Please run the SQL in supabase/upgrade-snapshots-table.sql manually in Supabase Dashboard.'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Database upgraded successfully! vote_snapshots now has all fields and unrestricted access.',
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
