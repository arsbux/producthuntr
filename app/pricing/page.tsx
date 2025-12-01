import Link from 'next/link';
import { Check, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';



const plans = [
    {
        name: "Analytics",
        price: "$1",
        period: "/mo",
        description: "Keyword analysis, Product & Category tracking, Trend alerts, 2-year history, Watchlists, Data Export",
        cta: "Get Started",
        highlight: false,
        link: "#",
        features: [
            "Keyword analysis",
            "Product & Category tracking",
            "Trend alerts",
            "2-year history",
            "Watchlists",
            "Data Export"
        ]
    },
    {
        name: "White Glove",
        price: "Custom",
        period: "",
        description: "Custom reporting, Custom data pipelines, Dedicated support, API Access",
        cta: "Book Discovery Call",
        highlight: true,
        badge: "",
        link: "https://calendly.com/keithkatale1/discovery-call",
        features: [
            "Custom reporting",
            "Custom data pipelines",
            "Dedicated support",
            "API Access"
        ]
    }
];

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-[#0A0A0C] text-white font-sans flex flex-col">
            <Navbar />

            <main className="flex-1 pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                            Simple and Transparent Pricing
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                            Choose the plan that fits your needs. Upgrade your launch strategy today.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {plans.map((plan, i) => (
                            <div
                                key={i}
                                className={`rounded-[32px] p-10 border ${plan.highlight ? 'bg-[#1A1A1E] border-[#FF6154] relative shadow-2xl shadow-[#FF6154]/10' : 'bg-[#151518] border-white/5'} flex flex-col transition-transform hover:scale-[1.02] duration-300`}
                            >
                                {plan.highlight && !plan.badge && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF6154] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide shadow-lg">
                                        Most Popular
                                    </div>
                                )}
                                {plan.badge && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide shadow-lg shadow-purple-500/20">
                                        {plan.badge}
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-bold text-white tracking-tight">{plan.price}</span>
                                        <span className="text-gray-500 text-lg">{plan.period}</span>
                                    </div>
                                </div>

                                <div className="space-y-5 mb-10 flex-1">
                                    {plan.features.map((feature, j) => (
                                        <div key={j} className="flex items-start gap-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${plan.highlight ? 'bg-[#FF6154]/20' : 'bg-white/10'}`}>
                                                <Check className={`w-3.5 h-3.5 ${plan.highlight ? 'text-[#FF6154]' : 'text-white'}`} />
                                            </div>
                                            <span className="text-gray-300 font-medium">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                {plan.cta === "Get Started" ? (
                                    <Link
                                        href={`/checkout?plan=analytics`}
                                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all text-center block ${plan.highlight ? 'bg-[#FF6154] hover:bg-[#ff4f40] text-white shadow-lg shadow-[#FF6154]/20' : 'bg-white text-black hover:bg-gray-100'}`}
                                    >
                                        {plan.cta}
                                    </Link>
                                ) : (
                                    <a
                                        href={plan.link}
                                        target={plan.link.startsWith('http') ? '_blank' : '_self'}
                                        rel={plan.link.startsWith('http') ? 'noopener noreferrer' : ''}
                                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all text-center block ${plan.highlight ? 'bg-[#FF6154] hover:bg-[#ff4f40] text-white shadow-lg shadow-[#FF6154]/20' : 'bg-white text-black hover:bg-gray-100'}`}
                                    >
                                        {plan.cta}
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-16">
                        <p className="text-gray-500">
                            Enterprise needs? <Link href="#" className="text-white hover:underline underline-offset-4">Contact sales</Link> for custom datasets and SSO.
                        </p>
                    </div>
                </div>
            </main>

            <Footer />


        </div>
    );
}
