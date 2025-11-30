import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const {
        data: { session },
    } = await supabase.auth.getSession();

    // Protected routes
    if (req.nextUrl.pathname.startsWith('/desk') || req.nextUrl.pathname.startsWith('/admin') || req.nextUrl.pathname.startsWith('/checkout')) {
        // 1. Require Authentication
        if (!session) {
            const redirectUrl = new URL('/login', req.url);
            redirectUrl.searchParams.set('returnUrl', req.nextUrl.pathname + req.nextUrl.search);
            return NextResponse.redirect(redirectUrl);
        }

        // 2. Require Subscription (only for /desk)
        if (req.nextUrl.pathname.startsWith('/desk')) {
            const { data: subscription } = await supabase
                .from('subscriptions')
                .select('status')
                .eq('user_id', session.user.id)
                .single();

            // If no active subscription, redirect to pricing
            if (!subscription || subscription.status !== 'active') {
                return NextResponse.redirect(new URL('/pricing', req.url));
            }
        }
    }

    return res;
}

export const config = {
    matcher: ['/desk/:path*', '/admin/:path*', '/checkout/:path*'],
};
