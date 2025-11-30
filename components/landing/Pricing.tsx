'use client';
import { Check } from 'lucide-react';

const plans = [
    {
        name: "Analytics",
        price: "$25",
        period: "/mo",
        description: "Keyword analysis, Product & Category tracking, Trend alerts, 2-year history, Watchlists, Data Export",
        cta: "Get Started",
        highlight: false,
        link: "/pricing"
    },
    {
        name: "Analytics + AI",
        price: "$39",
        period: "/mo",
        description: "Everything in Analytics plus AI-Powered data analysis",
        cta: "Book Discovery Call",
        highlight: true,
        badge: "Coming Soon",
        link: "https://calendly.com/keithkatale1/discovery-call"
    }
];

export default function Pricing() {
    return (
        <section id="pricing" className="py-20 bg-[#0A0A0C]">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-white mb-4">Simple and Transparent Pricing</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {plans.map((plan, i) => (
                        <div
                            key={i}
                            className={`rounded-2xl p-8 border ${plan.highlight ? 'bg-[#1A1A1E] border-[#FF6154] relative' : 'bg-[#151518] border-white/5'} flex flex-col`}
                        >
                            {plan.highlight && !plan.badge && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF6154] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                    Most Popular
                                </div>
                            )}
                            {plan.badge && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                                    {plan.badge}
                                </div>
                            )}

                            <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-bold text-white">{plan.price}</span>
                                <span className="text-gray-500">{plan.period}</span>
                            </div>

                            <div className="space-y-4 mb-8 flex-1">
                                {plan.description.split(', ').map((feature, j) => (
                                    <div key={j} className="flex items-start gap-3">
                                        <Check className="w-5 h-5 text-[#FF6154] shrink-0" />
                                        <span className="text-gray-300 text-sm">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <a
                                href={plan.link}
                                target={plan.link.startsWith('http') ? '_blank' : '_self'}
                                rel={plan.link.startsWith('http') ? 'noopener noreferrer' : ''}
                                className={`w-full py-3 rounded-lg font-bold transition-all text-center block ${plan.highlight ? 'bg-[#FF6154] hover:bg-[#ff4f40] text-white shadow-lg shadow-[#FF6154]/20' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                            >
                                {plan.cta}
                            </a>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-12">
                    <p className="text-gray-500 text-sm">
                        Enterprise: Custom dataset exports and SSO. <a href="#" className="text-white hover:underline">Contact sales.</a>
                    </p>
                </div>
            </div>
        </section>
    );
}
