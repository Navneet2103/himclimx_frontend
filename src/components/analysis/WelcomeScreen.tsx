'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Mountain, 
  TrendingUp, 
  Cloud, 
  Thermometer,
  Droplets,
  BarChart3,
  Zap,
  Globe
} from 'lucide-react';
import { Card } from '@/components/ui';

const features = [
  {
    icon: Mountain,
    title: 'Himalayan Coverage',
    description: 'Comprehensive data for 9 elevation zones across Eastern, Central, and Western Himalayas',
    color: '#0ea5e9',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Trend analysis, anomaly detection, seasonal decomposition, and spatial patterns',
    color: '#10b981',
  },
  {
    icon: Globe,
    title: 'Interactive Visualizations',
    description: '2D/3D maps, time series dashboards, and customizable charts',
    color: '#8b5cf6',
  },
  {
    icon: TrendingUp,
    title: 'AI-Powered Forecasting',
    description: 'Time series forecasting and climate scenario projections',
    color: '#f59e0b',
  },
  {
    icon: Zap,
    title: 'Impact Assessment',
    description: 'Risk evaluation and adaptation recommendations',
    color: '#ef4444',
  },
];

const stats = [
  { label: 'Climate Variables', value: '10', icon: Thermometer },
  { label: 'Elevation Zones', value: '9', icon: Mountain },
  { label: 'Years of Data', value: '70+', icon: BarChart3 },
  { label: 'Analysis Types', value: '8', icon: TrendingUp },
];

export function WelcomeScreen() {
  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 rounded-full text-primary-600 dark:text-primary-400 text-sm font-medium mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
          </span>
          Ready for Analysis
        </div>
        
        <h1 className="text-4xl lg:text-5xl font-display font-bold text-slate-900 dark:text-white mb-4">
          Welcome to{' '}
          <span className="bg-gradient-to-r from-primary-600 to-accent-purple bg-clip-text text-transparent">
            HimClimX
          </span>
        </h1>
        
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
          Himalayas Climate Explorer — Advanced climate analytics with AI-powered insights,
          comprehensive trend analysis, and interactive visualizations.
        </p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12"
      >
        {stats.map((stat, index) => (
          <Card key={stat.label} className="p-6 text-center">
            <stat.icon className="w-8 h-8 text-primary-500 mx-auto mb-3" />
            <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
              {stat.value}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {stat.label}
            </p>
          </Card>
        ))}
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 text-center">
          Key Features
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="p-6 h-full">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${feature.color}15` }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Getting Started */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="p-8 text-center bg-gradient-to-br from-primary-500/5 to-accent-purple/5">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            🚀 Get Started
          </h2>
          <p className="text-slate-600 dark:text-slate-300 max-w-xl mx-auto mb-6">
            Select a climate variable and geographic region from the sidebar, 
            choose your analysis options, and click <strong>"Run Analysis"</strong> to begin exploring the climate data.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
              <span className="text-lg">1️⃣</span>
              <span className="text-slate-700 dark:text-slate-200">Select Variable</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
              <span className="text-lg">2️⃣</span>
              <span className="text-slate-700 dark:text-slate-200">Choose Region</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
              <span className="text-lg">3️⃣</span>
              <span className="text-slate-700 dark:text-slate-200">Run Analysis</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400"
      >
        <p className="mb-2">HimClimX — Himalayas Climate Explorer</p>
        <p>Applied Data Science Lab, Centre For Quantitative Economics and Data Science</p>
        <p>Birla Institute of Technology, Mesra</p>
        <p className="mt-2">© 2024 Himalayan Climate Research Initiative</p>
      </motion.footer>
    </div>
  );
}
