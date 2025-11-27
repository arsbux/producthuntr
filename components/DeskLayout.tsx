'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, Lightbulb, Sparkles, Menu, X } from 'lucide-react';
import Image from 'next/image';

interface DeskLayoutProps {
  children: React.ReactNode;
}

export default function DeskLayout({ children }: DeskLayoutProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/desk', label: 'Market Intelligence', icon: TrendingUp },
    { href: '/desk/idea-validator', label: 'Idea Validator', icon: Lightbulb },
    { href: '/desk/opportunities', label: 'Opportunities', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-neutral-200 z-50 px-4 md:px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 relative rounded-lg overflow-hidden">
            <Image src="/Favicon.png" alt="Logo" fill className="object-cover" />
          </div>
          <span className="font-bold text-neutral-900 text-lg hidden sm:block">Product Huntr</span>
        </div>

        {/* Desktop Navigation - Centered */}
        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/desk' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden pt-16">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <nav className="relative bg-white border-b border-neutral-200 p-4 space-y-1 shadow-xl">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/desk' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}
