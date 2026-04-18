'use client';

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Cell,
} from 'recharts';
import { Skeleton } from '@/components/ui';
import { formatNumber } from '@/lib/utils';

// Custom tooltip component
const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 dark:bg-slate-800 px-3 py-2 rounded-lg shadow-lg border border-slate-700">
        <p className="text-slate-400 text-xs mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: {formatNumber(entry.value)} {unit || ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Time Series Chart
interface TimeSeriesChartProps {
  data: { date: string; value: number; trend?: number }[];
  unit: string;
  color?: string;
  showTrend?: boolean;
  loading?: boolean;
  height?: number;
}

export function TimeSeriesChart({
  data,
  unit,
  color = '#0ea5e9',
  showTrend = true,
  loading = false,
  height = 400,
}: TimeSeriesChartProps) {
  if (loading) {
    return <Skeleton className={`w-full h-[${height}px]`} />;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
        <XAxis
          dataKey="date"
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatNumber(value, 1)}
        />
        <Tooltip content={<CustomTooltip unit={unit} />} />
        <Legend />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          name="Observed"
          activeDot={{ r: 4, fill: color }}
        />
        {showTrend && data[0]?.trend !== undefined && (
          <Line
            type="monotone"
            dataKey="trend"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Trend"
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// Climatology Chart (Monthly averages)
interface ClimatologyChartProps {
  data: { month: string; value: number; std?: number }[];
  unit: string;
  color?: string;
  loading?: boolean;
  height?: number;
}

export function ClimatologyChart({
  data,
  unit,
  color = '#10b981',
  loading = false,
  height = 300,
}: ClimatologyChartProps) {
  if (loading) {
    return <Skeleton className={`w-full h-[${height}px]`} />;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
        <XAxis
          dataKey="month"
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatNumber(value, 1)}
        />
        <Tooltip content={<CustomTooltip unit={unit} />} />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} name="Monthly Avg" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Anomaly Chart
interface AnomalyChartProps {
  data: { year: number; value: number; zScore: number; isAnomaly: boolean }[];
  unit: string;
  threshold?: number;
  loading?: boolean;
  height?: number;
}

export function AnomalyChart({
  data,
  unit,
  threshold = 2,
  loading = false,
  height = 350,
}: AnomalyChartProps) {
  if (loading) {
    return <Skeleton className={`w-full h-[${height}px]`} />;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
        <XAxis
          dataKey="year"
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          label={{ value: 'Z-Score', angle: -90, position: 'insideLeft', fill: '#64748b' }}
        />
        <Tooltip content={<CustomTooltip unit="σ" />} />
        <ReferenceLine y={threshold} stroke="#ef4444" strokeDasharray="5 5" />
        <ReferenceLine y={-threshold} stroke="#ef4444" strokeDasharray="5 5" />
        <ReferenceLine y={0} stroke="#64748b" />
        <Bar dataKey="zScore" name="Z-Score">
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.isAnomaly ? '#ef4444' : '#64748b'}
              opacity={entry.isAnomaly ? 1 : 0.6}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Forecast Chart
interface ForecastChartProps {
  historicalData: { date: string; value: number }[];
  forecastData: { date: string; value: number; lower: number; upper: number }[];
  unit: string;
  color?: string;
  loading?: boolean;
  height?: number;
}

export function ForecastChart({
  historicalData,
  forecastData,
  unit,
  color = '#8b5cf6',
  loading = false,
  height = 400,
}: ForecastChartProps) {
  if (loading) {
    return <Skeleton className={`w-full h-[${height}px]`} />;
  }

  // Combine data for display
  const combinedData = [
    ...historicalData.slice(-24).map((d) => ({ ...d, type: 'historical', forecast: null, lower: null, upper: null })),
    ...forecastData.map((d) => ({ date: d.date, value: null, forecast: d.value, lower: d.lower, upper: d.upper, type: 'forecast' })),
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={combinedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
        <XAxis
          dataKey="date"
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatNumber(value, 1)}
        />
        <Tooltip content={<CustomTooltip unit={unit} />} />
        <Legend />
        
        {/* Confidence interval */}
        <Area
          type="monotone"
          dataKey="upper"
          stroke="transparent"
          fill={color}
          fillOpacity={0.15}
          name="Upper 95% CI"
        />
        <Area
          type="monotone"
          dataKey="lower"
          stroke="transparent"
          fill="#1e293b"
          fillOpacity={1}
          name="Lower 95% CI"
        />
        
        {/* Lines */}
        <Line
          type="monotone"
          dataKey="value"
          stroke="#0ea5e9"
          strokeWidth={2}
          dot={false}
          name="Historical"
        />
        <Line
          type="monotone"
          dataKey="forecast"
          stroke={color}
          strokeWidth={2}
          dot={false}
          name="Forecast"
          strokeDasharray="5 5"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// Scenario Comparison Chart
interface ScenarioChartProps {
  data: {
    name: string;
    value: number;
    change: number;
    color: string;
  }[];
  baseline: number;
  unit: string;
  loading?: boolean;
  height?: number;
}

export function ScenarioChart({
  data,
  baseline,
  unit,
  loading = false,
  height = 300,
}: ScenarioChartProps) {
  if (loading) {
    return <Skeleton className={`w-full h-[${height}px]`} />;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 120, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
        <XAxis
          type="number"
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatNumber(value, 1)}
        />
        <YAxis
          type="category"
          dataKey="name"
          stroke="#64748b"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          width={110}
        />
        <Tooltip content={<CustomTooltip unit={unit} />} />
        <ReferenceLine x={baseline} stroke="#64748b" strokeDasharray="5 5" label={{ value: 'Baseline', fill: '#64748b', fontSize: 10 }} />
        <Bar dataKey="value" name="Projected Value" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Spatial Region Heatmap
interface SpatialMapProps {
  data: {
    variable_info: { color: string; name: string };
    value_range: { min: number | null; max: number | null };
    regions: Record<string, {
      value: number | null;
      name: string;
      zone: string;
      elevation_range: string;
      climate_zone: string;
    }>;
  };
  unit: string;
  loading?: boolean;
}

export function SpatialMap({ data, unit, loading = false }: SpatialMapProps) {
  if (loading) {
    return <Skeleton className="w-full h-64" />;
  }

  const zones = ['W', 'C', 'E'] as const;
  const zoneLabels = ['Western', 'Central', 'Eastern'];
  const elevations = ['6000', '4000', '2000'] as const;
  const elevationLabels = [
    { main: 'Alpine', sub: '4000m+' },
    { main: 'Temperate', sub: '2000–4000m' },
    { main: 'Subtropical', sub: '<2000m' },
  ];

  const { min, max } = data.value_range;
  const range = (max ?? 0) - (min ?? 0);

  const getBackground = (value: number | null): string => {
    if (value === null || min === null || max === null || range === 0) return '#475569';
    const ratio = Math.max(0, Math.min(1, (value - min) / range));
    // Blue (low) → Red (high)
    const r = Math.round(59 + ratio * (239 - 59));
    const g = Math.round(130 + ratio * (68 - 130));
    const b = Math.round(246 - ratio * 246);
    return `rgb(${r},${g},${b})`;
  };

  const getTextColor = (value: number | null): string => {
    if (value === null || min === null || max === null || range === 0) return '#e2e8f0';
    const ratio = (value - min) / range;
    return ratio > 0.35 ? '#ffffff' : '#1e293b';
  };

  return (
    <div className="space-y-2">
      {/* Column headers */}
      <div className="grid gap-2" style={{ gridTemplateColumns: '7rem repeat(3, 1fr)' }}>
        <div />
        {zoneLabels.map((label) => (
          <div key={label} className="text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
            {label}
          </div>
        ))}
      </div>

      {/* Region grid rows */}
      {elevations.map((elev, rowIdx) => (
        <div key={elev} className="grid gap-2 items-stretch" style={{ gridTemplateColumns: '7rem repeat(3, 1fr)' }}>
          {/* Row label */}
          <div className="flex flex-col justify-center text-right pr-3">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {elevationLabels[rowIdx].main}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {elevationLabels[rowIdx].sub}
            </span>
          </div>

          {zones.map((zone) => {
            const code = `${zone}${elev}`;
            const region = data.regions[code];
            const bg = getBackground(region?.value ?? null);
            const fg = getTextColor(region?.value ?? null);

            return (
              <div
                key={code}
                className="rounded-xl p-3 text-center transition-transform duration-200 hover:scale-105 cursor-default select-none"
                style={{ backgroundColor: bg, color: fg }}
                title={`${region?.name ?? code}: ${region?.value != null ? `${formatNumber(region.value, 2)} ${unit}` : 'No data'}`}
              >
                <div className="text-xs font-bold opacity-80">{code}</div>
                <div className="text-xl font-bold leading-tight mt-1">
                  {region?.value != null ? formatNumber(region.value, 1) : '–'}
                </div>
                <div className="text-xs opacity-70">{unit}</div>
                <div className="text-xs opacity-60 mt-1 truncate">{region?.climate_zone ?? ''}</div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Colour scale */}
      <div className="flex items-center gap-3 pt-3">
        <span className="text-xs text-slate-500 dark:text-slate-400 w-16 text-right">
          {min != null ? `${formatNumber(min, 1)} ${unit}` : '–'}
        </span>
        <div
          className="flex-1 h-3 rounded-full"
          style={{ background: 'linear-gradient(to right, rgb(59,130,246), rgb(239,68,68))' }}
        />
        <span className="text-xs text-slate-500 dark:text-slate-400 w-16">
          {max != null ? `${formatNumber(max, 1)} ${unit}` : '–'}
        </span>
      </div>
    </div>
  );
}

// Annual Trend Chart
interface AnnualChartProps {
  data: { year: number; value: number }[];
  unit: string;
  color?: string;
  loading?: boolean;
  height?: number;
}

export function AnnualChart({
  data,
  unit,
  color = '#f59e0b',
  loading = false,
  height = 300,
}: AnnualChartProps) {
  if (loading) {
    return <Skeleton className={`w-full h-[${height}px]`} />;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
        <XAxis
          dataKey="year"
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatNumber(value, 1)}
        />
        <Tooltip content={<CustomTooltip unit={unit} />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill="url(#colorValue)"
          name="Annual Average"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
