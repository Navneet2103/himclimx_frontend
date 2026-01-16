const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-6719e.up.railway.app';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Metadata endpoints
  async getVariables() {
    return this.request<{ variables: Record<string, any>; count: number }>('/api/v1/metadata/variables');
  }

  async getRegions() {
    return this.request<{ regions: Record<string, any>; count: number }>('/api/v1/metadata/regions');
  }

  // Data endpoints
  async getTimeSeries(variable: string, region: string, startYear?: number, endYear?: number) {
    const params = new URLSearchParams({ variable, region });
    if (startYear) params.append('start_year', startYear.toString());
    if (endYear) params.append('end_year', endYear.toString());
    
    const response = await this.request<{
      data: { times: string[]; values: number[] };
      variable: string;
      region: string;
      statistics: any;
    }>(`/api/v1/data/timeseries?${params}`);
    
    // Extract nested data structure
    return {
      times: response.data?.times || [],
      values: response.data?.values || [],
      variable: response.variable,
      region: response.region,
    };
  }

  async getAnnualData(variable: string, region: string, startYear?: number, endYear?: number) {
    const params = new URLSearchParams({ variable, region });
    if (startYear) params.append('start_year', startYear.toString());
    if (endYear) params.append('end_year', endYear.toString());
    
    const response = await this.request<{
      data?: { years: number[]; values: number[] };
      years?: number[];
      values?: number[];
    }>(`/api/v1/data/annual?${params}`);
    
    return {
      years: response.data?.years || response.years || [],
      values: response.data?.values || response.values || [],
    };
  }

  async getClimatology(variable: string, region: string, startYear?: number, endYear?: number) {
    const params = new URLSearchParams({ variable, region });
    if (startYear) params.append('start_year', startYear.toString());
    if (endYear) params.append('end_year', endYear.toString());
    
    const response = await this.request<{
      data?: { months: string[]; mean_values: number[]; std_values: number[] };
      months?: string[];
      values?: number[];
      std?: number[];
    }>(`/api/v1/data/climatology?${params}`);
    
    return {
      months: response.data?.months || response.months || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      values: response.data?.mean_values || response.values || [],
      std: response.data?.std_values || response.std || [],
    };
  }

  // Analysis endpoints
  async getTrend(variable: string, region: string, startYear?: number, endYear?: number) {
    const params = new URLSearchParams({ variable, region });
    if (startYear) params.append('start_year', startYear.toString());
    if (endYear) params.append('end_year', endYear.toString());
    
    const response = await this.request<{
      trend?: {
        slope: number;
        intercept: number;
        r_squared: number;
        p_value: number;
        std_err: number;
        per_decade: number;
        percent_change: number;
      };
      slope?: number;
      intercept?: number;
      r_squared?: number;
      p_value?: number;
      std_err?: number;
      per_decade?: number;
      percent_change?: number;
      mann_kendall?: {
        trend: string;
        p_value: number;
        tau: number;
      };
    }>(`/api/v1/analysis/trend?${params}`);
    
    // Handle both nested and flat response
    return {
      slope: response.trend?.slope ?? response.slope ?? 0,
      intercept: response.trend?.intercept ?? response.intercept ?? 0,
      r_squared: response.trend?.r_squared ?? response.r_squared ?? 0,
      p_value: response.trend?.p_value ?? response.p_value ?? 0,
      std_err: response.trend?.std_err ?? response.std_err ?? 0,
      per_decade: response.trend?.per_decade ?? response.per_decade ?? 0,
      percent_change: response.trend?.percent_change ?? response.percent_change ?? 0,
      mann_kendall: response.mann_kendall,
    };
  }

  async getAnomalies(variable: string, region: string, startYear?: number, endYear?: number, threshold?: number) {
    const params = new URLSearchParams({ variable, region });
    if (startYear) params.append('start_year', startYear.toString());
    if (endYear) params.append('end_year', endYear.toString());
    if (threshold) params.append('threshold', threshold.toString());
    
    const response = await this.request<{
      data?: {
        years: number[];
        values: number[];
        z_scores: number[];
      };
      years?: number[];
      values?: number[];
      z_scores?: number[];
      anomalies: Array<{
        year: number;
        value: number;
        z_score: number;
        type: 'high' | 'low';
      }>;
      threshold: number;
    }>(`/api/v1/analysis/anomalies?${params}`);
    
    return {
      years: response.data?.years || response.years || [],
      values: response.data?.values || response.values || [],
      z_scores: response.data?.z_scores || response.z_scores || [],
      anomalies: response.anomalies || [],
      threshold: response.threshold || 2,
    };
  }

  async getStatistics(variable: string, region: string, startYear?: number, endYear?: number) {
    const params = new URLSearchParams({ variable, region });
    if (startYear) params.append('start_year', startYear.toString());
    if (endYear) params.append('end_year', endYear.toString());
    
    const response = await this.request<{
      statistics?: {
        mean: number;
        median: number;
        min: number;
        max: number;
        std: number;
        count: number;
      };
      mean?: number;
      median?: number;
      min?: number;
      max?: number;
      std?: number;
      count?: number;
      percentiles?: {
        p5: number;
        p25: number;
        p75: number;
        p95: number;
      };
    }>(`/api/v1/analysis/statistics?${params}`);
    
    return {
      mean: response.statistics?.mean ?? response.mean ?? 0,
      median: response.statistics?.median ?? response.median ?? 0,
      min: response.statistics?.min ?? response.min ?? 0,
      max: response.statistics?.max ?? response.max ?? 0,
      std: response.statistics?.std ?? response.std ?? 0,
      count: response.statistics?.count ?? response.count ?? 0,
      percentiles: response.percentiles,
    };
  }

  // Forecast endpoints
  async getForecast(variable: string, region: string, years?: number) {
    const params = new URLSearchParams({ variable, region });
    if (years) params.append('years', years.toString());
    
    const response = await this.request<{
      forecast?: {
        dates: string[];
        values: number[];
        lower: number[];
        upper: number[];
      };
      dates?: string[];
      values?: number[];
      lower?: number[];
      upper?: number[];
      trend?: string;
      change_rate?: number;
    }>(`/api/v1/forecast/prophet?${params}`);
    
    return {
      dates: response.forecast?.dates || response.dates || [],
      values: response.forecast?.values || response.values || [],
      lower: response.forecast?.lower || response.lower || [],
      upper: response.forecast?.upper || response.upper || [],
      trend: response.trend || 'stable',
      change_rate: response.change_rate || 0,
    };
  }

  async getScenarios(variable: string, region: string, targetYear?: number) {
    const params = new URLSearchParams({ variable, region });
    if (targetYear) params.append('target_year', targetYear.toString());
    
    const response = await this.request<{
      scenarios?: Record<string, any>;
      ssp1?: any;
      ssp2?: any;
      ssp3?: any;
      ssp5?: any;
      baseline?: number;
    }>(`/api/v1/scenarios?${params}`);
    
    const defaultScenario = {
      name: 'Unknown',
      projected_change: 0,
      future_value: 0,
      percent_change: 0,
      color: '#888888',
    };
    
    return {
      ssp1: response.scenarios?.ssp1 || response.ssp1 || { ...defaultScenario, name: 'SSP1-2.6', color: '#10b981' },
      ssp2: response.scenarios?.ssp2 || response.ssp2 || { ...defaultScenario, name: 'SSP2-4.5', color: '#f59e0b' },
      ssp3: response.scenarios?.ssp3 || response.ssp3 || { ...defaultScenario, name: 'SSP3-7.0', color: '#ef4444' },
      ssp5: response.scenarios?.ssp5 || response.ssp5 || { ...defaultScenario, name: 'SSP5-8.5', color: '#b91c1c' },
      baseline: response.baseline || 0,
    };
  }

  // Impact assessment
  async getImpact(variable: string, region: string) {
    const params = new URLSearchParams({ variable, region });
    
    const response = await this.request<{
      impact?: {
        risk_level: string;
        risk_score: number;
        impact_areas: string[];
        recommendations: any[];
        sector_vulnerability: Record<string, number>;
      };
      risk_level?: string;
      risk_score?: number;
      impact_areas?: string[];
      recommendations?: any[];
      sector_vulnerability?: Record<string, number>;
    }>(`/api/v1/impact/assess?${params}`);
    
    return {
      risk_level: (response.impact?.risk_level || response.risk_level || 'moderate') as 'low' | 'moderate' | 'high' | 'critical',
      risk_score: response.impact?.risk_score || response.risk_score || 5,
      impact_areas: response.impact?.impact_areas || response.impact_areas || [],
      recommendations: response.impact?.recommendations || response.recommendations || [],
      sector_vulnerability: response.impact?.sector_vulnerability || response.sector_vulnerability || {},
    };
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
