'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDashboardStore } from '@/lib/store';
import { VARIABLES, REGIONS, MONTHS } from '@/lib/constants';
import { Card, Tabs, Badge, Spinner, EmptyState } from '@/components/ui';
import {
  TimeSeriesChart,
  ClimatologyChart,
  AnomalyChart,
  ForecastChart,
  ScenarioChart,
  AnnualChart,
  SpatialMap,
} from './Charts';
import { SatelliteHeatmap } from './SatelliteHeatmap';
import { StatsGrid, TrendInterpretation } from './StatCards';
import { formatNumber, formatPercent } from '@/lib/utils';

// Tab definitions
const getTabsForOptions = (options: any) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  ];
  
  if (options.spatial) {
    tabs.push({ id: 'spatial', label: 'Spatial Map', icon: '🗺️' });
  }
  if (options.trendAnalysis) {
    tabs.push({ id: 'trends', label: 'Trends', icon: '📈' });
  }
  if (options.anomalyDetection) {
    tabs.push({ id: 'anomalies', label: 'Anomalies', icon: '🚨' });
  }
  if (options.forecasting) {
    tabs.push({ id: 'forecast', label: 'Forecast', icon: '🔮' });
  }
  if (options.climateScenarios) {
    tabs.push({ id: 'scenarios', label: 'Scenarios', icon: '🌍' });
  }
  if (options.climateImpact) {
    tabs.push({ id: 'impact', label: 'Impact', icon: '⚠️' });
  }
  
  tabs.push({ id: 'report', label: 'Report', icon: '📄' });
  
  return tabs;
};

interface MannKendall {
  trend: string;
  p_value: number;
  tau: number;
  z_statistic: number;
}

interface TrendData {
  slope: number;
  intercept: number;
  r_squared: number;
  p_value: number;
  per_decade: number;
  percent_change: number;
  std_err?: number;
  sens_slope?: number;
  sens_per_decade?: number;
  mann_kendall?: MannKendall;
  annual_values?: number[];
  annual_years?: number[];
}

interface AnalysisTabsProps {
  data: {
    timeSeries?: { times: string[]; values: number[] };
    statistics?: { mean: number; median: number; min: number; max: number; std: number; count: number };
    trend?: TrendData;
    climatology?: { months: string[]; values: number[]; std: number[] };
    anomalies?: { years: number[]; values: number[]; z_scores: number[]; anomalies: any[]; threshold: number };
    forecast?: { dates: string[]; values: number[]; lower: number[]; upper: number[]; trend: string; method?: string; change_rate?: number };
    scenarios?: { ssp1: any; ssp2: any; ssp3: any; ssp5: any; baseline: number };
    impact?: { risk_level: string; risk_score: number; impact_areas: string[]; recommendations: any[]; sector_vulnerability: Record<string, number> };
    spatial?: {
      variable_info: { color: string; name: string };
      value_range: { min: number | null; max: number | null };
      time_range?: { start: string | null; end: string | null };
      gridded?: { lats: number[]; lons: number[]; values: (number | null)[][] };
      regions: Record<string, { value: number | null; name: string; zone: string; elevation_range: string; climate_zone: string }>;
    };
  };
  loading?: boolean;
}

