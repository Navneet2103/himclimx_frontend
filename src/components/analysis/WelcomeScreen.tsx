'use client';

import React, { useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Mountain,
  TrendingUp,
  Thermometer,
  BarChart3,
  Zap,
  Globe,
  ChevronDown,
  PanelLeftOpen,
} from 'lucide-react';
import { Card } from '@/components/ui';
import { useDashboardStore } from '@/lib/store';

// Deterministic star positions (avoids hydration mismatch from Math.random)
const STARS = Array.from({ length: 110 }, (_, i) => ({
  id: i,
  x: (i * 137.508) % 100,
  y: (i * 79.3) % 65,
  size: ((i % 3) * 0.7 + 0.5),
  baseOpacity: ((i % 5) * 0.12 + 0.25),
  twinkleDuration: 2 + (i % 4) * 0.8,
  twinkleDelay: (i % 7) * 0.45,
}));

const SNOWFLAKES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  x: (i * 3.71) % 100,
  duration: 10 + (i % 8) * 1.8,
  delay: (i % 7) * 1.1,
  size: (i % 3) + 1,
  drift: (i % 2 === 0 ? 1 : -1) * ((i % 5) + 2),
}));

const features = [
  { icon: Mountain, title: 'Himalayan Coverage', description: '9 elevation zones across Eastern, Central, and Western Himalayas with full spatial resolution', color: '#0ea5e9' },
  { icon: BarChart3, title: 'Advanced Analytics', description: 'Trend analysis, anomaly detection, seasonal decomposition, and spatial patterns', color: '#10b981' },
  { icon: Globe, title: 'Interactive Visualizations', description: '2D maps, time series dashboards, and fully customizable charts', color: '#8b5cf6' },
  { icon: TrendingUp, title: 'AI-Powered Forecasting', description: 'Prophet-based time series forecasting and multi-scenario climate projections', color: '#f59e0b' },
  { icon: Zap, title: 'Impact Assessment', description: 'Risk evaluation and adaptation recommendations per variable and region', color: '#ef4444' },
];

const stats = [
  { label: 'Climate Variables', value: '10', icon: Thermometer },
  { label: 'Elevation Zones', value: '9', icon: Mountain },
  { label: 'Years of Data', value: '124+', icon: BarChart3 },
  { label: 'Analysis Types', value: '8', icon: TrendingUp },
];

