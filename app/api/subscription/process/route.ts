import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = createRouteHandlerClient({ cookies });

    try {
        const { sourceId, userId, email } = await request.json();

        // 1. Verify Session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || session.user.id !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Mock Payment Processing (Square removed)
        console.log(`Processing mock payment of $29 for user ${email} with source ${sourceId}`);

        // Simulate a successful payment delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 3. Create/Update Subscription Record in Supabase
        // Use service role client to bypass RLS
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        const { error: dbError } = await supabaseAdmin
            .from('subscriptions')
            .upsert({
                user_id: userId,
                status: 'active',
                plan: 'growth_monthly',
                updated_at: new Date().toISOString(),
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
            }, { onConflict: 'user_id' });

        if (dbError) {
            console.error('Error creating subscription record:', dbError);
            return NextResponse.json({ error: 'Failed to record subscription. Please contact support.' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Payment processing error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
