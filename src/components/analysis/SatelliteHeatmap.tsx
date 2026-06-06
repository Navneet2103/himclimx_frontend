'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import type { SatelliteMapClientProps } from './SatelliteMapClient';

export type { SatelliteMapClientProps as SatelliteHeatmapProps };

const SatelliteMapClient = dynamic(() => import('./SatelliteMapClient'), {
  ssr: false,
  loading: () => (
    <div
      style={{ height: 560, borderRadius: 12 }}
      className="flex items-center justify-center bg-slate-900 text-slate-400 text-sm"
    >
      Loading satellite map…
    </div>
  ),
});

export function SatelliteHeatmap(props: SatelliteMapClientProps) {
  return <SatelliteMapClient {...props} />;
}
