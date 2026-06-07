'use client';

import React, { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardStore } from '@/lib/store';
import { api } from '@/lib/api';
import { getYearRange } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
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

      if (analysisOptions.spatial) {
        promises.push(api.getSpatial(selectedVariable, yearRange.start, yearRange.end));
        dataKeys.push('spatial');
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
      {/* Header */}
      <Header />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content — pt-20 clears the fixed header (h ≈ 64px) */}
      <main
        className={`transition-all duration-300 pt-20 ${
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

      {/* Floating chatbot button */}
      <a
        href="https://himalai.himclimx.com"
        target="_blank"
        rel="noopener noreferrer"
        title="Explore our RAG-based climate research chatbot"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full shadow-lg
                   bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-semibold
                   hover:from-violet-500 hover:to-indigo-500 hover:shadow-xl hover:-translate-y-0.5
                   transition-all duration-200 group"
      >
        {/* Chat bubble icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          <path d="M8 10h8M8 14h5" strokeOpacity={0.7} />
        </svg>
        <span>Ask the Climate AI</span>
        {/* Pulsing dot to draw attention */}
        <span className="absolute -top-1 -right-1 h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-300 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-200" />
        </span>
      </a>
    </div>
  );
}
