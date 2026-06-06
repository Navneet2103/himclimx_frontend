'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { Spinner } from '@/components/ui';

const Plot = dynamic(() => import('react-plotly.js'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  ),
});

// Region bounding boxes from backend Config.REGIONS
const REGION_BOUNDS: Record<string, { north: number; south: number; east: number; west: number }> = {
  E2000: { north: 28.0, south: 27.0, east: 89.0, west: 88.0 },
  E4000: { north: 28.3, south: 27.3, east: 88.8, west: 87.8 },
  E6000: { north: 28.5, south: 27.5, east: 88.5, west: 87.5 },
  C2000: { north: 28.5, south: 27.5, east: 85.0, west: 84.0 },
  C4000: { north: 28.8, south: 27.8, east: 84.8, west: 83.8 },
  C6000: { north: 29.0, south: 28.0, east: 84.5, west: 83.5 },
  W2000: { north: 32.5, south: 31.5, east: 77.5, west: 76.5 },
  W4000: { north: 32.8, south: 31.8, east: 77.3, west: 76.3 },
  W6000: { north: 33.0, south: 32.0, east: 77.0, west: 76.0 },
};

interface GriddedHeatmapProps {
  lats: number[];
  lons: number[];
  values: (number | null)[][];
  unit: string;
  selectedRegion?: string;
  valueRange?: { min: number | null; max: number | null };
}

export function GriddedHeatmap({
  lats,
  lons,
  values,
  unit,
  selectedRegion,
  valueRange,
}: GriddedHeatmapProps) {
  const shapes = Object.entries(REGION_BOUNDS).map(([code, b]) => ({
    type: 'rect' as const,
    x0: b.west,
    x1: b.east,
    y0: b.south,
    y1: b.north,
    line: {
      color: code === selectedRegion ? '#FFD700' : 'rgba(255,255,255,0.75)',
      width: code === selectedRegion ? 3 : 1.5,
    },
    fillcolor: 'rgba(0,0,0,0)',
  }));

  const annotations = Object.entries(REGION_BOUNDS).map(([code, b]) => ({
    x: (b.west + b.east) / 2,
    y: (b.south + b.north) / 2,
    text: code,
    showarrow: false,
    font: {
      color: code === selectedRegion ? '#FFD700' : 'white',
      size: 9,
      family: 'monospace',
    },
  }));

  return (
    <Plot
      data={[
        {
          type: 'heatmap',
          x: lons,
          y: lats,
          z: values as any,
          colorscale: 'RdYlBu_r',
          colorbar: {
            title: { text: unit, side: 'right' } as any,
            thickness: 15,
            tickfont: { color: '#94a3b8', size: 11 },
            titlefont: { color: '#94a3b8', size: 12 },
          },
          zmin: valueRange?.min ?? undefined,
          zmax: valueRange?.max ?? undefined,
          hovertemplate:
            'Lon: %{x:.2f}°E<br>Lat: %{y:.2f}°N<br>Value: %{z:.2f} ' +
            unit +
            '<extra></extra>',
        } as any,
      ]}
      layout={
        {
          xaxis: {
            title: 'Longitude (°E)',
            gridcolor: '#334155',
            color: '#94a3b8',
            zeroline: false,
          },
          yaxis: {
            title: 'Latitude (°N)',
            gridcolor: '#334155',
            color: '#94a3b8',
            zeroline: false,
          },
          shapes,
          annotations,
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: '#0f172a',
          font: { color: '#94a3b8', size: 12 },
          margin: { t: 10, b: 60, l: 65, r: 20 },
        } as any
      }
      config={{ responsive: true, displayModeBar: true, displaylogo: false }}
      style={{ width: '100%', height: '500px' }}
    />
  );
}
