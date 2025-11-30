'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CheckoutButtonProps {
    plan: string;
    children: React.ReactNode;
    className?: string;
}

export default function CheckoutButton({ plan, children, className }: CheckoutButtonProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleCheckout = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent default if it's inside a link (though we should use button)
        setLoading(true);
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan }),
            });

            if (res.status === 401) {
                // User not logged in, redirect to signup/login
                router.push('/signup?redirect=/pricing');
                return;
            }

            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await res.json();
                if (data.url) {
                    window.location.href = data.url;
                } else {
                    throw new Error(data.error || 'Failed to create checkout session');
                }
            } else {
                const text = await res.text();
                console.error("Non-JSON response:", text);
                throw new Error("Server returned an error. Please check console for details.");
            }
        } catch (error: any) {
            console.error('Checkout Error:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button onClick={handleCheckout} disabled={loading} className={className}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : children}
        </button>
    );
}
