// Variable types
export interface VariableInfo {
  code: string;
  name: string;
  unit: string;
  icon: string;
  color: string;
  description: string;
  normalRange: [number, number];
  impactFactor: number;
  climateSensitivity: 'Low' | 'Medium' | 'High';
}

// Region types
export interface RegionInfo {
  code: string;
  name: string;
  range: string;
  icon: string;
  color: string;
  climateZone: string;
  vulnerabilityIndex: number;
  biodiversity: string;
  glacierCoverage: string;
  elevationProfile: [number, number, number];
}

// Analysis options
export interface AnalysisOptions {
  timeSeries: boolean;
  spatial: boolean;
  terrain3D: boolean;
  anomalyDetection: boolean;
  trendAnalysis: boolean;
  seasonalDecomposition: boolean;
  climateImpact: boolean;
  forecasting: boolean;
  climateScenarios: boolean;
  dataQuality: boolean;
}

// Time period options
export type TimePeriod = 'full' | 'last30' | 'last20' | 'last10' | 'custom';

// API response types
export interface TimeSeriesData {
  times: string[];
  values: number[];
}

export interface TrendData {
  slope: number;
  intercept: number;
  r_squared: number;
  p_value: number;
  std_err: number;
  per_decade: number;
  percent_change: number;
  mann_kendall?: {
    trend: string;
    p_value: number;
    tau: number;
  };
}

export interface StatisticsData {
  mean: number;
  median: number;
  min: number;
  max: number;
  std: number;
  count: number;
  percentiles?: {
    p5: number;
    p25: number;
    p75: number;
    p95: number;
  };
}

export interface AnomalyData {
  years: number[];
  values: number[];
  z_scores: number[];
  anomalies: Array<{
    year: number;
    value: number;
    z_score: number;
    type: 'high' | 'low';
  }>;
  threshold: number;
}

export interface ForecastData {
  dates: string[];
  values: number[];
  lower: number[];
  upper: number[];
  trend: string;
  change_rate: number;
}

export interface ScenarioData {
  ssp1: ScenarioProjection;
  ssp2: ScenarioProjection;
  ssp3: ScenarioProjection;
  ssp5: ScenarioProjection;
  baseline: number;
}

export interface ScenarioProjection {
  name: string;
  projected_change: number;
  future_value: number;
  percent_change: number;
  color: string;
}

export interface ImpactData {
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  risk_score: number;
  impact_areas: string[];
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    category: string;
  }>;
  sector_vulnerability: Record<string, number>;
}

export interface ClimatologyData {
  months: string[];
  values: number[];
  std: number[];
}

// Combined analysis result
export interface AnalysisResult {
  variable: string;
  region: string;
  startYear: number;
  endYear: number;
  timeSeries?: TimeSeriesData;
  statistics?: StatisticsData;
  trend?: TrendData;
  climatology?: ClimatologyData;
  anomalies?: AnomalyData;
  forecast?: ForecastData;
  scenarios?: ScenarioData;
  impact?: ImpactData;
  timestamp: string;
}

// Store state
export interface DashboardState {
  // Selection state
  selectedVariable: string;
  selectedRegion: string;
  timePeriod: TimePeriod;
  startYear: number;
  endYear: number;
  analysisOptions: AnalysisOptions;
  
  // UI state
  isAnalyzing: boolean;
  analysisResult: AnalysisResult | null;
  activeTab: string;
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  
  // Actions
  setSelectedVariable: (variable: string) => void;
  setSelectedRegion: (region: string) => void;
  setTimePeriod: (period: TimePeriod) => void;
  setStartYear: (year: number) => void;
  setEndYear: (year: number) => void;
  setAnalysisOptions: (options: Partial<AnalysisOptions>) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setAnalysisResult: (result: AnalysisResult | null) => void;
  setActiveTab: (tab: string) => void;
  toggleSidebar: () => void;
  toggleTheme: () => void;
  resetAnalysis: () => void;
}
