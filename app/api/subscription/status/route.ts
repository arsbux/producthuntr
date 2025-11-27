import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        console.log('Subscription check: No session');
        return NextResponse.json({ subscribed: false, authenticated: false });
    }

    console.log(`Checking subscription for user: ${session.user.id}`);

    // Use service role to bypass RLS for the check to ensure we find the record
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()!,
        { auth: { persistSession: false } }
    );

    // Check for subscription in 'subscriptions' table
    const { data: subscription, error } = await supabaseAdmin
        .from('subscriptions')
        .select('status')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .single();

    if (error) {
        console.error('Subscription check error:', error);
    }

    console.log('Subscription result:', subscription);

    if (error || !subscription) {
        return NextResponse.json({ subscribed: false, authenticated: true });
    }

    return NextResponse.json({ subscribed: true, authenticated: true });
}
