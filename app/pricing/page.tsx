import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';

export const metadata = {
    title: 'Pricing - ProductHuntr',
    description: 'Simple, transparent pricing for ProductHuntr Pro.',
};

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-black text-white font-sans">
            <div className="max-w-7xl mx-auto px-4 py-12">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-12"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Home
                </Link>

                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                        Simple, Transparent Pricing
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Get unlimited access to all ProductHuntr features with our Pro plan.
                    </p>
                </div>

                <div className="max-w-md mx-auto">
                    <div className="bg-[#1a1a1a] rounded-2xl border border-gray-800 p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-gradient-to-bl from-orange-500/20 to-transparent w-32 h-32 rounded-bl-full"></div>

                        <h3 className="text-2xl font-bold mb-2">Pro Monthly</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl font-bold">$29</span>
                            <span className="text-gray-400">/month</span>
                        </div>

                        <p className="text-gray-400 mb-8">
                            Everything you need to analyze Product Hunt trends and find your next big opportunity.
                        </p>

                        <Link
                            href="/checkout"
                            className="block w-full bg-white text-black text-center font-bold py-4 rounded-xl hover:bg-gray-100 transition-colors mb-8"
                        >
                            Get Started
                        </Link>

                        <div className="space-y-4">
                            {[
                                'Unlimited Trend Analysis',
                                'Market Gap Finder',
                                'Competitor Intelligence',
                                'Daily Launch Reports',
                                'Historical Data Access',
                                'Priority Support'
                            ].map((feature) => (
                                <div key={feature} className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3 h-3 text-green-500" />
                                    </div>
                                    <span className="text-gray-300">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="text-center text-gray-500 mt-8 text-sm">
                        14-day money-back guarantee. Cancel anytime.
                    </p>
                </div>
            </div>
        </div>
    );
}
