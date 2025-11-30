'use client';
import { motion } from 'framer-motion';

const testimonials = [
    {
        quote: "Saved us hours and a misfired launch — actionable and specific.",
        author: "Head of Growth",
        role: "Seed SaaS"
    },
    {
        quote: "We found two investable early winners in a week.",
        author: "Angel Investor",
        role: "Early Stage"
    },
    {
        quote: "Their audits told us exactly which tweet to pin.",
        author: "Maker",
        role: "Indie Hacker"
    }
];

export default function Proof() {
    return (
        <section className="py-20 bg-[#0A0A0C]">
            <div className="max-w-7xl mx-auto px-6">

                <div className="text-center mb-16">
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-6">
                        "Trusted by launch teams to prioritize energy and budget on the launches that matter."
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-[#151518] p-8 rounded-xl border border-white/5"
                        >
                            <p className="text-gray-300 italic mb-6 text-lg">"{t.quote}"</p>
                            <div>
                                <div className="font-bold text-white">{t.author}</div>
                                <div className="text-sm text-gray-500">{t.role}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
}
