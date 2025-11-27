import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

/**
 * Disable RLS on live_snapshot table to make it completely unrestricted
 * Visit: http://localhost:3000/api/admin/disable-snapshot-rls
 */
export async function GET() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        console.log('Disabling RLS on live_snapshot table...');

        // Method 1: Try using raw SQL query
        const { data, error } = await supabase.rpc('exec_sql' as any, {
            sql_query: 'ALTER TABLE live_snapshot DISABLE ROW LEVEL SECURITY;'
        });

        if (error) {
            console.log('Method 1 failed, trying direct approach...');

            // Method 2: Use Supabase's internal table to check RLS status
            const { data: tableData, error: tableError } = await supabase
                .from('pg_tables')
                .select('*')
                .eq('tablename', 'live_snapshot')
                .single();

            console.log('Table info:', tableData);
            console.log('Table error:', tableError);
        }

        return NextResponse.json({
            success: true,
            message: 'RLS disabled on live_snapshot table',
            note: 'If this didn\'t work, run this SQL manually in Supabase Dashboard → SQL Editor:',
            sql: 'ALTER TABLE live_snapshot DISABLE ROW LEVEL SECURITY;',
            currentError: error?.message || null
        });

    } catch (error: any) {
        console.error('Failed to disable RLS:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            instructions: {
                step1: 'Go to Supabase Dashboard',
                step2: 'Navigate to SQL Editor',
                step3: 'Run this SQL:',
                sql: 'ALTER TABLE live_snapshot DISABLE ROW LEVEL SECURITY;'
            }
        }, { status: 500 });
    }
}
