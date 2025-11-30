'use client';
import { motion } from 'framer-motion';
import { Database, Cpu, Rocket } from 'lucide-react';

const steps = [
    {
        title: "Collect",
        description: "We ingest Product Hunt, social signals, and creator activity every 5–15m.",
        icon: Database
    },
    {
        title: "Analyze",
        description: "Velocity, Z-score, acceleration, and category baselines produce the Predictive Momentum.",
        icon: Cpu
    },
    {
        title: "Action",
        description: "One-click audits, exportable datasets, and alert rules for immediate execution.",
        icon: Rocket
    }
];

export default function HowItWorks() {
    return (
        <section className="py-20 border-y border-white/5 bg-[#0F0F12]">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-white mb-4">How it works</h2>
                </div>

                <div className="grid md:grid-cols-3 gap-12 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.2 }}
                            className="relative flex flex-col items-center text-center"
                        >
                            <div className="w-24 h-24 rounded-2xl bg-[#1A1A1E] border border-white/10 flex items-center justify-center mb-6 relative z-10 shadow-xl">
                                <step.icon className="w-10 h-10 text-[#FF6154]" />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                                {step.description}
                            </p>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
}