export function WelcomeScreen() {
  const { toggleSidebar } = useDashboardStore();
  const heroRef = useRef<HTMLDivElement>(null);

  // Mouse position values (-1 to 1)
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const smoothX = useSpring(rawX, { stiffness: 55, damping: 22 });
  const smoothY = useSpring(rawY, { stiffness: 55, damping: 22 });

  // Parallax offsets per mountain layer (far = subtle, near = pronounced)
  const farX  = useTransform(smoothX, [-1, 1], [-10,  10]);
  const farY  = useTransform(smoothY, [-1, 1], [ -4,   4]);
  const midX  = useTransform(smoothX, [-1, 1], [-20,  20]);
  const midY  = useTransform(smoothY, [-1, 1], [ -9,   9]);
  const nearX = useTransform(smoothX, [-1, 1], [-32,  32]);
  const nearY = useTransform(smoothY, [-1, 1], [-15,  15]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set(((e.clientX - rect.left) / rect.width)  * 2 - 1);
    rawY.set(((e.clientY - rect.top)  / rect.height) * 2 - 1);
  }, [rawX, rawY]);

  const handleMouseLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  return (
    <div className="-m-6 lg:-m-8">

      {/* ═══════════════════════════════════════════════
          HERO — full viewport height, immersive mountain
      ═══════════════════════════════════════════════ */}
      <div
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative overflow-hidden select-none"
        style={{ height: 'calc(100vh - 4rem)' }}
      >

        {/* Sky gradient — deep night to twilight */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, #03071e 0%, #0d1b3e 30%, #162d52 60%, #1e3d6a 80%, #26507e 100%)',
          }}
        />

        {/* Aurora glow 1 (blue-cyan, breathes) */}
        <motion.div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{ height: '65%' }}
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div style={{
            width: '100%', height: '100%',
            background: 'radial-gradient(ellipse 80% 45% at 50% 15%, rgba(56,189,248,0.14) 0%, rgba(99,102,241,0.07) 55%, transparent 100%)',
          }} />
        </motion.div>

        {/* Aurora glow 2 (green, drifts slowly) */}
        <motion.div
          className="absolute top-0 left-0 right-0 pointer-events-none"
          style={{ height: '50%' }}
          animate={{ opacity: [0.25, 0.65, 0.25], scaleX: [0.85, 1.08, 0.85] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        >
          <div style={{
            width: '100%', height: '100%', transformOrigin: 'top center',
            background: 'radial-gradient(ellipse 55% 30% at 35% 10%, rgba(52,211,153,0.11) 0%, transparent 70%)',
          }} />
        </motion.div>

        {/* Stars */}
        <div className="absolute inset-0 pointer-events-none">
          {STARS.map((star) => (
            <motion.div
              key={star.id}
              className="absolute rounded-full bg-white"
              style={{
                left: `${star.x}%`,
                top:  `${star.y}%`,
                width:  star.size,
                height: star.size,
              }}
              animate={{ opacity: [star.baseOpacity, star.baseOpacity * 0.25, star.baseOpacity] }}
              transition={{
                duration: star.twinkleDuration,
                delay:    star.twinkleDelay,
                repeat:   Infinity,
                ease:     'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Snowflakes drifting down */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {SNOWFLAKES.map((flake) => (
            <motion.div
              key={flake.id}
              className="absolute rounded-full bg-white/70"
              style={{ left: `${flake.x}%`, width: flake.size, height: flake.size }}
              initial={{ y: -12, opacity: 0 }}
              animate={{
                y: [0, 1400],
                x: [0, flake.drift * 18, flake.drift * -8, flake.drift * 24],
                opacity: [0, 0.75, 0.75, 0],
              }}
              transition={{
                duration: flake.duration,
                delay:    flake.delay,
                repeat:   Infinity,
                ease:     'linear',
              }}
            />
          ))}
        </div>

        {/* ── Mountain layer 1: Far background (highest Himalayan peaks, snowy) ── */}
        <motion.div
          className="absolute bottom-0 w-full pointer-events-none"
          style={{ x: farX, y: farY }}
        >
          <svg
            viewBox="-120 0 1680 500"
            preserveAspectRatio="xMidYMax slice"
            className="w-full block"
          >
            <defs>
              <linearGradient id="wg-far" x1="0" y1="70" x2="0" y2="500" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#dbeafe" stopOpacity="0.92" />
                <stop offset="20%"  stopColor="#93c5fd" stopOpacity="0.82" />
                <stop offset="65%"  stopColor="#2d5a9e" stopOpacity="0.88" />
                <stop offset="100%" stopColor="#1a3a6e" stopOpacity="0.95" />
              </linearGradient>
            </defs>
            <path
              d="M-120,290
                 C-60,265 0,280 60,250
                 C120,220 155,235 200,200
                 C245,165 275,180 320,155
                 C365,130 395,145 440,125
                 C485,105 515,118 560,100
                 C605,82 640,96 685,78
                 C730,60 760,74 810,62
                 C860,50 895,65 945,56
                 C995,47 1030,62 1080,55
                 C1130,48 1165,65 1215,58
                 C1265,51 1305,70 1355,63
                 C1405,56 1450,75 1560,68
                 L1560,500 L-120,500 Z"
              fill="url(#wg-far)"
            />
          </svg>
        </motion.div>

        {/* ── Mountain layer 2: Mid range (secondary Himalayan ridges) ── */}
        <motion.div
          className="absolute bottom-0 w-full pointer-events-none"
          style={{ x: midX, y: midY }}
        >
          <svg
            viewBox="-120 0 1680 500"
            preserveAspectRatio="xMidYMax slice"
            className="w-full block"
          >
            <defs>
              <linearGradient id="wg-mid" x1="0" y1="155" x2="0" y2="500" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#e0f2fe" stopOpacity="0.88" />
                <stop offset="18%"  stopColor="#60a5fa" stopOpacity="0.75" />
                <stop offset="60%"  stopColor="#1a3560" stopOpacity="0.92" />
                <stop offset="100%" stopColor="#0d2040" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path
              d="M-120,355
                 C-40,330 30,348 110,295
                 C190,242 260,272 360,248
                 C460,224 530,258 640,232
                 C750,206 820,242 940,215
                 C1060,188 1130,228 1240,205
                 C1350,182 1430,225 1560,218
                 L1560,500 L-120,500 Z"
              fill="url(#wg-mid)"
            />
          </svg>
        </motion.div>

        {/* ── Mountain layer 3: Near foreground (dark silhouette, snow at peaks) ── */}
        <motion.div
          className="absolute bottom-0 w-full pointer-events-none"
          style={{ x: nearX, y: nearY }}
        >
          <svg
            viewBox="-120 0 1680 500"
            preserveAspectRatio="xMidYMax slice"
            className="w-full block"
          >
            <defs>
              <linearGradient id="wg-near" x1="0" y1="255" x2="0" y2="500" gradientUnits="userSpaceOnUse">
                <stop offset="0%"   stopColor="#f8fafc" stopOpacity="0.96" />
                <stop offset="12%"  stopColor="#94a3b8" stopOpacity="0.88" />
                <stop offset="35%"  stopColor="#1e293b" stopOpacity="0.97" />
                <stop offset="100%" stopColor="#020617" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path
              d="M-120,418
                 C-40,400 40,412 120,378
                 C200,344 268,365 360,340
                 C452,315 510,342 615,315
                 C720,288 788,320 895,295
                 C1002,270 1068,308 1175,282
                 C1282,256 1368,298 1460,278
                 C1500,270 1540,280 1560,276
                 L1560,500 L-120,500 Z"
              fill="url(#wg-near)"
            />
          </svg>
        </motion.div>

        {/* Bottom fade — blends mountains into content */}
        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{
            height: '140px',
            background: 'linear-gradient(to top, rgba(2,6,23,1) 0%, rgba(2,6,23,0.55) 55%, transparent 100%)',
          }}
        />

        {/* Atmospheric haze between peaks */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 100% 45% at 50% 100%, rgba(2,6,23,0.45) 0%, transparent 60%)',
          }}
        />

        {/* ── Hero text overlay ── */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          >
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8
                            bg-white/10 backdrop-blur-md border border-white/20 text-sky-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400" />
              </span>
              Ready for Analysis
            </div>

            {/* Title */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-white mb-4 leading-tight drop-shadow-2xl">
              Him
              <span className="bg-gradient-to-r from-sky-300 via-blue-200 to-indigo-300 bg-clip-text text-transparent">
                Clim
              </span>
              X
            </h1>

            <p className="text-lg sm:text-xl text-sky-100/80 max-w-lg mx-auto mb-3 font-light tracking-wide">
              Himalayas Climate Explorer
            </p>
            <p className="text-sm text-white/45 max-w-md mx-auto mb-10 leading-relaxed">
              124+ years of CRU climate data across 9 Himalayan zones — advanced analytics, AI-powered forecasting, and scenario projections.
            </p>

            {/* CTA */}
            <motion.button
              onClick={toggleSidebar}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-base font-semibold
                         bg-white/12 backdrop-blur-md border border-white/25 text-white
                         hover:bg-white/22 hover:border-white/45 transition-all duration-300
                         shadow-xl shadow-black/30"
            >
              <PanelLeftOpen className="w-5 h-5" />
              Open Analysis Panel
            </motion.button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/35 text-xs pointer-events-none"
          animate={{ y: [0, 7, 0], opacity: [0.35, 0.75, 0.35] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="tracking-widest uppercase text-[10px]">scroll</span>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </div>

      {/* ═══════════════════════════════════════════════
          CONTENT below hero
      ═══════════════════════════════════════════════ */}
      <div className="p-6 lg:p-8 bg-slate-50 dark:bg-slate-950">

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
        >
          {stats.map((stat) => (
            <Card key={stat.label} className="p-6 text-center">
              <stat.icon className="w-8 h-8 text-primary-500 mx-auto mb-3" />
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{stat.value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
            </Card>
          ))}
        </motion.div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 text-center">
            Key Features
          </h2>
          {/* Top row: 3 features */}
          <div className="grid md:grid-cols-3 gap-6 mb-6">
            {features.slice(0, 3).map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08 * index }}
              >
                <Card className="p-6 h-full">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${feature.color}18` }}
                  >
                    <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
          {/* Bottom row: 2 features centered */}
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
            {features.slice(3).map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08 * (index + 3) }}
              >
                <Card className="p-6 h-full">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${feature.color}18` }}
                  >
                    <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400"
        >
          <p className="mb-1">HimClimX — Himalayas Climate Explorer</p>
          <p>Applied Data Science Lab, Centre For Quantitative Economics and Data Science</p>
          <p>Birla Institute of Technology, Mesra</p>
          <p className="mt-2 text-slate-400 dark:text-slate-500">
            Managed by Navneet Kumar, Neeraj Maurya &amp; Dr. Manish Kumar Pandey
          </p>
          <p className="mt-1">© 2024 Himalayan Climate Research Initiative</p>
        </motion.footer>
      </div>
    </div>
  );
}
