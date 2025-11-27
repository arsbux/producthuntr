import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

/**
 * Disable RLS on vote_snapshots table to make it completely unrestricted
 * Visit: http://localhost:3000/api/admin/fix-vote-snapshots-permissions
 */
export async function GET() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        console.log('Fixing permissions on vote_snapshots table...');

        const sql = `
            -- 1. Disable RLS
            ALTER TABLE vote_snapshots DISABLE ROW LEVEL SECURITY;

            -- 2. Drop any existing policies
            DROP POLICY IF EXISTS "Allow public read access" ON vote_snapshots;
            DROP POLICY IF EXISTS "Allow public insert access" ON vote_snapshots;
            DROP POLICY IF EXISTS "Allow public update access" ON vote_snapshots;
            DROP POLICY IF EXISTS "Allow public delete access" ON vote_snapshots;

            -- 3. Grant full access to all roles
            GRANT ALL ON vote_snapshots TO anon;
            GRANT ALL ON vote_snapshots TO authenticated;
            GRANT ALL ON vote_snapshots TO service_role;
        `;

        const { error } = await supabase.rpc('exec_sql' as any, {
            sql_query: sql
        });

        if (error) {
            console.error('RPC failed, trying fallback...');
            // If RPC fails (often due to permissions), we return instructions
            throw error;
        }

        return NextResponse.json({
            success: true,
            message: 'Permissions fixed for vote_snapshots table (UNRESTRICTED)',
        });

    } catch (error: any) {
        console.error('Failed to fix permissions:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            instructions: {
                step1: 'Go to Supabase Dashboard',
                step2: 'Navigate to SQL Editor',
                step3: 'Run the SQL in: supabase/fix-snapshot-permissions.sql'
            }
        }, { status: 500 });
    }
}
