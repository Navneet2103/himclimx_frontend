import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, decimals: number = 2): string {
  if (isNaN(value) || !isFinite(value)) return '-';
  return value.toFixed(decimals);
}

export function formatPercent(value: number): string {
  if (isNaN(value) || !isFinite(value)) return '-';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function formatTrend(value: number, unit: string): string {
  if (isNaN(value) || !isFinite(value)) return '-';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(3)} ${unit}/decade`;
}

export function getRiskColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'critical':
      return '#ef4444';
    case 'high':
      return '#f97316';
    case 'moderate':
      return '#f59e0b';
    case 'low':
      return '#10b981';
    default:
      return '#6b7280';
  }
}

export function getRiskBgColor(level: string): string {
  switch (level.toLowerCase()) {
    case 'critical':
      return 'bg-red-500/10 text-red-400';
    case 'high':
      return 'bg-orange-500/10 text-orange-400';
    case 'moderate':
      return 'bg-amber-500/10 text-amber-400';
    case 'low':
      return 'bg-emerald-500/10 text-emerald-400';
    default:
      return 'bg-slate-500/10 text-slate-400';
  }
}

export function getTrendIcon(value: number): string {
  if (value > 0) return '📈';
  if (value < 0) return '📉';
  return '➡️';
}

export function getSignificanceLevel(pValue: number): string {
  if (pValue < 0.001) return 'Highly Significant';
  if (pValue < 0.01) return 'Very Significant';
  if (pValue < 0.05) return 'Significant';
  if (pValue < 0.1) return 'Marginally Significant';
  return 'Not Significant';
}

export function getSignificanceBadge(pValue: number): { label: string; color: string } {
  if (pValue < 0.01) return { label: 'p < 0.01', color: 'bg-emerald-500/10 text-emerald-400' };
  if (pValue < 0.05) return { label: 'p < 0.05', color: 'bg-sky-500/10 text-sky-400' };
  if (pValue < 0.1) return { label: 'p < 0.1', color: 'bg-amber-500/10 text-amber-400' };
  return { label: 'n.s.', color: 'bg-slate-500/10 text-slate-400' };
}

export function getYearRange(period: string, datasetEnd: number = 2020): { start: number; end: number } {
  const datasetStart = 1950;
  
  switch (period) {
    case 'last30':
      return { start: Math.max(datasetStart, datasetEnd - 30), end: datasetEnd };
    case 'last20':
      return { start: Math.max(datasetStart, datasetEnd - 20), end: datasetEnd };
    case 'last10':
      return { start: Math.max(datasetStart, datasetEnd - 10), end: datasetEnd };
    case 'full':
    default:
      return { start: datasetStart, end: datasetEnd };
  }
}

// Animation variants for framer-motion
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const slideInRight = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};
