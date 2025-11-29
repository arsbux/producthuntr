'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Zap,
  Search,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function DeskLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { name: 'Market Pulse', href: '/desk', icon: LayoutDashboard },
    { name: 'Idea Validator', href: '/desk/idea-validator', icon: Zap },
    { name: 'Trends', href: '/desk/trends', icon: TrendingUp },
    { name: 'Analytics', href: '/desk/analytics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex font-sans text-gray-300 selection:bg-[#FF6154] selection:text-white">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--bg-panel)] border-r border-[var(--border-subtle)] transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6154] to-[#ff4f40] flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(255,97,84,0.3)]">
                P
              </div>
              <span className="font-bold text-white tracking-tight">ProductHuntr</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            <div className="mb-6 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Platform
            </div>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-[#FF6154]' : 'text-gray-500'}`} />
                  {item.name}
                </Link>
              );
            })}

            <div className="mt-8 mb-2 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Settings
            </div>
            <Link href="/desk/settings" className="nav-item">
              <Settings className="w-5 h-5 text-gray-500" />
              Settings
            </Link>
          </nav>

          {/* User Profile / Logout */}
          <div className="p-4 border-t border-[var(--border-subtle)]">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64 transition-all duration-300">
        {/* Top Header */}
        <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-[var(--bg-app)]/80 backdrop-blur-md border-b border-[var(--border-subtle)] flex items-center justify-between px-4 lg:px-8 z-40 transition-all duration-300">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 text-gray-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Global Search */}
          <div className="flex-1 max-w-xl mx-4 lg:mx-0">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-[#FF6154] transition-colors" />
              <input
                type="text"
                placeholder="Search launches, makers, or trends..."
                className="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-[#FF6154]/50 focus:ring-1 focus:ring-[#FF6154]/50 transition-all placeholder:text-gray-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-400">System Operational</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 mt-16">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
