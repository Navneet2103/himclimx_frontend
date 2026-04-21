'use client';

import Image from 'next/image';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700/50">
      <div className="relative flex items-center justify-center h-full px-6">

        {/* Left: HimClimX brand */}
        <div className="absolute left-6 hidden sm:flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800 dark:text-white tracking-tight">
            HimClimX
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Himalayan Climate Explorer
          </span>
        </div>

        {/* Center: BIT Mesra logo + text */}
        <div className="flex items-center gap-3">
          <Image
            src="/bit-mesra-logo.png"
            alt="Birla Institute of Technology, Mesra"
            width={40}
            height={40}
            className="rounded-full object-contain flex-shrink-0"
            priority
          />
          <div className="hidden sm:block">
            <p className="text-xs font-semibold uppercase tracking-widest text-red-600 dark:text-red-400 leading-none">
              Birla Institute of Technology, Mesra
            </p>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mt-0.5">
              A Climate Research Initiative
            </p>
          </div>
        </div>

      </div>
    </header>
  );
}
