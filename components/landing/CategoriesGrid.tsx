'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Cpu } from 'lucide-react';

const marqueeImages = [
    "/marquee/icon_1.avif",
    "/marquee/icon_2.avif",
    "/marquee/icon_3.avif",
    "/marquee/icon_4.avif",
    "/marquee/icon_5.avif",
    "/marquee/icon_6.avif",
    "/marquee/icon_7.avif",
    "/marquee/icon_8.avif",
    "/marquee/icon_9.avif",
    "/marquee/icon_10.avif",
    "/marquee/icon_11.avif",
    "/marquee/icon_12.avif",
    "/marquee/icon_13.avif",
    "/marquee/icon_14.avif",
    "/marquee/icon_16.avif",
    "/marquee/icon_17.avif",
    "/marquee/icon_18.avif",
    "/marquee/icon_20.avif",
    "/marquee/icon_21.avif"
];

const MarqueeRow = ({ images, duration, reverse = false }: { images: string[], duration: number, reverse?: boolean }) => (
    <div className="relative w-full overflow-hidden flex-shrink-0">
        <motion.div
            initial={{ x: reverse ? "-50%" : "0%" }}
            animate={{ x: reverse ? "0%" : "-50%" }}
            transition={{
                duration: duration,
                repeat: Infinity,
                ease: "linear"
            }}
            className="flex gap-4 pr-4"
        >
            {[...images, ...images].map((src, i) => (
                <div key={i} className="relative h-12 w-12 md:h-14 md:w-14 flex-shrink-0 rounded-xl overflow-hidden bg-white/5 border border-white/5 shadow-lg hover:scale-110 transition-transform duration-300">
                    <Image src={src} alt="" fill className="object-cover" />
                </div>
            ))}
        </motion.div>
    </div>
);

export default function CategoriesGrid() {
    const mid = Math.ceil(marqueeImages.length / 2);
    const row1 = marqueeImages.slice(0, mid);
    const row2 = marqueeImages.slice(mid);

    return (
        <div className="w-full max-w-[1400px] mx-auto p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 auto-rows-[minmax(300px,auto)]">

                {/* Card 1: One framework (Top Left, spans 2 cols) */}
                <div className="lg:col-span-2 bg-[#0A0A0C] rounded-[32px] border border-white/10 p-8 relative overflow-hidden group flex flex-col justify-between min-h-[400px]">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    {/* Marquee Rows */}
                    <div className="flex flex-col gap-4 mb-8 -mx-8">
                        <MarqueeRow images={row1} duration={20} />
                        <MarqueeRow images={row2} duration={25} reverse />
                    </div>

                    {/* Text Content */}
                    <div className="relative z-10 mt-auto">
                        <h3 className="text-3xl font-bold text-white mb-4 leading-tight">One dashboard, thousands of launches</h3>
                        <p className="text-gray-400 max-w-lg text-lg leading-relaxed">
                            Monitor the entire Product Hunt ecosystem. Track performance, analyze competitors, and discover breakout products in any category.
                        </p>
                    </div>
                </div>

                {/* Card 2: Process (Right, spans 2 rows) */}
                <div className="lg:row-span-2 bg-[#0A0A0C] rounded-[32px] border border-white/10 overflow-hidden flex flex-col relative group">
                    {/* Background Gradient Effect */}
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-purple-900/20 to-transparent opacity-50 pointer-events-none" />

                    <div className="p-8 pb-4 relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <Cpu className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 relative z-10 w-full min-h-[300px]">
                        <Image
                            src="/image.png"
                            alt="Process Visualization"
                            fill
                            className="object-contain object-top"
                        />
                    </div>
                </div>

                {/* Card 3: Chart Analysis (Bottom Left) */}
                <div className="bg-[#0A0A0C] rounded-[32px] border border-white/10 p-8 relative overflow-hidden group flex flex-col">
                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-purple-900/10 to-transparent opacity-80" />

                    {/* Chart Image */}
                    <div className="relative z-10 w-full flex-1 min-h-[200px] mb-6 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <Image
                            src="/chart.png"
                            alt="Data Chart Analysis"
                            fill
                            className="object-cover"
                        />
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-lg font-medium text-gray-400">Don't miss a point</h3>
                    </div>
                </div>

                {/* Card 4: AI Data Refactoring (Bottom Middle) */}
                <div className="bg-[#0A0A0C] rounded-[32px] border border-white/10 p-8 relative overflow-hidden flex flex-col">
                    <div className="relative z-10 mb-8">
                        <h3 className="text-xl font-bold text-white mb-2">AI-Powered Refactoring</h3>
                        <p className="text-gray-400 text-sm">
                            Our platform allows you to refactor through loads of data using advanced AI, turning chaos into structured insights.
                        </p>
                    </div>

                    {/* AI Graphic */}
                    <div className="relative flex-1 flex items-center justify-center min-h-[160px]">
                        <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full" />
                        <div className="relative w-full h-full">
                            <Image
                                src="/AI.png"
                                alt="AI Data Processing"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
