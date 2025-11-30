
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SquareClient, SquareEnvironment } from 'square';

const squareClient = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN,
    environment: process.env.NODE_ENV === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const plan = requestUrl.searchParams.get('plan');
    const transactionId = requestUrl.searchParams.get('transactionId'); // Square appends this

    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // In a production environment, you should verify the transactionId with Square
    // to ensure the payment was actually successful.
    // const { result } = await squareClient.ordersApi.retrieveOrder(orderId);
    // if (result.order.state !== 'COMPLETED') ...

    // Update subscription in Supabase
    const { error } = await supabase
        .from('subscriptions')
        .upsert({
            user_id: session.user.id,
            status: 'active',
            plan: plan || 'analytics',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        });

    if (error) {
        console.error('Error updating subscription:', error);
        // Handle error (maybe redirect to an error page)
    }

    return NextResponse.redirect(new URL('/desk', request.url));
}
