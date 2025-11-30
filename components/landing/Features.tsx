'use client';
import { motion } from 'framer-motion';
import { TrendingUp, Zap, FileText, Network, ArrowRight } from 'lucide-react';
import LiveTrendsDemo from './LiveTrendsDemo';
import Image from 'next/image';
import MovingKeywords from './MovingKeywords';

import CategoriesGrid from '@/components/landing/CategoriesGrid';

export default function Features() {
    return (
        <section id="features" className="py-24 bg-[#0A0A0C]">
            <div className="max-w-7xl mx-auto px-6 space-y-40">

                {/* Feature 1: Trends (Live Demo) */}
                <div className="flex flex-col gap-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-left w-full"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
                            <span className="w-2 h-8 bg-[#FF6154] rounded-full"></span>
                            Live Keyword Tracking
                        </h2>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative w-full"
                    >
                        <LiveTrendsDemo />
                        {/* Decorative blob */}
                        <div className="absolute -inset-10 bg-blue-500/20 blur-3xl -z-10 rounded-full opacity-30" />
                    </motion.div>
                </div>

                {/* Feature 2: Product Details (Image) */}
                <div className="flex flex-col gap-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-left w-full"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
                            <span className="w-2 h-8 bg-green-500 rounded-full"></span>
                            Get every detail about any product
                        </h2>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative w-full max-w-6xl mx-auto"
                    >
                        <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                            <Image
                                src="/product.png"
                                alt="Product Detail View"
                                fill
                                className="object-cover"
                            />
                            {/* Gradient Blur Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0A0A0C] to-transparent" />
                        </div>
                        {/* Decorative blob */}
                        <div className="absolute -inset-10 bg-green-500/20 blur-3xl -z-10 rounded-full opacity-30" />
                    </motion.div>
                </div>

                {/* Feature 3: Moving Keywords (3D Marquee) */}
                <div className="flex flex-col gap-8 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-left w-full"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
                            <span className="w-2 h-8 bg-purple-500 rounded-full"></span>
                            Explore 50+ Categories
                        </h2>
                    </motion.div>

                    <div className="w-full -mx-6 md:-mx-0">
                        <MovingKeywords />
                    </div>

                    <div className="w-full pt-8">
                        <CategoriesGrid />
                    </div>
                </div>



            </div>
        </section>
    );
}
