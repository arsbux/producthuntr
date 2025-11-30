'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, "change", (latest) => {
        setScrolled(latest > 50);
    });

    return (
        <motion.nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-md shadow-lg border-b border-white/10' : 'bg-transparent'}`}
        >
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8">
                        <Image src="/logo.png" alt="Product Huntr Logo" fill className="object-contain" />
                    </div>
                    <span className="font-bold text-white text-lg tracking-tight">Product Huntr</span>
                </div>

                {/* Links */}
                <div className="hidden md:flex items-center gap-8">
                    <Link href="#pricing" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Pricing</Link>
                    <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Login</Link>
                    <Link href="/pricing" className="bg-[#FF6154] hover:bg-[#ff4f40] text-white px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105 shadow-[0_0_15px_rgba(255,97,84,0.3)]">
                        Get Started
                    </Link>
                </div>
            </div>
        </motion.nav>
    );
}
