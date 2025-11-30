'use client';
import { ArrowRight } from 'lucide-react';

export default function CTAStrip() {
    return (
        <section className="py-24 bg-[#0F0F12] border-t border-white/5">
            <div className="max-w-4xl mx-auto px-6 text-center">
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 leading-tight">
                    Stop guessing. <br />
                    <span className="text-[#FF6154]">Start launching with confidence.</span>
                </h2>

                <button className="bg-[#FF6154] hover:bg-[#ff4f40] text-white px-10 py-5 rounded-full text-xl font-bold transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,97,84,0.4)] flex items-center justify-center gap-3 mx-auto">
                    Get a Launch Audit <ArrowRight className="w-6 h-6" />
                </button>
            </div>
        </section>
    );
}
