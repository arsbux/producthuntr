import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Polar } from '@polar-sh/sdk';

export async function POST(request: Request) {
    const supabase = createRouteHandlerClient({ cookies });

    try {
        // 1. Verify User Session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user;

        // 2. Get Polar Config
        const accessToken = process.env.POLAR_ACCESS_TOKEN;
        const productId = process.env.POLAR_PRODUCT_ID;
        const successUrl = process.env.POLAR_SUCCESS_URL || `${process.env.NEXT_PUBLIC_APP_URL}/desk/idea-validator?success=true`;

        if (!accessToken || !productId) {
            console.error('Polar credentials missing');
            return NextResponse.json({ error: 'Payment configuration missing' }, { status: 500 });
        }

        // 3. Initialize Polar Client
        const polar = new Polar({
            accessToken: accessToken,
            server: 'sandbox', // Use 'production' for live payments, 'sandbox' for testing
        });

        // 4. Create Checkout Session
        const checkout = await polar.checkouts.create({
            products: [productId],
            successUrl: successUrl,
            customerEmail: user.email,
            metadata: {
                userId: user.id,
            },
        });

        if (!checkout || !checkout.url) {
            console.error('Failed to create Polar checkout');
            return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
        }

        // 5. Return Checkout URL
        return NextResponse.json({ url: checkout.url });

    } catch (error: any) {
        console.error('Polar checkout creation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
