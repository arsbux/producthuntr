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

        // Log the incoming webhook
        await supabaseAdmin.from('webhook_logs').insert({
            event_id: event.event_id,
            event_type: event.type,
            payload: event,
            status: 'processing'
        });

        if (event.type === 'payment.updated') {
            const payment = event.data.object.payment;
            console.log('Payment update:', payment.status, payment.id);

            if (payment.status === 'COMPLETED') {
                console.log('Payment Completed:', payment.id);
                // Update log to success
                await supabaseAdmin.from('webhook_logs').update({
                    status: 'success',
                    error_message: `Payment completed: ${payment.id}`
                }).eq('event_id', event.event_id);
            } else if (payment.status === 'FAILED') {
                console.error('Payment Failed:', payment.id);
                // Update log to error
                await supabaseAdmin.from('webhook_logs').update({
                    status: 'error',
                    error_message: `Payment failed: ${payment.id}`
                }).eq('event_id', event.event_id);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Webhook Error:', error);

        // Try to log the system error if possible
        try {
            await supabaseAdmin.from('webhook_logs').insert({
                event_type: 'system_error',
                status: 'error',
                error_message: error.message
            });
        } catch (e) {
            // If DB log fails, just console log
            console.error('Failed to log error to DB:', e);
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
