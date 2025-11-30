'use client';
import Link from 'next/link';
import { Twitter, Github, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-[#0A0A0C] border-t border-white/10 pt-20 pb-10">
            <div className="max-w-7xl mx-auto px-6">


                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-600 text-sm">© 2024 Product Huntr. All rights reserved.</p>
                    <div className="flex gap-8">
                        <Link href="#" className="text-gray-600 hover:text-white text-sm transition-colors">Privacy Policy</Link>
                        <Link href="#" className="text-gray-600 hover:text-white text-sm transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
