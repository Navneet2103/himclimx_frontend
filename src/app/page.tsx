'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardStore } from '@/lib/store';
import { api } from '@/lib/api';
import { getYearRange } from '@/lib/utils';
import { Sidebar } from '@/components/layout/Sidebar';
import { WelcomeScreen } from '@/components/analysis/WelcomeScreen';
import { AnalysisTabs } from '@/components/analysis/AnalysisTabs';
import { Spinner } from '@/components/ui';

export default function HomePage() {
  const {
    selectedVariable,
    selectedRegion,
    timePeriod,
    startYear,
    endYear,
    analysisOptions,
    isAnalyzing,
    analysisResult,
    sidebarOpen,
    setIsAnalyzing,
    setAnalysisResult,
    setActiveTab,
  } = useDashboardStore();

  const [analysisData, setAnalysisData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Run analysis function
  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setError(null);
    setActiveTab('dashboard');

    try {
      // Determine year range
      const yearRange = timePeriod === 'custom' 
        ? { start: startYear, end: endYear }
        : getYearRange(timePeriod);

      // Fetch all required data in parallel
      const promises: Promise<any>[] = [];
      const dataKeys: string[] = [];

      // Always fetch time series and statistics
      promises.push(api.getTimeSeries(selectedVariable, selectedRegion, yearRange.start, yearRange.end));
      dataKeys.push('timeSeries');

      promises.push(api.getStatistics(selectedVariable, selectedRegion, yearRange.start, yearRange.end));
      dataKeys.push('statistics');

      promises.push(api.getClimatology(selectedVariable, selectedRegion, yearRange.start, yearRange.end));
      dataKeys.push('climatology');

      // Conditional fetches based on options
      if (analysisOptions.trendAnalysis) {
        promises.push(api.getTrend(selectedVariable, selectedRegion, yearRange.start, yearRange.end));
        dataKeys.push('trend');
      }

      if (analysisOptions.anomalyDetection) {
        promises.push(api.getAnomalies(selectedVariable, selectedRegion, yearRange.start, yearRange.end));
        dataKeys.push('anomalies');
      }

      if (analysisOptions.forecasting) {
        promises.push(api.getForecast(selectedVariable, selectedRegion, 5));
        dataKeys.push('forecast');
      }

      if (analysisOptions.climateScenarios) {
        promises.push(api.getScenarios(selectedVariable, selectedRegion, 2050));
        dataKeys.push('scenarios');
      }

      if (analysisOptions.climateImpact) {
        promises.push(api.getImpact(selectedVariable, selectedRegion));
        dataKeys.push('impact');
      }

      // Execute all requests
      const results = await Promise.allSettled(promises);

      // Build data object
      const data: any = {};
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          data[dataKeys[index]] = result.value;
        } else {
          console.warn(`Failed to fetch ${dataKeys[index]}:`, result.reason);
        }
      });

      // Check if we have minimum required data
      if (!data.timeSeries || !data.statistics) {
        throw new Error('Failed to load essential data. Please check your connection and try again.');
      }

      setAnalysisData(data);
      setAnalysisResult({
        variable: selectedVariable,
        region: selectedRegion,
        startYear: yearRange.start,
        endYear: yearRange.end,
        timestamp: new Date().toISOString(),
      });

    } catch (err) {
      console.error('Analysis failed:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
      setAnalysisData(null);
      setAnalysisResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    selectedVariable,
    selectedRegion,
    timePeriod,
    startYear,
    endYear,
    analysisOptions,
    setIsAnalyzing,
    setAnalysisResult,
    setActiveTab,
  ]);

  // Listen for run analysis event from sidebar
  useEffect(() => {
    const handleRunAnalysis = () => runAnalysis();
    window.addEventListener('runAnalysis', handleRunAnalysis);
    return () => window.removeEventListener('runAnalysis', handleRunAnalysis);
  }, [runAnalysis]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          sidebarOpen ? 'ml-80' : 'ml-0'
        }`}
      >
        <div className="min-h-screen p-6 lg:p-8">
          <AnimatePresence mode="wait">
            {/* Loading State */}
            {isAnalyzing && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center min-h-[60vh]"
              >
                <div className="text-center">
                  <Spinner size="lg" />
                  <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                    Analyzing climate data...
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    This may take a few moments
                  </p>
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {!isAnalyzing && error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center min-h-[60vh]"
              >
                <div className="text-center max-w-md">
                  <span className="text-5xl mb-4 block">⚠️</span>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    Analysis Failed
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    {error}
                  </p>
                  <button
                    onClick={runAnalysis}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </motion.div>
            )}

            {/* Results */}
            {!isAnalyzing && !error && analysisData && analysisResult && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <AnalysisTabs data={analysisData} />
              </motion.div>
            )}

            {/* Welcome Screen */}
            {!isAnalyzing && !error && !analysisResult && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <WelcomeScreen />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
