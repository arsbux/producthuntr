'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, Twitter, Github } from 'lucide-react';

export default function Footer() {
    const pathname = usePathname();
    const currentYear = new Date().getFullYear();

    if (pathname?.startsWith('/desk')) {
        return null;
    }

    return (
        <footer className="bg-white dark:bg-hunted-card border-t border-gray-200 dark:border-hunted-border mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand Section */}
                    <div className="col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <img src="/Favicon.png" alt="Product Huntr" className="w-8 h-8 rounded-lg" />
                            <span className="font-bold text-lg text-gray-900 dark:text-hunted-text">Product Huntr</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-hunted-muted mb-4">
                            Discover your next big opportunity with Product Hunt data analytics and AI-powered insights.
                        </p>
                        <div className="flex items-center gap-3">
                            <a
                                href="https://twitter.com/producthuntr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-hunted-text transition-colors"
                            >
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a
                                href="https://github.com/arsbux/producthuntr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-hunted-text transition-colors"
                            >
                                <Github className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Product Links */}
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-hunted-text mb-4">Product</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/desk" className="text-sm text-gray-600 dark:text-hunted-muted hover:text-gray-900 dark:hover:text-hunted-text transition-colors">
                                    Market Intelligence
                                </Link>
                            </li>
                            <li>
                                <Link href="/desk/idea-validator" className="text-sm text-gray-600 dark:text-hunted-muted hover:text-gray-900 dark:hover:text-hunted-text transition-colors">
                                    Growth Workbench
                                </Link>
                            </li>
                            <li>
                                <Link href="/pricing" className="text-sm text-gray-600 dark:text-hunted-muted hover:text-gray-900 dark:hover:text-hunted-text transition-colors">
                                    Pricing
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-hunted-text mb-4">Legal</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link href="/terms" className="text-sm text-gray-600 dark:text-hunted-muted hover:text-gray-900 dark:hover:text-hunted-text transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="text-sm text-gray-600 dark:text-hunted-muted hover:text-gray-900 dark:hover:text-hunted-text transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support Section */}
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-hunted-text mb-4">Support</h3>
                        <ul className="space-y-3">
                            <li>
                                <a
                                    href="mailto:support@producthuntr.com"
                                    className="text-sm text-gray-600 dark:text-hunted-muted hover:text-gray-900 dark:hover:text-hunted-text transition-colors flex items-center gap-2"
                                >
                                    <Mail className="w-4 h-4" />
                                    support@producthuntr.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-gray-200 dark:border-hunted-border">
                    <p className="text-center text-sm text-gray-500 dark:text-hunted-muted">
                        © {currentYear} Product Huntr. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
