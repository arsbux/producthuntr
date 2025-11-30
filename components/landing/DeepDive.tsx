'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowRight } from 'lucide-react';

const sections = [
    {
        id: 'trends',
        title: "Trends",
        visual: "Radar & Rising Products",
        bullets: ["Hourly velocity", "Z-score spikes", "Referrer timeline"],
        cta: "Open Trends demo",
        color: "from-blue-500/20 to-blue-600/5"
    },
    {
        id: 'predictive',
        title: "Predictive Momentum",
        visual: "Scorecard UI",
        bullets: ["0–100 score", "Top contributing signals", "Confidence band"],
        cta: "See scoring logic",
        color: "from-yellow-500/20 to-yellow-600/5"
    },
    {
        id: 'ecosystem',
        title: "Ecosystem Maps",
        visual: "Network Graph",
        bullets: ["Maker repeats", "Investor links", "Launch co-occurrence"],
        cta: "Download example CSV",
        color: "from-purple-500/20 to-purple-600/5"
    }
];

export default function DeepDive() {
    const [activeSection, setActiveSection] = useState<string | null>('trends');

    return (
        <section className="py-20 bg-[#0F0F12]">
            <div className="max-w-7xl mx-auto px-6">
                <h2 className="text-3xl font-bold text-white mb-12">Deep Dive</h2>

                <div className="space-y-4">
                    {sections.map((section) => (
                        <div key={section.id} className="border border-white/10 rounded-2xl overflow-hidden bg-[#1A1A1E]">
                            <button
                                onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
                            >
                                <span className="text-xl font-bold text-white">{section.title}</span>
                                <ChevronDown className={`w-6 h-6 text-gray-400 transition-transform ${activeSection === section.id ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {activeSection === section.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="p-6 pt-0 border-t border-white/5 grid md:grid-cols-2 gap-8">
                                            {/* Visual Placeholder */}
                                            <div className={`aspect-video rounded-xl bg-gradient-to-br ${section.color} border border-white/10 flex items-center justify-center`}>
                                                <span className="text-white/50 font-mono">{section.visual}</span>
                                            </div>

                                            {/* Content */}
                                            <div className="flex flex-col justify-center">
                                                <ul className="space-y-4 mb-8">
                                                    {section.bullets.map((bullet, i) => (
                                                        <li key={i} className="flex items-center gap-3 text-gray-300">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#FF6154]" />
                                                            {bullet}
                                                        </li>
                                                    ))}
                                                </ul>
                                                <button className="text-white font-bold hover:text-[#FF6154] transition-colors flex items-center gap-2 self-start">
                                                    {section.cta} <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
