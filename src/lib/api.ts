const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-2d8b0.up.railway.app';

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
    return this.request<{ variables: string[] }>('/api/v1/metadata/variables');
  }

  async getRegions() {
    return this.request<{ regions: string[] }>('/api/v1/metadata/regions');
  }

  // Data endpoints
  async getTimeSeries(variable: string, region: string, startYear?: number, endYear?: number) {
    const params = new URLSearchParams({ variable, region });
    if (startYear) params.append('start_year', startYear.toString());
    if (endYear) params.append('end_year', endYear.toString());
    return this.request<{
      times: string[];
      values: number[];
      variable: string;
      region: string;
    }>(`/api/v1/data/timeseries?${params}`);
  }

  async getAnnualData(variable: string, region: string, startYear?: number, endYear?: number) {
    const params = new URLSearchParams({ variable, region });
    if (startYear) params.append('start_year', startYear.toString());
    if (endYear) params.append('end_year', endYear.toString());
    return this.request<{
      years: number[];
      values: number[];
    }>(`/api/v1/data/annual?${params}`);
  }

  async getClimatology(variable: string, region: string, startYear?: number, endYear?: number) {
    const params = new URLSearchParams({ variable, region });
    if (startYear) params.append('start_year', startYear.toString());
    if (endYear) params.append('end_year', endYear.toString());
    return this.request<{
      months: string[];
      values: number[];
      std: number[];
    }>(`/api/v1/data/climatology?${params}`);
  }

  // Analysis endpoints
  async getTrend(variable: string, region: string, startYear?: number, endYear?: number) {
    const params = new URLSearchParams({ variable, region });
    if (startYear) params.append('start_year', startYear.toString());
    if (endYear) params.append('end_year', endYear.toString());
    return this.request<{
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
    }>(`/api/v1/analysis/trend?${params}`);
  }

  async getAnomalies(variable: string, region: string, startYear?: number, endYear?: number, threshold?: number) {
    const params = new URLSearchParams({ variable, region });
    if (startYear) params.append('start_year', startYear.toString());
    if (endYear) params.append('end_year', endYear.toString());
    if (threshold) params.append('threshold', threshold.toString());
    return this.request<{
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
    }>(`/api/v1/analysis/anomalies?${params}`);
  }

  async getStatistics(variable: string, region: string, startYear?: number, endYear?: number) {
    const params = new URLSearchParams({ variable, region });
    if (startYear) params.append('start_year', startYear.toString());
    if (endYear) params.append('end_year', endYear.toString());
    return this.request<{
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
    }>(`/api/v1/analysis/statistics?${params}`);
  }

  // Forecast endpoints
  async getForecast(variable: string, region: string, years?: number) {
    const params = new URLSearchParams({ variable, region });
    if (years) params.append('years', years.toString());
    return this.request<{
      dates: string[];
      values: number[];
      lower: number[];
      upper: number[];
      trend: string;
      change_rate: number;
    }>(`/api/v1/forecast/prophet?${params}`);
  }

  async getScenarios(variable: string, region: string, targetYear?: number) {
    const params = new URLSearchParams({ variable, region });
    if (targetYear) params.append('target_year', targetYear.toString());
    return this.request<{
      ssp1: {
        name: string;
        projected_change: number;
        future_value: number;
        percent_change: number;
        color: string;
      };
      ssp2: {
        name: string;
        projected_change: number;
        future_value: number;
        percent_change: number;
        color: string;
      };
      ssp3: {
        name: string;
        projected_change: number;
        future_value: number;
        percent_change: number;
        color: string;
      };
      ssp5: {
        name: string;
        projected_change: number;
        future_value: number;
        percent_change: number;
        color: string;
      };
      baseline: number;
    }>(`/api/v1/forecast/scenarios?${params}`);
  }

  // Impact assessment
  async getImpact(variable: string, region: string) {
    const params = new URLSearchParams({ variable, region });
    return this.request<{
      risk_level: 'low' | 'moderate' | 'high' | 'critical';
      risk_score: number;
      impact_areas: string[];
      recommendations: Array<{
        priority: 'high' | 'medium' | 'low';
        action: string;
        category: string;
      }>;
      sector_vulnerability: Record<string, number>;
    }>(`/api/v1/impact/assess?${params}`);
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;



