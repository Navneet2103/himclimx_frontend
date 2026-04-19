'use client';

import Image from 'next/image';
import { useDashboardStore } from '@/lib/store';

export function Header() {
  const { sidebarOpen } = useDashboardStore();

  return (
    <header
      className="fixed top-0 left-0 right-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700/50"
    >
      <div className="flex items-center gap-4 px-6 h-full">
        {/* BIT Mesra Logo */}
        <div className="flex-shrink-0">
          <Image
            src="/bit-mesra-logo.png"
            alt="Birla Institute of Technology, Mesra"
            width={40}
            height={40}
            className="rounded-full object-contain"
            priority
          />
        </div>

        {/* Text */}
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-600 dark:text-red-400 leading-none">
            Birla Institute of Technology, Mesra
          </p>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-0.5 truncate">
            A Climate Research Initiative
          </p>
        </div>

        {/* Divider + HimClimX branding on the right */}
        <div className="ml-auto flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:block h-8 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">
              HimClimX
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Himalayan Climate Explorer
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
