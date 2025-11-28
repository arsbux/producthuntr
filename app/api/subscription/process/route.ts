import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SquareClient, SquareEnvironment } from 'square';

const SUBSCRIPTION_AMOUNT = 2900; // $29.00 in cents

export async function POST(request: Request) {
    const supabase = createRouteHandlerClient({ cookies });

    try {
        const { sourceId, userId, email } = await request.json();

        // 1. Verify Session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || session.user.id !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Validate Square credentials
        const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN;
        if (!squareAccessToken) {
            console.error('SQUARE_ACCESS_TOKEN is not configured');
            return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 });
        }

        // 3. Initialize Square Client
        const squareClient = new SquareClient({
            token: squareAccessToken,
            environment: squareAccessToken.startsWith('sandbox-') || squareAccessToken.startsWith('EAA')
                ? SquareEnvironment.Sandbox
                : SquareEnvironment.Production
        });

        // 4. Process Payment with Square
        console.log(`Processing payment of $29.00 for user ${email} with source ${sourceId}`);

        // Create a shorter idempotency key (max 45 chars)
        // Use first 8 chars of userId + timestamp
        const shortId = userId.substring(0, 8);
        const timestamp = Date.now().toString();
        const idempotencyKey = `ph-${shortId}-${timestamp}`;

        const paymentResponse = await squareClient.payments.create({
            sourceId: sourceId,
            amountMoney: {
                amount: BigInt(SUBSCRIPTION_AMOUNT),
                currency: 'USD'
            },
            idempotencyKey: idempotencyKey,
            locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
            referenceId: userId, // Store user ID for reference
            note: `Product Huntr Pro Monthly - ${email}`
        });

        // 5. Check if payment was successful
        if (!paymentResponse.payment) {
            console.error('Payment failed - no payment object returned');
            return NextResponse.json({ error: 'Payment failed' }, { status: 400 });
        }

        const payment = paymentResponse.payment;

        if (payment.status !== 'COMPLETED' && payment.status !== 'APPROVED') {
            console.error(`Payment failed with status: ${payment.status}`);
            return NextResponse.json({
                error: 'Payment was not successful',
                status: payment.status
            }, { status: 400 });
        }

        console.log(`✅ Payment successful! Payment ID: ${payment.id}, Status: ${payment.status}`);

        // 6. Create/Update Subscription Record in Supabase
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

        const currentDate = new Date();
        const periodEnd = new Date(currentDate);
        periodEnd.setDate(periodEnd.getDate() + 30);

        const { error: dbError } = await supabaseAdmin
            .from('subscriptions')
            .upsert({
                user_id: userId,
                status: 'active',
                plan: 'growth_monthly',
                updated_at: currentDate.toISOString(),
                current_period_start: currentDate.toISOString(),
                current_period_end: periodEnd.toISOString(),
                square_payment_id: payment.id, // Store Square payment ID for reference
            }, { onConflict: 'user_id' });

        if (dbError) {
            console.error('Error creating subscription record:', dbError);
            // Payment was successful but DB failed - this needs manual intervention
            return NextResponse.json({
                error: 'Payment processed but subscription activation failed. Please contact support with payment ID: ' + payment.id,
                paymentId: payment.id
            }, { status: 500 });
        }

        console.log(`✅ Subscription activated for user ${userId}`);

        return NextResponse.json({
            success: true,
            paymentId: payment.id,
            subscriptionStatus: 'active'
        });

    } catch (error: any) {
        console.error('Payment processing error:', error);

        // Handle specific Square API errors
        if (error.statusCode) {
            const errorMessage = error.errors?.[0]?.detail || error.message || 'Payment processing failed';
            return NextResponse.json({
                error: errorMessage,
                details: error.errors
            }, { status: error.statusCode });
        }

        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
