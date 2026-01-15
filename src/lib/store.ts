import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DashboardState, AnalysisOptions, TimePeriod, AnalysisResult } from '@/types';

const defaultAnalysisOptions: AnalysisOptions = {
  timeSeries: true,
  spatial: true,
  terrain3D: false,
  anomalyDetection: false,
  trendAnalysis: true,
  seasonalDecomposition: false,
  climateImpact: true,
  forecasting: true,
  climateScenarios: true,
  dataQuality: false,
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      // Selection state
      selectedVariable: 'tmp',
      selectedRegion: 'C4000',
      timePeriod: 'full' as TimePeriod,
      startYear: 1950,
      endYear: 2020,
      analysisOptions: defaultAnalysisOptions,

      // UI state
      isAnalyzing: false,
      analysisResult: null,
      activeTab: 'dashboard',
      sidebarOpen: true,
      theme: 'dark' as const,

      // Actions
      setSelectedVariable: (variable) => set({ selectedVariable: variable }),
      setSelectedRegion: (region) => set({ selectedRegion: region }),
      setTimePeriod: (period) => set({ timePeriod: period }),
      setStartYear: (year) => set({ startYear: year }),
      setEndYear: (year) => set({ endYear: year }),
      setAnalysisOptions: (options) =>
        set((state) => ({
          analysisOptions: { ...state.analysisOptions, ...options },
        })),
      setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
      setAnalysisResult: (result) => set({ analysisResult: result }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      resetAnalysis: () => set({ analysisResult: null, activeTab: 'dashboard' }),
    }),
    {
      name: 'himclimx-dashboard',
      partialize: (state) => ({
        selectedVariable: state.selectedVariable,
        selectedRegion: state.selectedRegion,
        timePeriod: state.timePeriod,
        startYear: state.startYear,
        endYear: state.endYear,
        analysisOptions: state.analysisOptions,
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
