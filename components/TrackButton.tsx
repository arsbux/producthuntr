'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Bell, BellOff } from 'lucide-react';

export default function TrackButton({ productId }: { productId: string }) {
    const [isTracking, setIsTracking] = useState(false);
    const [loading, setLoading] = useState(true);
    const supabase = createClientComponentClient();

    useEffect(() => {
        checkTrackingStatus();
    }, [productId]);

    const checkTrackingStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        const { data } = await supabase
            .from('tracked_products')
            .select('*')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .single();

        setIsTracking(!!data);
        setLoading(false);
    };

    const toggleTracking = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            // Redirect to login or show auth modal
            return;
        }

        if (isTracking) {
            await supabase
                .from('tracked_products')
                .delete()
                .eq('user_id', user.id)
                .eq('product_id', productId);
            setIsTracking(false);
        } else {
            await supabase
                .from('tracked_products')
                .insert({ user_id: user.id, product_id: productId });
            setIsTracking(true);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <button disabled className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-800/50 text-gray-500 border border-gray-800">
                <Bell className="w-4 h-4" />
                Loading...
            </button>
        );
    }

    return (
        <button
            onClick={toggleTracking}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isTracking
                    ? 'bg-gray-800 text-white border border-gray-700 hover:bg-gray-700'
                    : 'bg-[#FF6154]/10 text-[#FF6154] border border-[#FF6154]/20 hover:bg-[#FF6154]/20'
                }`}
        >
            {isTracking ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            {isTracking ? 'Stop Tracking' : 'Track Product'}
        </button>
    );
}
