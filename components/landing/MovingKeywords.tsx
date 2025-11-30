'use client';

import { motion } from 'framer-motion';
import {
    Cpu, Zap, Code2, Cloud, Megaphone, Github, PenTool,
    Globe, Laptop, GraduationCap, Puzzle, Heart, Smartphone,
    Share2, Terminal, Layout, Monitor, Video, PenLine,
    Search, Box, CheckSquare, BarChart, DollarSign, Mic,
    Mail, Command, Users, Braces, CreditCard
} from 'lucide-react';

const categories = [
    { name: 'Artificial Intelligence', rank: 1, icon: Cpu, color: 'text-purple-400' },
    { name: 'Productivity', rank: 2, icon: Zap, color: 'text-blue-400' },
    { name: 'Developer Tools', rank: 3, icon: Code2, color: 'text-pink-400' },
    { name: 'SaaS', rank: 4, icon: Cloud, color: 'text-gray-400' },
    { name: 'Marketing', rank: 5, icon: Megaphone, color: 'text-orange-400' },
    { name: 'GitHub', rank: 6, icon: Github, color: 'text-white' },
    { name: 'Design Tools', rank: 7, icon: PenTool, color: 'text-purple-400' },
    { name: 'Open Source', rank: 8, icon: Globe, color: 'text-green-400' },
    { name: 'Tech', rank: 9, icon: Laptop, color: 'text-blue-400' },
    { name: 'Education', rank: 10, icon: GraduationCap, color: 'text-yellow-400' },
    { name: 'Chrome Extensions', rank: 11, icon: Puzzle, color: 'text-gray-400' },
    { name: 'Health & Fitness', rank: 12, icon: Heart, color: 'text-red-400' },
    { name: 'iOS', rank: 13, icon: Smartphone, color: 'text-white' },
    { name: 'Social Media', rank: 14, icon: Share2, color: 'text-blue-400' },
    { name: 'API', rank: 15, icon: Terminal, color: 'text-green-400' },
    { name: 'User Experience', rank: 16, icon: Layout, color: 'text-purple-400' },
    { name: 'Android', rank: 17, icon: Monitor, color: 'text-green-400' },
    { name: 'Video', rank: 18, icon: Video, color: 'text-red-400' },
    { name: 'Writing', rank: 19, icon: PenLine, color: 'text-white' },
    { name: 'SEO', rank: 20, icon: Search, color: 'text-orange-400' },
    { name: 'No-Code', rank: 21, icon: Box, color: 'text-pink-400' },
    { name: 'Task Management', rank: 22, icon: CheckSquare, color: 'text-blue-400' },
    { name: 'Analytics', rank: 23, icon: BarChart, color: 'text-purple-400' },
    { name: 'Sales', rank: 24, icon: DollarSign, color: 'text-green-400' },
    { name: 'Audio', rank: 25, icon: Mic, color: 'text-yellow-400' },
    { name: 'Email', rank: 26, icon: Mail, color: 'text-blue-400' },
    { name: 'Mac', rank: 27, icon: Command, color: 'text-gray-400' },
    { name: 'Hiring', rank: 28, icon: Users, color: 'text-white' },
    { name: 'Software Engineering', rank: 29, icon: Braces, color: 'text-blue-400' },
    { name: 'Fintech', rank: 30, icon: CreditCard, color: 'text-green-400' },
];

const MarqueeRow = ({ items, direction = 'left', speed = 20 }: { items: any[], direction?: 'left' | 'right', speed?: number }) => {
    return (
        <div className="flex gap-6 py-4 overflow-hidden relative w-full">
            <motion.div
                className="flex gap-6 flex-shrink-0"
                initial={{ x: direction === 'left' ? 0 : '-50%' }}
                animate={{ x: direction === 'left' ? '-50%' : 0 }}
                transition={{
                    duration: speed,
                    repeat: Infinity,
                    ease: "linear",
                    repeatType: "loop"
                }}
            >
                {[...items, ...items, ...items].map((item, i) => (
                    <div
                        key={`${item.name}-${i}`}
                        className="flex items-center gap-4 bg-[#151518] border border-white/5 px-6 py-4 rounded-xl min-w-[280px] hover:border-white/20 transition-colors shadow-lg"
                    >
                        <div className={`p-2 rounded-lg bg-white/5 ${item.color}`}>
                            <item.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <div className="font-bold text-white text-sm">{item.name}</div>
                            <div className="text-xs text-gray-500">Rank #{item.rank}</div>
                        </div>
                    </div>
                ))}
            </motion.div>
        </div>
    );
};

export default function MovingKeywords() {
    return (
        <div className="relative w-full h-[600px] overflow-hidden bg-[#0A0A0C] flex items-center justify-center perspective-[2000px]">
            {/* 3D Container */}
            <div
                className="relative transform-gpu rotate-[-5deg] skew-y-[-5deg] scale-110 w-[150%]"
                style={{ transformStyle: 'preserve-3d' }}
            >
                <MarqueeRow items={categories.slice(0, 10)} direction="left" speed={40} />
                <MarqueeRow items={categories.slice(10, 20)} direction="right" speed={50} />
                <MarqueeRow items={categories.slice(20, 30)} direction="left" speed={45} />
                <MarqueeRow items={categories.slice(0, 10)} direction="right" speed={55} />
            </div>

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-transparent to-[#0A0A0C] pointer-events-none z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0C] via-transparent to-[#0A0A0C] pointer-events-none z-10" />
        </div>
    );
}
