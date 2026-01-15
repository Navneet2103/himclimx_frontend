'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useDashboardStore } from '@/lib/store';
import { VARIABLES, REGIONS, MONTHS } from '@/lib/constants';
import { Card, Tabs, Badge, Progress, Spinner, EmptyState } from '@/components/ui';
import { 
  TimeSeriesChart, 
  ClimatologyChart, 
  AnomalyChart, 
  ForecastChart,
  ScenarioChart,
  AnnualChart 
} from './Charts';
import { StatsGrid, TrendInterpretation } from './StatCards';
import { formatNumber, formatPercent, getRiskBgColor } from '@/lib/utils';

// Tab definitions
const getTabsForOptions = (options: any) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  ];
  
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

interface AnalysisTabsProps {
  data: {
    timeSeries?: { times: string[]; values: number[] };
    statistics?: { mean: number; median: number; min: number; max: number; std: number; count: number };
    trend?: { slope: number; intercept: number; r_squared: number; p_value: number; per_decade: number; percent_change: number };
    climatology?: { months: string[]; values: number[]; std: number[] };
    anomalies?: { years: number[]; values: number[]; z_scores: number[]; anomalies: any[]; threshold: number };
    forecast?: { dates: string[]; values: number[]; lower: number[]; upper: number[]; trend: string };
    scenarios?: { ssp1: any; ssp2: any; ssp3: any; ssp5: any; baseline: number };
    impact?: { risk_level: string; risk_score: number; impact_areas: string[]; recommendations: any[] };
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
    setActiveTab 
  } = useDashboardStore();

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

  // Prepare chart data
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
            {region?.icon} {region?.name} • {startYear} - {endYear}
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

        {activeTab === 'trends' && data.trend && (
          <TrendsTab data={data} variable={variable} timeSeriesData={timeSeriesData} />
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
function TrendsTab({ data, variable, timeSeriesData }: any) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
          📈 Trend Analysis
        </h3>
        <TimeSeriesChart
          data={timeSeriesData}
          unit={variable.unit}
          color={variable.color}
          showTrend={true}
          height={450}
        />
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h4 className="font-medium text-slate-900 dark:text-white mb-4">Statistical Summary</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Trend per decade</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {formatNumber(data.trend.per_decade, 3)} {variable.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Percent change</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {formatPercent(data.trend.percent_change)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">R-squared</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {formatNumber(data.trend.r_squared, 3)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">P-value</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {data.trend.p_value.toExponential(2)}
              </span>
            </div>
          </div>
        </Card>

        <TrendInterpretation
          trend={data.trend}
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
          🚨 Anomaly Detection (Z-Score > {data.anomalies.threshold})
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
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
          🔮 Prophet Forecast
        </h3>
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

// Impact Tab
function ImpactTab({ data, variable, region }: any) {
  const impact = data.impact;

  return (
    <div className="space-y-6">
      {/* Risk Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            ⚠️ Climate Impact Assessment
          </h3>
          <Badge className={getRiskBgColor(impact.risk_level)}>
            {impact.risk_level.toUpperCase()} RISK
          </Badge>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-slate-500 dark:text-slate-400">Overall Risk Score</span>
            <span className="font-medium text-slate-900 dark:text-white">
              {formatNumber(impact.risk_score, 1)} / 10
            </span>
          </div>
          <Progress value={impact.risk_score} max={10} />
        </div>
      </Card>

      {/* Impact Areas */}
      {impact.impact_areas?.length > 0 && (
        <Card className="p-6">
          <h4 className="font-medium text-slate-900 dark:text-white mb-4">Impact Areas</h4>
          <div className="flex flex-wrap gap-2">
            {impact.impact_areas.map((area: string, i: number) => (
              <Badge key={i} variant="warning">{area}</Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {impact.recommendations?.length > 0 && (
        <Card className="p-6">
          <h4 className="font-medium text-slate-900 dark:text-white mb-4">Recommendations</h4>
          <div className="space-y-3">
            {impact.recommendations.map((rec: any, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
              >
                <Badge
                  variant={
                    rec.priority === 'high' ? 'danger' :
                    rec.priority === 'medium' ? 'warning' : 'info'
                  }
                >
                  {rec.priority}
                </Badge>
                <div>
                  <p className="text-slate-900 dark:text-white">{rec.action}</p>
                  <p className="text-sm text-slate-500">{rec.category}</p>
                </div>
              </div>
            ))}
          </div>
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
