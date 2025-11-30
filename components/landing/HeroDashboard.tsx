'use client';

import { motion } from 'framer-motion';
import {
    Activity, BarChart2, Users, Globe, Zap,
    Search, Bell, Menu, ArrowUp, ArrowDown,
    MoreHorizontal
} from 'lucide-react';

const ChartLine = () => (
    <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
        <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FF6154" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#FF6154" stopOpacity="1" />
                <stop offset="100%" stopColor="#FF6154" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF6154" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#FF6154" stopOpacity="0" />
            </linearGradient>
        </defs>
        <motion.path
            d="M0,80 C50,80 50,40 100,40 C150,40 150,70 200,70 C250,70 250,20 300,20 C350,20 350,60 400,60"
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse", repeatDelay: 1 }}
        />
        <motion.path
            d="M0,80 C50,80 50,40 100,40 C150,40 150,70 200,70 C250,70 250,20 300,20 C350,20 350,60 400,60 V100 H0 Z"
            fill="url(#areaGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
        />
    </svg>
);

const StatCard = ({ title, value, change, icon: Icon, delay }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-[#1A1A1E] p-4 rounded-xl border border-white/5 flex flex-col justify-between"
    >
        <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-white/5 rounded-lg text-gray-400">
                <Icon size={16} />
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${change >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {change > 0 ? '+' : ''}{change}%
            </span>
        </div>
        <div>
            <div className="text-gray-500 text-xs mb-1">{title}</div>
            <div className="text-xl font-bold text-white">{value}</div>
        </div>
    </motion.div>
);

const ActivityItem = ({ i }: { i: number }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 + (i * 0.2) }}
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
    >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-xs font-bold text-white">
            {String.fromCharCode(65 + i)}
        </div>
        <div className="flex-1 min-w-0">
            <div className="h-2 w-24 bg-gray-700 rounded mb-1.5" />
            <div className="h-1.5 w-16 bg-gray-800 rounded" />
        </div>
        <div className="text-xs text-gray-600">2m</div>
    </motion.div>
);

export default function HeroDashboard() {
    return (
        <div className="relative w-full max-w-6xl mx-auto perspective-[2500px]">
            <motion.div
                initial={{ rotateX: 25, y: 40, opacity: 0, scale: 0.95 }}
                animate={{ rotateX: 15, y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="relative bg-[#0F0F12] rounded-xl border border-white/10 shadow-2xl overflow-hidden aspect-[16/10] transform-gpu"
                style={{
                    transformStyle: 'preserve-3d',
                    boxShadow: '0 50px 100px -20px rgba(0,0,0,0.7), 0 30px 60px -30px rgba(0,0,0,0.8), inset 0 1px 0 0 rgba(255,255,255,0.1)'
                }}
            >
                {/* Glass Reflection / Glare */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent opacity-50 pointer-events-none z-50" />
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent z-50" />

                {/* Dashboard Layout */}
                <div className="flex h-full">
                    {/* Sidebar */}
                    <div className="w-16 border-r border-white/5 flex flex-col items-center py-6 gap-6 bg-[#151518]">
                        <div className="w-8 h-8 rounded-lg bg-[#FF6154] flex items-center justify-center text-white font-bold">P</div>
                        <div className="flex-1 flex flex-col gap-4 w-full px-2">
                            {[Activity, BarChart2, Users, Globe, Zap].map((Icon, i) => (
                                <div key={i} className={`p-2 rounded-lg flex justify-center ${i === 0 ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                                    <Icon size={20} />
                                </div>
                            ))}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-800" />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col min-w-0 bg-[#0A0A0C]">
                        {/* Header */}
                        <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-[#0F0F12]">
                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                <Search size={16} />
                                <span>Search trends...</span>
                            </div>
                            <div className="flex items-center gap-4 text-gray-500">
                                <Bell size={16} />
                                <Menu size={16} />
                            </div>
                        </div>

                        {/* Content Scroll */}
                        <div className="flex-1 p-6 overflow-hidden">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-white">Market Overview</h2>
                                <div className="flex gap-2">
                                    <div className="px-3 py-1 rounded-md bg-white/5 text-xs text-gray-400">Today</div>
                                    <div className="px-3 py-1 rounded-md bg-[#FF6154] text-xs text-white">Live</div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <StatCard title="Active Launches" value="124" change={12} icon={Zap} delay={0.2} />
                                <StatCard title="Total Votes" value="8.5k" change={24} icon={Activity} delay={0.3} />
                                <StatCard title="Trending Topics" value="18" change={-5} icon={Globe} delay={0.4} />
                                <StatCard title="New Makers" value="450" change={8} icon={Users} delay={0.5} />
                            </div>

                            <div className="grid grid-cols-3 gap-6 h-[calc(100%-140px)]">
                                {/* Main Chart */}
                                <div className="col-span-2 bg-[#151518] rounded-xl border border-white/5 p-4 flex flex-col">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-medium text-gray-300">Vote Velocity</h3>
                                        <MoreHorizontal size={16} className="text-gray-500" />
                                    </div>
                                    <div className="flex-1 relative">
                                        <ChartLine />
                                        {/* Grid Lines */}
                                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className="w-full h-px bg-white/5" />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Activity Feed */}
                                <div className="col-span-1 bg-[#151518] rounded-xl border border-white/5 p-4 overflow-hidden">
                                    <h3 className="text-sm font-medium text-gray-300 mb-4">Live Activity</h3>
                                    <div className="space-y-2">
                                        {[...Array(6)].map((_, i) => (
                                            <ActivityItem key={i} i={i} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
