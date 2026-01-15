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
