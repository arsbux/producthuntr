// Visitor Tracking Script
(function() {
    'use strict';

    // Check if Supabase library is loaded
    if (typeof window.supabase === 'undefined') {
        console.warn('Supabase library not loaded. Tracking disabled.');
        return;
    }

    // Check if configured
    if (!SUPABASE_CONFIG.url || SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL') {
        console.warn('Supabase not configured. Tracking disabled.');
        return;
    }

    // Initialize Supabase client with minimal auth
    const supabase = window.supabase.createClient(
        SUPABASE_CONFIG.url,
        SUPABASE_CONFIG.anonKey,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            },
            db: {
                schema: 'public'
            },
            global: {
                headers: {
                    'apikey': SUPABASE_CONFIG.anonKey,
                    'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
                }
            }
        }
    );

    // Generate or retrieve session ID
    function getSessionId() {
        let sessionId = sessionStorage.getItem('atomic_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('atomic_session_id', sessionId);
        }
        return sessionId;
    }

    // Get device information
    function getDeviceInfo() {
        const ua = navigator.userAgent;
        let deviceType = 'desktop';
        let browser = 'unknown';
        let os = 'unknown';

        // Detect device type
        if (/mobile/i.test(ua)) deviceType = 'mobile';
        else if (/tablet|ipad/i.test(ua)) deviceType = 'tablet';

        // Detect browser
        if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
        else if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
        else if (ua.indexOf('Safari') > -1) browser = 'Safari';
        else if (ua.indexOf('Edge') > -1) browser = 'Edge';
        else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident/') > -1) browser = 'IE';

        // Detect OS
        if (ua.indexOf('Win') > -1) os = 'Windows';
        else if (ua.indexOf('Mac') > -1) os = 'MacOS';
        else if (ua.indexOf('Linux') > -1) os = 'Linux';
        else if (ua.indexOf('Android') > -1) os = 'Android';
        else if (ua.indexOf('iOS') > -1 || ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS';

        return { deviceType, browser, os };
    }

    // Track visitor
    async function trackVisitor() {
        try {
            // Check if Supabase is configured
            if (!SUPABASE_CONFIG.url || SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL') {
                console.warn('Supabase not configured. Tracking disabled.');
                return null;
            }

            const sessionId = getSessionId();
            const deviceInfo = getDeviceInfo();

            const visitorData = {
                session_id: sessionId,
                page_url: window.location.href,
                page_title: document.title,
                referrer: document.referrer || 'direct',
                user_agent: navigator.userAgent,
                device_type: deviceInfo.deviceType,
                browser: deviceInfo.browser,
                os: deviceInfo.os,
                screen_width: window.screen.width,
                screen_height: window.screen.height,
                language: navigator.language || navigator.userLanguage
            };

            const { data, error } = await supabase
                .from('visitors')
                .insert([visitorData])
                .select()
                .single();

            if (error) {
                // Only log once to avoid console spam
                if (!window._atomicTrackingErrorLogged) {
                    console.error('❌ Tracking Error:', error.message || error);
                    if (error.code === '42501' || error.message?.includes('permission denied') || error.message?.includes('Unauthorized')) {
                        console.error('🔧 Fix: Run ultimate-fix.sql in Supabase SQL Editor');
                        console.error('📖 See: FIX_403_ERRORS.md for detailed instructions');
                    }
                    window._atomicTrackingErrorLogged = true;
                }
                return null;
            }

            // Store visitor ID for page view tracking
            sessionStorage.setItem('atomic_visitor_id', data.id);
            return data.id;
        } catch (err) {
            console.error('Error in trackVisitor:', err);
            return null;
        }
    }

    // Track page view with engagement metrics
    let pageStartTime = Date.now();
    let maxScrollDepth = 0;

    function updateScrollDepth() {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollDepth = Math.round(((scrollTop + windowHeight) / documentHeight) * 100);
        
        if (scrollDepth > maxScrollDepth) {
            maxScrollDepth = Math.min(scrollDepth, 100);
        }
    }

    // Track page view on unload
    async function trackPageView() {
        const visitorId = sessionStorage.getItem('atomic_visitor_id');
        if (!visitorId) return;

        // Check if Supabase is configured
        if (!SUPABASE_CONFIG.url || SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL') {
            return;
        }

        const timeOnPage = Math.round((Date.now() - pageStartTime) / 1000); // in seconds

        const pageViewData = {
            visitor_id: visitorId,
            page_url: window.location.href,
            page_title: document.title,
            time_on_page: timeOnPage,
            scroll_depth: maxScrollDepth
        };

        try {
            const { error } = await supabase
                .from('page_views')
                .insert([pageViewData]);
            
            if (error) {
                console.error('Error tracking page view:', error.message || error);
            }
        } catch (err) {
            console.error('Error tracking page view:', err);
        }
    }

    // Track CTA clicks
    function trackCTAClick(ctaType) {
        const visitorId = sessionStorage.getItem('atomic_visitor_id');
        if (!visitorId) return;

        // Check if Supabase is configured
        if (!SUPABASE_CONFIG.url || SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL') {
            return;
        }

        supabase
            .from('page_views')
            .insert([{
                visitor_id: visitorId,
                page_url: window.location.href,
                page_title: document.title,
                clicked_cta: true,
                cta_type: ctaType,
                time_on_page: Math.round((Date.now() - pageStartTime) / 1000),
                scroll_depth: maxScrollDepth
            }])
            .then(({ error }) => {
                if (error) {
                    console.error('Error tracking CTA click:', error.message || error);
                } else {
                    console.log('CTA click tracked:', ctaType);
                }
            })
            .catch(err => {
                console.error('Error tracking CTA click:', err);
            });
    }

    // Initialize tracking
    function init() {
        // Track visitor on page load
        trackVisitor();

        // Track scroll depth
        window.addEventListener('scroll', updateScrollDepth);
        updateScrollDepth(); // Initial check

        // Track page view on unload
        window.addEventListener('beforeunload', trackPageView);

        // Track CTA button clicks
        document.addEventListener('click', function(e) {
            const target = e.target.closest('.btn-primary, .btn-hero, .btn-cta-main');
            if (target) {
                const ctaText = target.textContent.trim();
                trackCTAClick(ctaText);
            }
        });

        // Track program card clicks
        document.addEventListener('click', function(e) {
            const programCard = e.target.closest('.program-card-link');
            if (programCard) {
                const programName = programCard.querySelector('h3')?.textContent || 'Unknown Program';
                trackCTAClick('Program Card: ' + programName);
            }
        });
    }

    // Start tracking when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose trackCTAClick for manual tracking
    window.AtomicTracker = {
        trackCTAClick: trackCTAClick
    };
})();
