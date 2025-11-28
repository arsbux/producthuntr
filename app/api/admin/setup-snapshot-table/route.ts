import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

export const dynamic = 'force-dynamic';

/**
 * One-time setup route to create the live_snapshot table
 * Visit: http://localhost:3000/api/admin/setup-snapshot-table
 */
export async function GET() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        console.log('Setting up live_snapshot table...');

        // Drop existing policies if they exist (to avoid conflicts)
        const dropPolicies = `
            DROP POLICY IF EXISTS "Allow public read access" ON live_snapshot;
            DROP POLICY IF EXISTS "Allow public insert access" ON live_snapshot;
            DROP POLICY IF EXISTS "Allow public update access" ON live_snapshot;
            DROP POLICY IF EXISTS "Allow public delete access" ON live_snapshot;
        `;

        // Create the table
        const createTable = `
            CREATE TABLE IF NOT EXISTS live_snapshot (
                id SERIAL PRIMARY KEY,
                snapshot_data JSONB NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `;

        // Create index
        const createIndex = `
            CREATE INDEX IF NOT EXISTS idx_live_snapshot_updated_at 
            ON live_snapshot(updated_at DESC);
        `;

        // Disable RLS first (unrestricted access)
        const disableRLS = `
            ALTER TABLE live_snapshot DISABLE ROW LEVEL SECURITY;
        `;

        // Execute SQL statements
        const statements = [
            { name: 'Drop old policies', sql: dropPolicies },
            { name: 'Create table', sql: createTable },
            { name: 'Create index', sql: createIndex },
            { name: 'Disable RLS (unrestricted access)', sql: disableRLS }
        ];

        const results = [];

        for (const stmt of statements) {
            console.log(`Executing: ${stmt.name}`);
            try {
                const { error } = await supabase.rpc('exec_sql' as any, {
                    sql_query: stmt.sql
                });

                if (error) {
                    // Ignore "does not exist" errors for drops
                    if (!error.message.includes('does not exist')) {
                        console.error(`Error in ${stmt.name}:`, error);
                        results.push({ step: stmt.name, status: 'warning', message: error.message });
                    } else {
                        results.push({ step: stmt.name, status: 'skipped', message: 'Already clean' });
                    }
                } else {
                    results.push({ step: stmt.name, status: 'success' });
                }
            } catch (err: any) {
                console.error(`Exception in ${stmt.name}:`, err);
                results.push({ step: stmt.name, status: 'error', message: err.message });
            }
        }

        // Insert initial snapshot
        console.log('Inserting initial snapshot...');
        const { error: insertError } = await supabase
            .from('live_snapshot')
            .upsert({
                id: 1,
                snapshot_data: {
                    chartData: [],
                    topLaunches: [],
                    metrics: {
                        totalLaunches: 0,
                        aiPercentage: 0,
                        avgVotes: 0,
                        topCategory: 'N/A'
                    }
                },
                updated_at: new Date().toISOString()
            });

        if (insertError) {
            console.error('Insert error:', insertError);
            results.push({ step: 'Insert initial snapshot', status: 'error', message: insertError.message });
        } else {
            results.push({ step: 'Insert initial snapshot', status: 'success' });
        }

        console.log('Setup completed!');

        return NextResponse.json({
            success: true,
            message: 'live_snapshot table setup completed (UNRESTRICTED ACCESS)',
            results
        });

    } catch (error: any) {
        console.error('Setup failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Setup failed',
                hint: 'You may need to run the SQL manually in Supabase Dashboard → SQL Editor'
            },
            { status: 500 }
        );
    }
}
