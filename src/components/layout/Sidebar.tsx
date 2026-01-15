'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sun, 
  Moon, 
  Play, 
  RotateCcw,
  Mountain 
} from 'lucide-react';
import { useDashboardStore } from '@/lib/store';
import { VARIABLES, REGIONS, TIME_PERIODS } from '@/lib/constants';
import { Select, Checkbox, Button, Badge, Progress } from '@/components/ui';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const {
    selectedVariable,
    selectedRegion,
    timePeriod,
    startYear,
    endYear,
    analysisOptions,
    sidebarOpen,
    theme,
    isAnalyzing,
    setSelectedVariable,
    setSelectedRegion,
    setTimePeriod,
    setStartYear,
    setEndYear,
    setAnalysisOptions,
    toggleSidebar,
    toggleTheme,
    resetAnalysis,
  } = useDashboardStore();

  const variable = VARIABLES[selectedVariable];
  const region = REGIONS[selectedRegion];

  return (
    <>
      {/* Toggle button when closed */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={toggleSidebar}
            className="fixed left-0 top-1/2 -translate-y-1/2 z-50 p-2 bg-white dark:bg-slate-800 rounded-r-lg shadow-lg border border-l-0 border-slate-200 dark:border-slate-700"
          >
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-screen w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-40 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center">
                    <Mountain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                      HimClimX
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Climate Explorer
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
                  >
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                  <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-6">
              {/* Data Selection */}
              <section>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  📂 Data Selection
                </h3>

                {/* Variable selector */}
                <div className="space-y-3">
                  <Select
                    label="Climate Variable"
                    value={selectedVariable}
                    onChange={(e) => setSelectedVariable(e.target.value)}
                    options={Object.values(VARIABLES).map((v) => ({
                      value: v.code,
                      label: `${v.icon} ${v.name}`,
                    }))}
                  />

                  {/* Variable info card */}
                  <motion.div
                    key={selectedVariable}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{variable?.icon}</span>
                      <span className="font-medium text-slate-900 dark:text-white text-sm">
                        {variable?.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      {variable?.description}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400">Unit:</span>
                        <span className="ml-1 font-medium text-slate-700 dark:text-slate-200">
                          {variable?.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Impact:</span>
                        <span className="ml-1 font-medium text-slate-700 dark:text-slate-200">
                          {variable?.impactFactor}/10
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Range:</span>
                        <span className="ml-1 font-medium text-slate-700 dark:text-slate-200">
                          {variable?.normalRange[0]} to {variable?.normalRange[1]}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Sensitivity:</span>
                        <Badge
                          variant={
                            variable?.climateSensitivity === 'High'
                              ? 'danger'
                              : variable?.climateSensitivity === 'Medium'
                              ? 'warning'
                              : 'success'
                          }
                          className="ml-1"
                        >
                          {variable?.climateSensitivity}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>

                  {/* Region selector */}
                  <Select
                    label="Geographic Region"
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    options={Object.values(REGIONS).map((r) => ({
                      value: r.code,
                      label: `${r.icon} ${r.name}`,
                    }))}
                  />

                  {/* Region info card */}
                  <motion.div
                    key={selectedRegion}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{region?.icon}</span>
                      <span className="font-medium text-slate-900 dark:text-white text-sm">
                        {region?.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      Elevation: {region?.range}
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Climate Zone:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {region?.climateZone}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Vulnerability:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-200">
                          {region?.vulnerabilityIndex}/10
                        </span>
                      </div>
                      <Progress value={region?.vulnerabilityIndex || 0} max={10} />
                    </div>
                  </motion.div>

                  {/* Time Period */}
                  <Select
                    label="Time Period"
                    value={timePeriod}
                    onChange={(e) => setTimePeriod(e.target.value as any)}
                    options={TIME_PERIODS.map((t) => ({
                      value: t.value,
                      label: t.label,
                    }))}
                  />

                  {/* Custom year range */}
                  {timePeriod === 'custom' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-2 gap-2"
                    >
                      <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                          Start Year
                        </label>
                        <input
                          type="number"
                          min={1950}
                          max={2020}
                          value={startYear}
                          onChange={(e) => setStartYear(parseInt(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                          End Year
                        </label>
                        <input
                          type="number"
                          min={1950}
                          max={2020}
                          value={endYear}
                          onChange={(e) => setEndYear(parseInt(e.target.value))}
                          className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </section>

              {/* Analysis Options */}
              <section>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  ⚙️ Analysis Options
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Select analyses to perform:
                </p>

                <div className="space-y-3">
                  <Checkbox
                    label="Time Series Analysis"
                    icon="📈"
                    checked={analysisOptions.timeSeries}
                    onChange={(checked) => setAnalysisOptions({ timeSeries: checked })}
                  />
                  <Checkbox
                    label="Trend Analysis"
                    icon="📉"
                    checked={analysisOptions.trendAnalysis}
                    onChange={(checked) => setAnalysisOptions({ trendAnalysis: checked })}
                  />
                  <Checkbox
                    label="Anomaly Detection"
                    icon="🚨"
                    checked={analysisOptions.anomalyDetection}
                    onChange={(checked) => setAnalysisOptions({ anomalyDetection: checked })}
                  />
                  <Checkbox
                    label="Climate Impact"
                    icon="⚠️"
                    checked={analysisOptions.climateImpact}
                    onChange={(checked) => setAnalysisOptions({ climateImpact: checked })}
                  />
                  <Checkbox
                    label="Forecasting"
                    icon="🔮"
                    checked={analysisOptions.forecasting}
                    onChange={(checked) => setAnalysisOptions({ forecasting: checked })}
                  />
                  <Checkbox
                    label="Climate Scenarios"
                    icon="🌍"
                    checked={analysisOptions.climateScenarios}
                    onChange={(checked) => setAnalysisOptions({ climateScenarios: checked })}
                  />
                </div>
              </section>
            </div>

            {/* Footer actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <Button
                variant="primary"
                className="w-full"
                disabled={isAnalyzing}
                loading={isAnalyzing}
                onClick={() => {
                  // This will be handled by the parent component
                  const event = new CustomEvent('runAnalysis');
                  window.dispatchEvent(event);
                }}
              >
                <Play className="w-4 h-4" />
                {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={resetAnalysis}
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
