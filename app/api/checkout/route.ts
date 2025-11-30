import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SquareClient, SquareEnvironment } from 'square';

if (!process.env.SQUARE_ACCESS_TOKEN) {
    console.error('SQUARE_ACCESS_TOKEN is missing from environment variables');
}

const squareClient = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN,
    environment: process.env.NODE_ENV === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

export async function POST(request: Request) {
    try {
        const { plan } = await request.json();
        const supabase = createRouteHandlerClient({ cookies });

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let amount = 0;
        let name = '';

        if (plan === 'analytics') {
            amount = 2500; // $25.00
            name = 'ProductHuntr Analytics';
        } else if (plan === 'analytics_ai') {
            amount = 3900; // $39.00
            name = 'ProductHuntr Analytics + AI';
        } else {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        const response = await squareClient.checkout.paymentLinks.create({
            idempotencyKey: crypto.randomUUID(),
            order: {
                locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!,
                lineItems: [
                    {
                        name: name,
                        quantity: '1',
                        basePriceMoney: {
                            amount: BigInt(amount),
                            currency: 'USD',
                        },

                    },
                ],
                metadata: {
                    user_id: session.user.id,
                    plan: plan
                }
            },
            checkoutOptions: {
                redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/checkout/callback?plan=${plan}`,
            },
        });

        if (response.paymentLink?.url) {
            return NextResponse.json({ url: response.paymentLink.url });
        } else {
            throw new Error('Failed to create payment link');
        }

    } catch (error: any) {
        console.error('Square Checkout Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
