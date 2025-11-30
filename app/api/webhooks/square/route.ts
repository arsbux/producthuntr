import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { WebhooksHelper } from 'square';

// Initialize Supabase Admin Client (Service Role)
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SIGNATURE_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY!;

export async function POST(request: Request) {
    try {
        const body = await request.text();
        const signature = request.headers.get('x-square-hmacsha256-signature');

        // Verify Webhook Signature
        const isValid = await (WebhooksHelper as any).verifySignature(
            body,
            signature!,
            SIGNATURE_KEY,
            process.env.NEXT_PUBLIC_APP_URL + '/api/webhooks/square'
        );

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const event = JSON.parse(body);
        console.log('Webhook received:', event.type);

        if (event.type === 'payment.updated') {
            const payment = event.data.object.payment;
            console.log('Payment update:', payment.status, payment.id);

            if (payment.status === 'COMPLETED') {
                console.log('Payment Completed:', payment.id);
                // Logic to update subscription would go here
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
