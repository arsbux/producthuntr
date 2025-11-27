import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, path, referrer, userAgent, screenWidth, screenHeight, duration, type } = body;

        // Handle duration update
        if (type === 'duration_update' && id) {
            const { error } = await supabase
                .from('analytics_visits')
                .update({ duration_seconds: duration })
                .eq('id', id);

            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        // Handle new page view
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const userAgentHeader = request.headers.get('user-agent') || userAgent;

        // Vercel headers for location
        const country = request.headers.get('x-vercel-ip-country') || 'Unknown';
        const city = request.headers.get('x-vercel-ip-city') || 'Unknown';

        const deviceType = screenWidth < 768 ? 'mobile' : screenWidth < 1024 ? 'tablet' : 'desktop';

        const { data, error } = await supabase.from('analytics_visits').insert({
            page_path: path,
            user_agent: userAgentHeader,
            ip_address: ip,
            country: country,
            city: city,
            device_type: deviceType,
            referrer: referrer,
            duration_seconds: 0
        }).select('id').single();

        if (error) throw error;

        return NextResponse.json({ success: true, id: data.id });

    } catch (error: any) {
        console.error('Analytics Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
