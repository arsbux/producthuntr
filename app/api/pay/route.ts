import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { SquareClient, SquareEnvironment } from 'square';

const squareClient = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN,
    environment: process.env.NODE_ENV === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

// Admin client for subscription updates (bypasses RLS)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const { sourceId, plan, verificationToken } = await request.json();
        const supabase = createRouteHandlerClient({ cookies });

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let amount = 0;
        if (plan === 'analytics') {
            amount = 2900; // $29.00
        } else if (plan === 'analytics_ai') {
            amount = 3900; // $39.00
        } else {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        const paymentRequest: any = {
            sourceId,
            idempotencyKey: crypto.randomUUID(),
            amountMoney: {
                amount: BigInt(amount),
                currency: 'USD',
            },
            note: `Subscription for ${plan} - User: ${session.user.id}`,
        };

        // Add verification token if provided (for 3D Secure/SCA)
        if (verificationToken) {
            paymentRequest.verificationToken = verificationToken;
        }

        const response = await squareClient.payments.create(paymentRequest);

        if (response.payment?.status === 'COMPLETED' || response.payment?.status === 'APPROVED') {
            // Update subscription in Supabase using admin client (bypasses RLS)
            const { error } = await supabaseAdmin
                .from('subscriptions')
                .upsert({
                    user_id: session.user.id,
                    status: 'active',
                    plan: plan,
                    current_period_start: new Date().toISOString(),
                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
                });

            if (error) {
                console.error('Error updating subscription:', error);
                // We still return success for the payment, but log the DB error
            }

            return NextResponse.json({ success: true });
        } else {
            // Payment was not completed - check for errors
            const paymentErrors = (response as any).errors || [];
            const errorMessage = mapSquareError(paymentErrors);
            return NextResponse.json({ error: errorMessage }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Payment Error:', error);

        // Handle Square API errors
        if (error.errors && Array.isArray(error.errors)) {
            const errorMessage = mapSquareError(error.errors);
            return NextResponse.json({ error: errorMessage }, { status: 400 });
        }

        return NextResponse.json({
            error: 'An unexpected error occurred. Please try again or contact support.'
        }, { status: 500 });
    }
}

/**
 * Map Square error codes to user-friendly messages
 */
function mapSquareError(errors: any[]): string {
    if (!errors || errors.length === 0) {
        return 'Payment failed. Please try again.';
    }

    const error = errors[0];
    const code = error.code || error.category;
    const detail = error.detail || '';

    // Common Square error codes mapped to user-friendly messages
    const errorMap: { [key: string]: string } = {
        'GENERIC_DECLINE': 'Your card was declined. Please check your card details or try a different payment method.',
        'CVV_FAILURE': 'The CVV code you entered is incorrect. Please check and try again.',
        'ADDRESS_VERIFICATION_FAILURE': 'The billing address doesn\'t match your card. Please verify your address.',
        'INVALID_CARD': 'The card number is invalid. Please check and try again.',
        'INVALID_EXPIRATION': 'The card expiration date is invalid. Please check and try again.',
        'CARD_EXPIRED': 'Your card has expired. Please use a different card.',
        'INSUFFICIENT_FUNDS': 'Your card has insufficient funds. Please try a different payment method.',
        'CARD_NOT_SUPPORTED': 'This type of card is not supported. Please use a different card.',
        'INVALID_CARD_DATA': 'Invalid card information. Please check all fields and try again.',
        'TEMPORARY_ERROR': 'A temporary error occurred. Please try again in a moment.',
        'PAN_FAILURE': 'The card number is invalid. Please check and try again.',
        'INVALID_CVV': 'The CVV code is invalid. Please check and try again.',
        'CARDHOLDER_INSUFFICIENT_PERMISSIONS': 'This card cannot be used for this type of transaction. Please try a different card.',
        'TRANSACTION_LIMIT': 'This transaction exceeds your card\'s limit. Please contact your bank or try a different card.',
        'VOICE_FAILURE': 'Your card requires voice authorization. Please contact your bank.',
        'ALLOWABLE_PIN_TRIES_EXCEEDED': 'Too many incorrect PIN attempts. Please contact your bank.',
        'INVALID_PIN': 'The PIN is incorrect. Please try again.',
        'CHIP_INSERTION_REQUIRED': 'This card must be inserted (chip). Please try a different payment method.',
        'INVALID_ACCOUNT': 'The card account is invalid. Please try a different card.',
        'BAD_EXPIRATION': 'The expiration date is invalid. Please check and try again.',
    };

    // Return mapped message or a generic one with the detail
    return errorMap[code] || `Payment failed: ${detail || 'Please try again or contact support.'}`;
}
