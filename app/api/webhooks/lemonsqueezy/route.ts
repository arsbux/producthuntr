import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const text = await request.text();
        const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

        if (!secret) {
            console.error('LEMONSQUEEZY_WEBHOOK_SECRET not set');
            return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
        }

        const hmac = crypto.createHmac('sha256', secret);
        const digest = Buffer.from(hmac.update(text).digest('hex'), 'utf8');
        const signatureHeader = headers().get('x-signature');

        if (!signatureHeader) {
            return NextResponse.json({ error: 'No signature' }, { status: 401 });
        }

        const signature = Buffer.from(signatureHeader, 'utf8');

        if (digest.length !== signature.length || !crypto.timingSafeEqual(digest, signature)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const payload = JSON.parse(text);
        const eventName = payload.meta.event_name;
        const customData = payload.meta.custom_data;

        console.log(`Received Lemon Squeezy webhook: ${eventName}`, customData);

        if (!customData || !customData.user_id) {
            // Some events might not have custom_data (e.g. ping), just ignore
            return NextResponse.json({ message: 'No user_id found, ignoring' }, { status: 200 });
        }

        const userId = customData.user_id;

        // Handle subscription events
        if (eventName === 'subscription_created' || eventName === 'subscription_updated' || eventName === 'subscription_payment_success') {
            const attributes = payload.data.attributes;
            const status = attributes.status; // 'active', 'past_due', etc.

            // For subscription_payment_success, the object is different, but let's focus on subscription objects
            // If it's payment success, we might want to extend the date. 
            // Usually subscription_updated is enough as it carries the new 'renews_at'

            const endsAt = attributes.ends_at;
            const renewsAt = attributes.renews_at;
            const currentPeriodEnd = endsAt || renewsAt;

            // Update Supabase
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                }
            );

            const { error } = await supabaseAdmin
                .from('subscriptions')
                .upsert({
                    user_id: userId,
                    status: status,
                    plan: 'pro_monthly',
                    current_period_end: currentPeriodEnd,
                    updated_at: new Date().toISOString(),
                    // Store the subscription ID to map future webhooks
                    lemon_squeezy_subscription_id: payload.data.id
                }, { onConflict: 'user_id' });

            if (error) {
                console.error('Supabase update error:', error);
                return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
            }

            console.log(`✅ Updated subscription for user ${userId} to ${status}`);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
