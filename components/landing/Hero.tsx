'use client';
import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle, LayoutDashboard, Zap, Layers, TrendingUp, Archive, Settings, LogOut, Search } from 'lucide-react';
import Image from 'next/image';
import DashboardView from '@/components/desk/DashboardView';





export default function Hero() {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center bg-[#050505] pt-24 pb-20 px-4 sm:px-6">

            {/* Hero Card Container */}
            <div className="w-full max-w-[1700px] bg-[#0A0A0C] rounded-[40px] border border-white/10 relative overflow-hidden shadow-2xl">

                {/* Background Gradients - Deep Orange Theme (Confined to Card) */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[800px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#FF6154]/20 via-[#0A0A0C] to-[#0A0A0C] blur-[100px]" />
                    <div className="absolute bottom-0 left-0 w-full h-[600px] bg-gradient-to-t from-[#FF6154]/10 via-orange-900/5 to-transparent blur-[120px]" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[600px] bg-[#FF6154]/10 blur-[150px] rounded-full" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[600px] bg-orange-600/10 blur-[150px] rounded-full" />
                </div>

                <div className="relative z-10 flex flex-col items-center text-center pt-20 pb-0">

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col items-center max-w-5xl mx-auto mb-16 px-6"
                    >
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-medium text-white tracking-tighter mb-8 leading-[1.15]">
                            #1 Data Analysis Platform <br className="hidden md:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6154] to-orange-400">for Product Hunt</span>
                        </h1>

                        <p className="text-lg md:text-xl text-gray-400/80 mb-12 leading-[1.8] max-w-2xl font-light">
                            Real-time trend detection, a predictive momentum score, and launch playbooks built from every Top-10 that ever blew up.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            <a href="/pricing" className="bg-white text-black px-8 py-4 rounded-full text-lg font-bold transition-all hover:scale-105 hover:bg-gray-100 flex items-center justify-center gap-2">
                                Get Started <ArrowRight className="w-5 h-5" />
                            </a>
                        </div>

                        <p className="text-xs text-gray-500/70 tracking-wide">
                            Limited — we only run 10 paid audits/day. Book now or risk missing the launch window.
                        </p>
                    </motion.div>

                    {/* Dashboard App Shell Mock */}
                    <div className="relative w-full max-w-[1600px] mx-auto z-10 px-4 sm:px-8 pointer-events-none">
                        {/* Glow behind the dashboard */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#FF6154]/30 to-orange-600/30 rounded-2xl blur-2xl opacity-50" />

                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="relative w-full bg-[#0A0A0C] rounded-t-2xl border-t border-x border-white/10 overflow-hidden shadow-2xl flex h-[600px] md:h-[800px] text-left ring-1 ring-white/5"
                        >
                            {/* Sidebar Mock */}
                            <div className="w-64 border-r border-gray-800 bg-[#0A0A0C] hidden lg:flex flex-col shrink-0">
                                {/* Logo Area */}
                                <div className="h-16 border-b border-gray-800 flex items-center px-6 gap-2">
                                    <div className="relative w-8 h-8">
                                        <Image src="/logo.png" alt="Product Huntr Logo" fill className="object-contain" />
                                    </div>
                                    <span className="font-bold text-white tracking-tight">ProductHuntr</span>
                                </div>

                                {/* Nav Items Mock */}
                                <div className="p-4 space-y-1 flex-1">
                                    <div className="mb-6 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Platform
                                    </div>
                                    <div className="flex items-center gap-3 px-3 py-2 bg-[#FF6154]/10 text-[#FF6154] rounded-lg text-sm font-medium cursor-default">
                                        <LayoutDashboard className="w-5 h-5" /> Market Pulse
                                    </div>
                                    <div className="flex items-center gap-3 px-3 py-2 text-gray-500 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors cursor-default">
                                        <Zap className="w-5 h-5" /> AI Data Analysis
                                    </div>
                                    <div className="flex items-center gap-3 px-3 py-2 text-gray-500 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors cursor-default">
                                        <Layers className="w-5 h-5" /> Categories
                                    </div>
                                    <div className="flex items-center gap-3 px-3 py-2 text-gray-500 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors cursor-default">
                                        <TrendingUp className="w-5 h-5" /> Trends
                                    </div>
                                    <div className="flex items-center gap-3 px-3 py-2 text-gray-500 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors cursor-default">
                                        <Archive className="w-5 h-5" /> Archive
                                    </div>
                                </div>

                                {/* Bottom Actions */}
                                <div className="p-4 border-t border-gray-800 space-y-1">
                                    <div className="mb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Settings
                                    </div>
                                    <div className="flex items-center gap-3 px-3 py-2 text-gray-500 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors cursor-default">
                                        <Settings className="w-5 h-5" /> Settings
                                    </div>
                                    <div className="flex items-center gap-3 px-3 py-2 text-gray-500 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors cursor-default">
                                        <LogOut className="w-5 h-5" /> Sign Out
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Area */}
                            <div className="flex-1 flex flex-col bg-[#0A0A0C] min-w-0">
                                {/* Header Mock */}
                                <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 shrink-0 bg-[#0A0A0C]/80 backdrop-blur-md z-20">
                                    <div className="w-full max-w-md bg-gray-900/50 border border-gray-800 rounded-lg h-9 flex items-center px-3 text-gray-500 text-sm">
                                        <Search className="w-4 h-4 mr-2" />
                                        <span className="opacity-50">Search launches, makers, or trends...</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-xs font-medium text-green-400">System Operational</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Dashboard View Content */}
                                <div className="flex-1 overflow-y-auto p-6 bg-[#0A0A0C] scrollbar-hide">
                                    <DashboardView />
                                </div>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>

            {/* Bottom Section Text */}
            <div className="mt-24 text-center">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6">
                    Launch and Growth Ecosystem
                </h2>
            </div>
        </section>
    );
}
