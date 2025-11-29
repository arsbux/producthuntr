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
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        console.log('Session check:', {
            hasSession: !!session,
            sessionUserId: session?.user?.id,
            requestUserId: userId,
            sessionError: sessionError?.message
        });

        if (!session) {
            console.error('No session found');
            return NextResponse.json({ error: 'No active session. Please log in again.' }, { status: 401 });
        }

        if (session.user.id !== userId) {
            console.error('User ID mismatch:', { sessionUserId: session.user.id, requestUserId: userId });
            return NextResponse.json({ error: 'Session user mismatch' }, { status: 401 });
        }

        // 2. Check for Free Tier Activation
        if (sourceId === 'free_tier') {
            console.log(`Activating free tier for user ${userId}`);

            // Skip Square/Lemon Squeezy validation
            // Directly create subscription
            const { createClient } = await import('@supabase/supabase-js');
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()!,
                { auth: { autoRefreshToken: false, persistSession: false } }
            );

            const currentDate = new Date();
            const periodEnd = new Date(currentDate);
            periodEnd.setDate(periodEnd.getDate() + 30); // 30 days free access

            const { error: dbError } = await supabaseAdmin
                .from('subscriptions')
                .upsert({
                    user_id: userId,
                    status: 'active',
                    plan: 'free_tier',
                    updated_at: currentDate.toISOString(),
                    current_period_start: currentDate.toISOString(),
                    current_period_end: periodEnd.toISOString(),
                }, { onConflict: 'user_id' });

            if (dbError) {
                console.error('Error creating free subscription:', dbError);
                return NextResponse.json({ error: 'Activation failed' }, { status: 500 });
            }

            return NextResponse.json({ success: true, subscriptionStatus: 'active' });
        }

        // 3. Validate Square credentials (only if not free tier)
        const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN;
        if (!squareAccessToken) {
            console.error('SQUARE_ACCESS_TOKEN is not configured');
            return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 });
        }

        // 3. Initialize Square Client
        const appId = process.env.NEXT_PUBLIC_SQUARE_APP_ID;
        const isSandbox = appId?.startsWith('sandbox-');

        const squareClient = new SquareClient({
            token: squareAccessToken,
            environment: isSandbox ? SquareEnvironment.Sandbox : SquareEnvironment.Production
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
            const errorCode = error.errors?.[0]?.code;
            const errorDetail = error.errors?.[0]?.detail;

            // Map common error codes to user-friendly messages
            const userFriendlyMessages: Record<string, string> = {
                'TRANSACTION_LIMIT': 'Your card has exceeded its transaction limit. Please try a different payment method.',
                'INSUFFICIENT_FUNDS': 'Insufficient funds. Please try a different payment method.',
                'CVV_FAILURE': 'Invalid CVV. Please check your card security code.',
                'ADDRESS_VERIFICATION_FAILURE': 'Card verification failed. Please check your billing address.',
                'CARD_DECLINED': 'Your card was declined. Please try a different payment method.',
                'INVALID_CARD': 'Invalid card details. Please check your card information.',
                'CARD_DECLINED_VERIFICATION_REQUIRED': 'Additional verification required. Please contact your card issuer.',
                'GENERIC_DECLINE': 'Payment declined. Please try a different payment method.',
            };

            const errorMessage = userFriendlyMessages[errorCode] || errorDetail || 'Payment processing failed';

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
