import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = createRouteHandlerClient({ cookies });

    try {
        // 1. Verify User Session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session.user;

        // 2. Get Lemon Squeezy Config
        const apiKey = process.env.LEMONSQUEEZY_API_KEY;
        const storeId = process.env.LEMONSQUEEZY_STORE_ID;
        const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;

        if (!apiKey || !storeId || !variantId) {
            console.error('Lemon Squeezy credentials missing');
            return NextResponse.json({ error: 'Payment configuration missing' }, { status: 500 });
        }

        // 3. Create Checkout Session
        const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                data: {
                    type: 'checkouts',
                    attributes: {
                        checkout_data: {
                            email: user.email,
                            custom: {
                                user_id: user.id
                            }
                        },
                        product_options: {
                            redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/desk/idea-validator?success=true`,
                        }
                    },
                    relationships: {
                        store: {
                            data: {
                                type: 'stores',
                                id: storeId
                            }
                        },
                        variant: {
                            data: {
                                type: 'variants',
                                id: variantId
                            }
                        }
                    }
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Lemon Squeezy Error:', data);
            return NextResponse.json({ error: data.errors?.[0]?.detail || 'Failed to create checkout' }, { status: 400 });
        }

        // 4. Return Checkout URL
        const checkoutUrl = data.data.attributes.url;
        return NextResponse.json({ url: checkoutUrl });

    } catch (error: any) {
        console.error('Checkout creation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
