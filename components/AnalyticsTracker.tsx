'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const startTimeRef = useRef<number>(Date.now());
    const hasTrackedRef = useRef<boolean>(false);

    const visitIdRef = useRef<string | null>(null);

    useEffect(() => {
        // Reset start time on path change
        startTimeRef.current = Date.now();
        hasTrackedRef.current = false;
        visitIdRef.current = null;

        // Track the page view immediately
        const trackPageView = async () => {
            try {
                const res = await fetch('/api/analytics/track', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        path: pathname,
                        referrer: document.referrer,
                        userAgent: navigator.userAgent,
                        screenWidth: window.screen.width,
                        screenHeight: window.screen.height,
                    }),
                });

                if (res.ok) {
                    const data = await res.json();
                    visitIdRef.current = data.id;
                    hasTrackedRef.current = true;
                }
            } catch (error) {
                console.error('Failed to track page view:', error);
            }
        };

        trackPageView();

        // Cleanup function to track duration when leaving the page
        return () => {
            if (hasTrackedRef.current && visitIdRef.current) {
                const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
                // Send duration update (optional, or just fire a separate 'leave' event)
                // For simplicity, we might just fire a 'ping' or 'leave' event.
                // However, reliably sending data on unmount is tricky (use beacon API).

                const data = JSON.stringify({
                    id: visitIdRef.current,
                    path: pathname,
                    duration: duration,
                    type: 'duration_update'
                });

                if (navigator.sendBeacon) {
                    navigator.sendBeacon('/api/analytics/track', data);
                } else {
                    fetch('/api/analytics/track', {
                        method: 'POST',
                        body: data,
                        keepalive: true,
                    }).catch(() => { });
                }
            }
        };
    }, [pathname, searchParams]);

    return null;
}
