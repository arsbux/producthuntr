'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const screenshots = [
    { src: "/images/image.png", alt: "Dashboard Overview", span: "lg:col-span-2" },
    { src: "/images/image1.png", alt: "Analytics Detail", span: "lg:col-span-1" },
    { src: "/images/image2.png", alt: "Trend Analysis", span: "lg:col-span-1" },
    { src: "/images/image3.png", alt: "Market Insights", span: "lg:col-span-1" },
    { src: "/images/image4.png", alt: "Launch Performance", span: "lg:col-span-1" },
];

export default function ScreenshotsGrid() {
    return (
        <section className="py-24 bg-[#0A0A0C]">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold text-white mb-6"
                    >
                        Powerful Insights, <span className="text-[#FF6154]">Beautifully Presented</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-400 text-lg max-w-2xl mx-auto"
                    >
                        Experience a workspace designed for clarity and speed. Every metric you need, exactly where you expect it.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {screenshots.map((shot, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`relative group rounded-3xl overflow-hidden border border-white/10 bg-white/5 aspect-[4/3] ${shot.span}`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
                            <Image
                                src={shot.src}
                                alt={shot.alt}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