export function AnalysisTabs({ data, loading = false }: AnalysisTabsProps) {
  const {
    selectedVariable,
    selectedRegion,
    startYear,
    endYear,
    analysisOptions,
    activeTab,
    setActiveTab,
    analysisResult,
  } = useDashboardStore();

  // Use the year range that was actually analysed (stored in analysisResult, not persisted)
  // Falls back to store values only if analysisResult is not yet available
  const displayStartYear = analysisResult?.startYear ?? startYear;
  const displayEndYear   = analysisResult?.endYear   ?? endYear;

  const variable = VARIABLES[selectedVariable];
  const region = REGIONS[selectedRegion];
  const tabs = getTabsForOptions(analysisOptions);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-slate-500 dark:text-slate-400">Analyzing climate data...</p>
        </div>
      </div>
    );
  }

  // Monthly chart data (with trend overlay per point)
  const timeSeriesData = data.timeSeries?.times.map((time, i) => {
    const year = new Date(time).getFullYear();
    const trendValue = data.trend
      ? data.trend.intercept + data.trend.slope * year
      : undefined;
    return {
      date: new Date(time).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
      value: data.timeSeries!.values[i],
      trend: trendValue,
    };
  }) || [];

  // Annual aggregated data with 11-year centred moving average and OLS trend line
  const annualData = useMemo(() => {
    if (!data.timeSeries) return [];
    const yearMap = new Map<number, number[]>();
    data.timeSeries.times.forEach((time, i) => {
      const year = new Date(time).getFullYear();
      const v = data.timeSeries!.values[i];
      if (v !== null && v !== undefined && !isNaN(v)) {
        if (!yearMap.has(year)) yearMap.set(year, []);
        yearMap.get(year)!.push(v);
      }
    });
    const sorted = Array.from(yearMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, vals]) => ({
        year,
        mean: vals.reduce((a, b) => a + b, 0) / vals.length,
      }));

    return sorted.map((item, idx) => {
      const trendValue = data.trend
        ? parseFloat((data.trend.intercept + data.trend.slope * item.year).toFixed(3))
        : undefined;

      // 11-year centred moving average (±5 years)
      const half = 5;
      const start = Math.max(0, idx - half);
      const end = Math.min(sorted.length - 1, idx + half);
      const slice = sorted.slice(start, end + 1);
      const movingAvg = parseFloat(
        (slice.reduce((s, d) => s + d.mean, 0) / slice.length).toFixed(3)
      );

      return {
        date: item.year.toString(),
        value: parseFloat(item.mean.toFixed(3)),
        trend: trendValue,
        movingAvg,
      };
    });
  }, [data.timeSeries, data.trend]);

  const climatologyData = data.climatology?.months.map((month, i) => ({
    month,
    value: data.climatology!.values[i],
    std: data.climatology!.std[i],
  })) || [];

  const anomalyData = data.anomalies?.years.map((year, i) => ({
    year,
    value: data.anomalies!.values[i],
    zScore: data.anomalies!.z_scores[i],
    isAnomaly: Math.abs(data.anomalies!.z_scores[i]) > data.anomalies!.threshold,
  })) || [];

  const scenarioData = data.scenarios ? [
    { name: data.scenarios.ssp1.name, value: data.scenarios.ssp1.future_value, change: data.scenarios.ssp1.percent_change, color: '#10b981' },
    { name: data.scenarios.ssp2.name, value: data.scenarios.ssp2.future_value, change: data.scenarios.ssp2.percent_change, color: '#f59e0b' },
    { name: data.scenarios.ssp3.name, value: data.scenarios.ssp3.future_value, change: data.scenarios.ssp3.percent_change, color: '#ef4444' },
    { name: data.scenarios.ssp5.name, value: data.scenarios.ssp5.future_value, change: data.scenarios.ssp5.percent_change, color: '#b91c1c' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
            {variable?.icon} {variable?.name} Analysis
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {region?.icon} {region?.name} • {displayStartYear} – {displayEndYear}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="info">{variable?.unit}</Badge>
          <Badge variant="default">{region?.climateZone}</Badge>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'dashboard' && (
          <DashboardTab
            data={data}
            variable={variable}
            timeSeriesData={timeSeriesData}
            climatologyData={climatologyData}
          />
        )}

        {activeTab === 'spatial' && data.spatial && (
          <SpatialTab data={data} variable={variable} selectedRegion={selectedRegion} />
        )}

        {activeTab === 'trends' && data.trend && (
          <TrendsTab data={data} variable={variable} annualData={annualData} />
        )}

        {activeTab === 'anomalies' && data.anomalies && (
          <AnomaliesTab data={data} variable={variable} anomalyData={anomalyData} />
        )}

        {activeTab === 'forecast' && data.forecast && data.timeSeries && (
          <ForecastTab data={data} variable={variable} />
        )}

        {activeTab === 'scenarios' && data.scenarios && (
          <ScenariosTab data={data} variable={variable} scenarioData={scenarioData} />
        )}

        {activeTab === 'impact' && data.impact && (
          <ImpactTab data={data} variable={variable} region={region} />
        )}

        {activeTab === 'report' && (
          <ReportTab data={data} variable={variable} region={region} startYear={startYear} endYear={endYear} />
        )}
      </motion.div>
    </div>
  );
}

