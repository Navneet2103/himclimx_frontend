'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, Badge, Skeleton } from '@/components/ui';
import { cn, formatNumber, formatPercent, getTrendIcon } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  change?: number;
  changeLabel?: string;
  icon?: string;
  color?: string;
  loading?: boolean;
  delay?: number;
}

export function StatCard({
  label,
  value,
  unit,
  change,
  changeLabel,
  icon,
  color = '#0ea5e9',
  loading = false,
  delay = 0,
}: StatCardProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-20" />
      </Card>
    );
  }

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="p-6 hover:shadow-elegant">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              {label}
            </p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {typeof value === 'number' ? formatNumber(value) : value}
              {unit && <span className="text-lg font-normal text-slate-500 dark:text-slate-400 ml-1">{unit}</span>}
            </p>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-2">
                {isPositive && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                {isNegative && <TrendingDown className="w-4 h-4 text-red-500" />}
                {!isPositive && !isNegative && <Minus className="w-4 h-4 text-slate-400" />}
                <span
                  className={cn(
                    'text-sm font-medium',
                    isPositive && 'text-emerald-500',
                    isNegative && 'text-red-500',
                    !isPositive && !isNegative && 'text-slate-400'
                  )}
                >
                  {formatPercent(change)}
                </span>
                {changeLabel && (
                  <span className="text-xs text-slate-400">{changeLabel}</span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <span className="text-3xl opacity-60">{icon}</span>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// Stats grid for overview
interface StatsGridProps {
  stats: {
    mean: number;
    max: number;
    min: number;
    std: number;
    count: number;
  };
  trend?: {
    per_decade: number;
    percent_change: number;
  };
  unit: string;
  loading?: boolean;
}

export function StatsGrid({ stats, trend, unit, loading = false }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Mean Value"
        value={stats.mean}
        unit={unit}
        icon="📊"
        loading={loading}
        delay={0}
      />
      <StatCard
        label="Maximum"
        value={stats.max}
        unit={unit}
        icon="📈"
        loading={loading}
        delay={0.1}
      />
      <StatCard
        label="Minimum"
        value={stats.min}
        unit={unit}
        icon="📉"
        loading={loading}
        delay={0.2}
      />
      <StatCard
        label="Trend / Decade"
        value={trend?.per_decade || 0}
        unit={unit}
        change={trend?.percent_change}
        changeLabel="per decade"
        icon={getTrendIcon(trend?.per_decade || 0)}
        loading={loading}
        delay={0.3}
      />
    </div>
  );
}

// Trend interpretation card
interface TrendInterpretationProps {
  trend: {
    per_decade: number;
    percent_change: number;
    r_squared: number;
    p_value: number;
  };
  variableName: string;
  unit: string;
}

export function TrendInterpretation({ trend, variableName, unit }: TrendInterpretationProps) {
  const isSignificant = trend.p_value < 0.05;
  const direction = trend.per_decade > 0 ? 'increasing' : trend.per_decade < 0 ? 'decreasing' : 'stable';

  // Confidence: (1 − p). Very small p-values (e.g. 1e-30) must be floored before
  // computing this — rounding to 6dp in an older backend would have truncated them to 0,
  // which wrongly shows 100%. Cap bar at 99.5% for visual clarity.
  const safeP = Math.max(trend.p_value, 1e-15);
  const confPct = (1 - safeP) * 100;
  const confBarWidth = Math.min(99.5, confPct);
  const confLabel = confPct >= 99.9 ? '>99.9%' : `${formatNumber(confPct, 1)}%`;
  const pLabel = trend.p_value < 0.001 ? '< 0.001' : trend.p_value.toFixed(4);

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        📊 Trend Interpretation
      </h3>

      <div className="space-y-4">
        <p className="text-slate-600 dark:text-slate-300">
          {variableName} shows a{' '}
          <span className={cn(
            'font-semibold',
            direction === 'increasing' && 'text-red-500',
            direction === 'decreasing' && 'text-blue-500',
            direction === 'stable' && 'text-slate-500'
          )}>
            {direction}
          </span>{' '}
          trend of{' '}
          <span className="font-semibold">
            {formatNumber(Math.abs(trend.per_decade), 3)} {unit}
          </span>{' '}
          per decade ({formatPercent(trend.percent_change)} change).
        </p>

        <div className="flex flex-wrap gap-2">
          <Badge variant={isSignificant ? 'success' : 'warning'}>
            {isSignificant ? 'Statistically Significant' : 'Not Significant'}
          </Badge>
          <Badge variant="info">
            p = {pLabel}
          </Badge>
          <Badge variant="default">
            R² = {formatNumber(trend.r_squared, 3)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Explained Variance (R²)</p>
            <div className="mt-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-500"
                style={{ width: `${trend.r_squared * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              {formatNumber(trend.r_squared * 100, 1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Statistical Confidence (1−p)</p>
            <div className="mt-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${confBarWidth}%` }}
              />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{confLabel}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
