'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  Sparkles,
  Rocket,
  Menu,
  X
} from 'lucide-react';
import Image from 'next/image';

interface DeskLayoutProps {
  children: React.ReactNode;
}

export default function DeskLayout({ children }: DeskLayoutProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/desk', label: 'Market Intelligence', icon: TrendingUp },
    { href: '/desk/idea-validator', label: 'Growth Workbench', icon: Rocket },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between relative">
          {/* Logo & Branding */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 relative rounded-lg overflow-hidden">
              <Image src="/Favicon.png" alt="Logo" fill className="object-cover" sizes="32px" />
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">Product Huntr</span>
          </div>

          {/* Desktop Navigation - Centered */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {navItems.map((item) => {
              const Icon = item.icon;
              let isActive = pathname === item.href;

              if (item.href === '/desk') {
                // Active if exactly /desk or sub-routes NOT belonging to other tabs
                isActive = pathname === '/desk' ||
                  (pathname?.startsWith('/desk') &&
                    !pathname?.startsWith('/desk/idea-validator') &&
                    !pathname?.startsWith('/desk/opportunities'));
              } else if (item.href !== '/') {
                isActive = pathname?.startsWith(item.href);
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                    ? 'bg-gray-900 text-white shadow-sm dark:bg-white dark:text-black'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg ml-auto"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 space-y-1 shadow-lg">
            {navItems.map((item) => {
              const Icon = item.icon;
              let isActive = false;

              if (item.href === '/desk') {
                isActive = pathname === '/desk' ||
                  (pathname.startsWith('/desk/') &&
                    !pathname.startsWith('/desk/idea-validator') &&
                    !pathname.startsWith('/desk/opportunities'));
              } else {
                isActive = pathname.startsWith(item.href);
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                    ? 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto">
        {children}
      </main>
    </div>
  );
}