// Dashboard Tab
function DashboardTab({ data, variable, timeSeriesData, climatologyData }: any) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      {data.statistics && (
        <StatsGrid
          stats={data.statistics}
          trend={data.trend}
          unit={variable.unit}
        />
      )}

      {/* Time Series Chart */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
          📈 Time Series
        </h3>
        <TimeSeriesChart
          data={timeSeriesData}
          unit={variable.unit}
          color={variable.color}
          showTrend={!!data.trend}
        />
      </Card>

      {/* Climatology */}
      {climatologyData.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
            📅 Monthly Climatology
          </h3>
          <ClimatologyChart
            data={climatologyData}
            unit={variable.unit}
            color={variable.color}
          />
        </Card>
      )}

      {/* Trend Interpretation */}
      {data.trend && (
        <TrendInterpretation
          trend={data.trend}
          variableName={variable.name}
          unit={variable.unit}
        />
      )}
    </div>
  );
}

// Trends Tab
function TrendsTab({ data, variable, annualData }: any) {
  const trend = data.trend;
  const mk = trend?.mann_kendall;
  const pLabel = (p: number) => p < 0.001 ? '< 0.001' : p.toFixed(4);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
          📈 Trend Analysis — Annual Means
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Annual means (blue) + 11-year moving average (amber) + OLS linear trend (red dashed).
          Monthly data is in the Dashboard tab.
        </p>
        <TimeSeriesChart
          data={annualData}
          unit={variable.unit}
          color={variable.color}
          showTrend={true}
          showMovingAvg={true}
          height={450}
        />
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="font-medium text-slate-900 dark:text-white mb-4">OLS Linear Regression</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Trend per decade</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {formatNumber(trend.per_decade, 4)} {variable.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Percent change</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {formatPercent(trend.percent_change)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">R²</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {formatNumber(trend.r_squared, 4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">P-value</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {pLabel(trend.p_value)}
              </span>
            </div>
            {trend.sens_per_decade !== undefined && (
              <>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">
                    Sen's Slope (Robust Estimator)
                  </p>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Sen's slope/decade</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {formatNumber(trend.sens_per_decade, 4)} {variable.unit}
                  </span>
                </div>
              </>
            )}
            {mk && (
              <>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-3 mt-3">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">
                    Mann-Kendall Non-Parametric Test
                  </p>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Direction</span>
                  <span className="font-medium capitalize text-slate-900 dark:text-white">{mk.trend}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Kendall's τ</span>
                  <span className="font-medium text-slate-900 dark:text-white">{formatNumber(mk.tau, 4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">P-value</span>
                  <span className="font-medium text-slate-900 dark:text-white">{pLabel(mk.p_value)}</span>
                </div>
              </>
            )}
          </div>
        </Card>

        <TrendInterpretation
          trend={trend}
          variableName={variable.name}
          unit={variable.unit}
        />
      </div>
    </div>
  );
}

// Anomalies Tab
function AnomaliesTab({ data, variable, anomalyData }: any) {
  const anomalyCount = data.anomalies.anomalies.length;
  const totalYears = data.anomalies.years.length;
  const anomalyRate = (anomalyCount / totalYears) * 100;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalYears}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Total Years</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{anomalyCount}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Anomalies Detected</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{formatNumber(anomalyRate, 1)}%</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Anomaly Rate</p>
        </Card>
      </div>

      {/* Chart */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
          🚨 Anomaly Detection (Z-Score &gt; {data.anomalies.threshold})
        </h3>
        <AnomalyChart
          data={anomalyData}
          unit={variable.unit}
          threshold={data.anomalies.threshold}
        />
      </Card>

      {/* Anomaly List */}
      {anomalyCount > 0 && (
        <Card className="p-6">
          <h4 className="font-medium text-slate-900 dark:text-white mb-4">Detected Anomalies</h4>
          <div className="max-h-64 overflow-y-auto scrollbar-thin space-y-2">
            {data.anomalies.anomalies.map((a: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
              >
                <div>
                  <span className="font-medium text-slate-900 dark:text-white">{a.year}</span>
                  <Badge variant={a.type === 'high' ? 'danger' : 'info'} className="ml-2">
                    {a.type === 'high' ? 'High' : 'Low'}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {formatNumber(a.value)} {variable.unit}
                  </p>
                  <p className="text-sm text-slate-500">z = {formatNumber(a.z_score, 2)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// Spatial Tab
function SpatialTab({ data, variable, selectedRegion }: any) {
  const hasGridded = data.spatial?.gridded?.lats?.length > 0;

  return (
    <div className="space-y-6">
      {/* Real gridded heatmap */}
      {hasGridded && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              🗺️ Gridded Climate Map (CRU 0.5° Resolution)
            </h3>
            <Badge variant="info">{variable?.unit}</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            CRU gridded data overlaid on ESRI satellite imagery. White dashed boxes = study regions; gold box = selected region. Hover a cell for coordinates and value.
          </p>
          <SatelliteHeatmap
            lats={data.spatial.gridded.lats}
            lons={data.spatial.gridded.lons}
            values={data.spatial.gridded.values}
            unit={variable?.unit || ''}
            variableName={variable?.name}
            selectedRegion={selectedRegion}
            regions={data.spatial.regions}
            timeRange={data.spatial.time_range as any}
          />
        </Card>
      )}

      {/* Fallback 9-box summary if no gridded data */}
      {!hasGridded && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              🗺️ Regional Summary
            </h3>
            <Badge variant="info">{variable?.unit}</Badge>
          </div>
          <SpatialMap data={data.spatial} unit={variable?.unit || ''} />
        </Card>
      )}

      {/* Regional breakdown table */}
      <Card className="p-6">
        <h4 className="font-medium text-slate-900 dark:text-white mb-4">Region Time-Mean Values</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-2 pr-4 text-slate-500 dark:text-slate-400 font-medium">Region</th>
                <th className="text-left py-2 pr-4 text-slate-500 dark:text-slate-400 font-medium">Zone</th>
                <th className="text-left py-2 pr-4 text-slate-500 dark:text-slate-400 font-medium">Elevation</th>
                <th className="text-left py-2 pr-4 text-slate-500 dark:text-slate-400 font-medium">Climate Zone</th>
                <th className="text-right py-2 text-slate-500 dark:text-slate-400 font-medium">Mean Value</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.spatial.regions as Record<string, any>).map(([code, region]) => (
                <tr
                  key={code}
                  className={`border-b border-slate-100 dark:border-slate-800 ${code === selectedRegion ? 'bg-amber-50 dark:bg-amber-900/20' : ''}`}
                >
                  <td className="py-2 pr-4 font-medium text-slate-900 dark:text-white">
                    {code}
                    {code === selectedRegion && <span className="ml-2 text-amber-500 text-xs">★ selected</span>}
                  </td>
                  <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">{region.zone}</td>
                  <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">{region.elevation_range}</td>
                  <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">{region.climate_zone}</td>
                  <td className="py-2 text-right font-semibold text-slate-900 dark:text-white">
                    {region.value != null ? `${formatNumber(region.value, 2)} ${variable?.unit}` : '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// Forecast Tab
function ForecastTab({ data, variable }: any) {
  const historicalData = data.timeSeries.times.map((t: string, i: number) => ({
    date: new Date(t).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
    value: data.timeSeries.values[i],
  }));

  const forecastData = data.forecast.dates.map((d: string, i: number) => ({
    date: new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
    value: data.forecast.values[i],
    lower: data.forecast.lower[i],
    upper: data.forecast.upper[i],
  }));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
          🔮 {data.forecast.method === 'holt_winters_ets'
            ? 'Holt-Winters ETS Forecast'
            : data.forecast.method === 'prophet'
            ? 'Prophet Forecast'
            : 'Climate Forecast'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Method: {data.forecast.method === 'holt_winters_ets'
            ? 'Triple Exponential Smoothing (additive trend + seasonal)'
            : data.forecast.method === 'prophet'
            ? 'Facebook Prophet (Bayesian structural time series)'
            : 'Linear extrapolation (fallback)'}
          {data.forecast.change_rate !== undefined && ` · Change rate: ${formatNumber(data.forecast.change_rate, 2)}%`}
        </p>
        <ForecastChart
          historicalData={historicalData}
          forecastData={forecastData}
          unit={variable.unit}
          height={450}
        />
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Trend Direction</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white capitalize">
            {data.forecast.trend || 'Stable'}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Forecast Horizon</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {data.forecast.dates.length} months
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Forecast Mean</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white">
            {formatNumber(data.forecast.values.reduce((a: number, b: number) => a + b, 0) / data.forecast.values.length)} {variable.unit}
          </p>
        </Card>
      </div>
    </div>
  );
}

// Scenarios Tab
function ScenariosTab({ data, variable, scenarioData }: any) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
          🌍 Climate Scenario Projections (2050)
        </h3>
        <ScenarioChart
          data={scenarioData}
          baseline={data.scenarios.baseline}
          unit={variable.unit}
          height={350}
        />
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {scenarioData.map((scenario: any) => (
          <Card key={scenario.name} className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: scenario.color }}
              />
              <span className="font-medium text-slate-900 dark:text-white text-sm">
                {scenario.name}
              </span>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatNumber(scenario.value)} {variable.unit}
                </p>
                <p className="text-sm text-slate-500">
                  {formatPercent(scenario.change)} from baseline
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-slate-50 dark:bg-slate-800/50">
        <h4 className="font-medium text-slate-900 dark:text-white mb-3">📖 Scenario Definitions</h4>
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p><strong>SSP1-2.6:</strong> Rapid sustainability transitions, low challenges to mitigation</p>
          <p><strong>SSP2-4.5:</strong> Middle-of-the-road scenario with moderate challenges</p>
          <p><strong>SSP3-7.0:</strong> Regional rivalry with high challenges to mitigation</p>
          <p><strong>SSP5-8.5:</strong> Fossil-fueled development with very high emissions</p>
        </div>
      </Card>
    </div>
  );
}

// Sector metadata for impact visualization
const SECTOR_META: Record<string, { label: string; icon: string; color: string }> = {
  agriculture:     { label: 'Agriculture',      icon: '🌾', color: '#10b981' },
  water_resources: { label: 'Water Resources',  icon: '💧', color: '#0ea5e9' },
  infrastructure:  { label: 'Infrastructure',   icon: '🏗️', color: '#8b5cf6' },
  biodiversity:    { label: 'Biodiversity',      icon: '🦋', color: '#22c55e' },
  health:          { label: 'Human Health',      icon: '🏥', color: '#ef4444' },
};

const RISK_TEXT_COLOR: Record<string, string> = {
  low:      'text-green-600 dark:text-green-400',
  moderate: 'text-amber-500 dark:text-amber-400',
  high:     'text-orange-600 dark:text-orange-400',
  critical: 'text-red-600 dark:text-red-400',
};

const RISK_BAR_COLOR: Record<string, string> = {
  low: '#16a34a', moderate: '#d97706', high: '#ea580c', critical: '#dc2626',
};

const RISK_CONTEXT: Record<string, string> = {
  low:      'Current projections suggest manageable impacts with proactive adaptation measures in place.',
  moderate: 'The region faces moderate climate stress that requires planned, systematic adaptation strategies.',
  high:     'High-risk conditions demand urgent policy intervention and community-level resilience building.',
  critical: 'Critical risk levels call for immediate, large-scale adaptation and mitigation efforts.',
};

function generateImpactNarrative(impact: any, variable: any, region: any, trend: any, stats: any): string {
  const parts: string[] = [];
  const varName = variable?.name || 'the variable';
  const regionName = region?.name || 'this region';
  const unit = variable?.unit || '';
  const code = variable?.code || '';

  parts.push(
    `${regionName} is a ${region?.climateZone || 'Himalayan'} zone ` +
    `(vulnerability index ${region?.vulnerabilityIndex?.toFixed(1) ?? '–'}/10).`
  );

  if (stats?.mean !== undefined) {
    if (['tmp', 'tmx', 'tmn'].includes(code)) {
      parts.push(
        `Mean ${varName.toLowerCase()} over the analysis period is ` +
        `${formatNumber(stats.mean, 2)} ${unit}, ` +
        `ranging from ${formatNumber(stats.min, 1)} to ${formatNumber(stats.max, 1)} ${unit}.`
      );
    } else {
      parts.push(
        `Observed ${varName.toLowerCase()} averages ${formatNumber(stats.mean, 2)} ${unit} ` +
        `(range: ${formatNumber(stats.min, 1)}–${formatNumber(stats.max, 1)} ${unit}).`
      );
    }
  }

  if (trend?.per_decade !== undefined) {
    const dir = trend.per_decade > 0 ? 'upward' : trend.per_decade < 0 ? 'downward' : 'stable';
    const sig = trend.p_value < 0.05 ? 'statistically significant' : 'not statistically significant';
    const pLbl = trend.p_value < 0.001 ? 'p < 0.001' : `p = ${formatNumber(trend.p_value, 4)}`;
    parts.push(
      `Trend analysis reveals a ${sig} ${dir} trend of ` +
      `${formatNumber(Math.abs(trend.per_decade), 4)} ${unit}/decade (${pLbl}, R² = ${formatNumber(trend.r_squared, 3)}).`
    );
    if (trend.sens_per_decade !== undefined) {
      const agree = Math.sign(trend.sens_per_decade) === Math.sign(trend.per_decade);
      parts.push(
        `Sen's robust slope (${formatNumber(Math.abs(trend.sens_per_decade), 4)} ${unit}/decade) ` +
        `${agree ? 'corroborates' : 'partially contradicts'} the OLS estimate.`
      );
    }
  }

  if (trend?.mann_kendall) {
    const mk = trend.mann_kendall;
    const mkP = mk.p_value < 0.001 ? 'p < 0.001' : `p = ${formatNumber(mk.p_value, 4)}`;
    parts.push(
      `Mann-Kendall non-parametric test confirms: ${mk.trend} (τ = ${formatNumber(mk.tau, 3)}, ${mkP}).`
    );
  }

  parts.push(RISK_CONTEXT[impact.risk_level] || '');
  return parts.filter(Boolean).join(' ');
}

// Impact Tab
function ImpactTab({ data, variable, region }: any) {
  const impact = data.impact;
  const narrative = generateImpactNarrative(impact, variable, region, data.trend, data.statistics);

  const highRecs = impact.recommendations?.filter((r: any) => r.priority === 'high') ?? [];
  const medRecs  = impact.recommendations?.filter((r: any) => r.priority === 'medium') ?? [];
  const lowRecs  = impact.recommendations?.filter((r: any) => r.priority === 'low') ?? [];

  const riskBarColor = RISK_BAR_COLOR[impact.risk_level] ?? '#d97706';
  const riskTextColor = RISK_TEXT_COLOR[impact.risk_level] ?? RISK_TEXT_COLOR.moderate;

  return (
    <div className="space-y-6">
      {/* Risk Banner with narrative */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">
            ⚠️ Climate Impact Assessment
          </h3>
          <span className={`text-xl font-extrabold uppercase tracking-wide ${riskTextColor}`}>
            {impact.risk_level} Risk
          </span>
        </div>

        <div className="mb-5">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-slate-500 dark:text-slate-400">Overall Risk Score</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {formatNumber(impact.risk_score, 1)} / 10
            </span>
          </div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(impact.risk_score / 10) * 100}%`, backgroundColor: riskBarColor }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>Low (0–4)</span><span>Moderate (4–6)</span><span>High (6–8)</span><span>Critical (8–10)</span>
          </div>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 rounded-lg p-4">
          {narrative}
        </p>
      </Card>

      {/* Sector Vulnerability Breakdown */}
      {Object.keys(impact.sector_vulnerability ?? {}).length > 0 && (
        <Card className="p-6">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-5">
            📊 Sector Vulnerability Breakdown
          </h4>
          <div className="space-y-4">
            {Object.entries(impact.sector_vulnerability as Record<string, number>)
              .sort(([, a], [, b]) => b - a)
              .map(([sector, score]) => {
                const meta = SECTOR_META[sector] ?? { label: sector, icon: '📌', color: '#64748b' };
                return (
                  <div key={sector}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span>{meta.icon}</span>
                        <span>{meta.label}</span>
                      </span>
                      <span className="text-sm font-bold tabular-nums" style={{ color: meta.color }}>
                        {formatNumber(score, 1)}/10
                      </span>
                    </div>
                    <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${(score / 10) * 100}%`, backgroundColor: meta.color, opacity: 0.85 }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {/* Impact Areas */}
      {impact.impact_areas?.length > 0 && (
        <Card className="p-6">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-4">🎯 Identified Impact Areas</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {impact.impact_areas.map((area: string, i: number) => (
              <div
                key={i}
                className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg"
              >
                <span className="text-amber-500 text-xs mt-1 flex-shrink-0">◆</span>
                <span className="text-sm text-slate-700 dark:text-slate-300">{area}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Grouped Recommendations */}
      {impact.recommendations?.length > 0 && (
        <Card className="p-6">
          <h4 className="font-semibold text-slate-900 dark:text-white mb-5">💡 Adaptation Recommendations</h4>

          {highRecs.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                  Immediate Priority
                </span>
              </div>
              <div className="space-y-2 ml-4">
                {highRecs.map((rec: any, i: number) => (
                  <div key={i} className="flex gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg">
                    <span className="text-red-500 font-bold mt-0.5 flex-shrink-0">→</span>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{rec.action}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{rec.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {medRecs.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Medium-term Actions
                </span>
              </div>
              <div className="space-y-2 ml-4">
                {medRecs.map((rec: any, i: number) => (
                  <div key={i} className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg">
                    <span className="text-amber-500 font-bold mt-0.5 flex-shrink-0">→</span>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{rec.action}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{rec.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {lowRecs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Long-term Planning
                </span>
              </div>
              <div className="space-y-2 ml-4">
                {lowRecs.map((rec: any, i: number) => (
                  <div key={i} className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-lg">
                    <span className="text-blue-500 font-bold mt-0.5 flex-shrink-0">→</span>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{rec.action}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{rec.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// Report Tab
function ReportTab({ data, variable, region, startYear, endYear }: any) {
  const generateReport = () => {
    let report = `# Climate Analysis Report\n\n`;
    report += `**Generated:** ${new Date().toLocaleString()}\n`;
    report += `**Variable:** ${variable.name} (${variable.unit})\n`;
    report += `**Region:** ${region.name} (${region.range})\n`;
    report += `**Time Period:** ${startYear} - ${endYear}\n\n`;

    if (data.statistics) {
      report += `## Key Statistics\n\n`;
      report += `| Metric | Value |\n|--------|-------|\n`;
      report += `| Mean | ${formatNumber(data.statistics.mean)} ${variable.unit} |\n`;
      report += `| Median | ${formatNumber(data.statistics.median)} ${variable.unit} |\n`;
      report += `| Min | ${formatNumber(data.statistics.min)} ${variable.unit} |\n`;
      report += `| Max | ${formatNumber(data.statistics.max)} ${variable.unit} |\n`;
      report += `| Std Dev | ${formatNumber(data.statistics.std)} ${variable.unit} |\n\n`;
    }

    if (data.trend) {
      report += `## Trend Analysis\n\n`;
      report += `- Trend per decade: ${formatNumber(data.trend.per_decade, 3)} ${variable.unit}\n`;
      report += `- Percent change: ${formatPercent(data.trend.percent_change)}\n`;
      report += `- R-squared: ${formatNumber(data.trend.r_squared, 3)}\n`;
      report += `- P-value: ${data.trend.p_value.toExponential(2)}\n\n`;
    }

    return report;
  };

  const downloadReport = () => {
    const report = generateReport();
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `climate_report_${variable.code}_${region.code}.md`;
    a.click();
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-slate-900 dark:text-white">
          📄 Analysis Report
        </h3>
        <button
          onClick={downloadReport}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Download Report
        </button>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg text-sm overflow-x-auto">
          {generateReport()}
        </pre>
      </div>
    </Card>
  );
}
