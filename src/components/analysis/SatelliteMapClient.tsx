'use client';

// Leaflet CSS is safe here — this file is only ever loaded client-side
// because SatelliteHeatmap.tsx wraps it with dynamic(..., { ssr: false })
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import React, { useEffect, useRef } from 'react';

// ─── region metadata (mirrors backend Config.REGIONS exactly) ───────────────
const REGION_META: Record<string, {
  north: number; south: number; east: number; west: number;
  name: string; zone: string; elevation: string; climate: string; color: string;
}> = {
  E2000: { north: 28.0, south: 27.0, east: 89.0, west: 88.0, name: 'Eastern Valleys',  zone: 'Eastern', elevation: '1000–2000 m', climate: 'Subtropical',    color: '#FF6B6B' },
  E4000: { north: 28.3, south: 27.3, east: 88.8, west: 87.8, name: 'Eastern Hills',    zone: 'Eastern', elevation: '2000–4000 m', climate: 'Temperate',       color: '#FF5722' },
  E6000: { north: 28.5, south: 27.5, east: 88.5, west: 87.5, name: 'Eastern Peaks',    zone: 'Eastern', elevation: '4000–6000 m', climate: 'Alpine',          color: '#FF3D00' },
  C2000: { north: 28.5, south: 27.5, east: 85.0, west: 84.0, name: 'Central Valleys',  zone: 'Central', elevation: '1000–2000 m', climate: 'Subtropical',    color: '#4CAF50' },
  C4000: { north: 28.8, south: 27.8, east: 84.8, west: 83.8, name: 'Central Hills',    zone: 'Central', elevation: '2000–4000 m', climate: 'Temperate',       color: '#388E3C' },
  C6000: { north: 29.0, south: 28.0, east: 84.5, west: 83.5, name: 'Central Peaks',    zone: 'Central', elevation: '4000–6000 m', climate: 'Alpine',          color: '#2E7D32' },
  W2000: { north: 32.5, south: 31.5, east: 77.5, west: 76.5, name: 'Western Valleys',  zone: 'Western', elevation: '1000–2000 m', climate: 'Arid Subtropical', color: '#2196F3' },
  W4000: { north: 32.8, south: 31.8, east: 77.3, west: 76.3, name: 'Western Hills',    zone: 'Western', elevation: '2000–4000 m', climate: 'Temperate Arid',  color: '#1976D2' },
  W6000: { north: 33.0, south: 32.0, east: 77.0, west: 76.0, name: 'Western Peaks',    zone: 'Western', elevation: '4000–6000 m', climate: 'Cold Desert',     color: '#1565C0' },
};

// ─── RdYlBu_r colour scale (blue → yellow → red) ────────────────────────────
const COLOR_STOPS = [
  [49,  54,  149],
  [69,  117, 180],
  [116, 173, 209],
  [171, 217, 233],
  [255, 255, 191],
  [254, 224, 144],
  [244, 109,  67],
  [215,  48,  39],
  [165,   0,  38],
] as const;

function valueToColor(value: number, min: number, max: number): string {
  if (max === min) return 'rgba(128,128,128,0.6)';
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const seg = t * (COLOR_STOPS.length - 1);
  const lo  = Math.floor(seg);
  const hi  = Math.min(lo + 1, COLOR_STOPS.length - 1);
  const f   = seg - lo;
  const r   = Math.round(COLOR_STOPS[lo][0] + f * (COLOR_STOPS[hi][0] - COLOR_STOPS[lo][0]));
  const g   = Math.round(COLOR_STOPS[lo][1] + f * (COLOR_STOPS[hi][1] - COLOR_STOPS[lo][1]));
  const b   = Math.round(COLOR_STOPS[lo][2] + f * (COLOR_STOPS[hi][2] - COLOR_STOPS[lo][2]));
  return `rgba(${r},${g},${b},0.70)`;
}

function cssGradient(): string {
  const pct = COLOR_STOPS.map((s, i) =>
    `rgb(${s[0]},${s[1]},${s[2]}) ${Math.round((i / (COLOR_STOPS.length - 1)) * 100)}%`
  ).join(', ');
  return `linear-gradient(to right, ${pct})`;
}

// ─── props ──────────────────────────────────────────────────────────────────
export interface SatelliteMapClientProps {
  lats: number[];
  lons: number[];
  values: (number | null)[][];
  unit: string;
  variableName?: string;
  selectedRegion?: string;
  regions?: Record<string, {
    value: number | null;
    name: string;
    zone: string;
    elevation_range: string;
    climate_zone: string;
  }>;
  timeRange?: { start: string | null; end: string | null };
}

// ─── component ──────────────────────────────────────────────────────────────
export default function SatelliteMapClient({
  lats, lons, values, unit, variableName, selectedRegion, regions, timeRange,
}: SatelliteMapClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Tear down any previous instance (React strict-mode fires effects twice)
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // ── compute actual min/max from the grid, not region averages ────────────
    let dataMin = Infinity, dataMax = -Infinity;
    for (const row of values) {
      for (const v of row) {
        if (v !== null && v !== undefined) {
          if (v < dataMin) dataMin = v;
          if (v > dataMax) dataMax = v;
        }
      }
    }
    if (!isFinite(dataMin)) { dataMin = 0; dataMax = 1; }

    // ── initialise map ───────────────────────────────────────────────────────
    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true,
    });
    mapRef.current = map;

    // Fit to Himalayan domain (matches backend clip bounds)
    map.fitBounds([[24, 68], [36, 92]], { padding: [10, 10] });

    // ESRI satellite base
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Imagery © Esri', maxZoom: 18 }
    ).addTo(map);

    // ESRI place-name labels
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 18, opacity: 0.75 }
    ).addTo(map);

    // ── draw CRU 0.5° grid cells ─────────────────────────────────────────────
    const cellHalf = lats.length > 1 ? Math.abs(lats[1] - lats[0]) / 2 : 0.25;

    for (let r = 0; r < lats.length; r++) {
      for (let c = 0; c < lons.length; c++) {
        const v = values[r]?.[c];
        if (v === null || v === undefined) continue;
        const lat = lats[r], lon = lons[c];

        L.rectangle(
          [[lat - cellHalf, lon - cellHalf], [lat + cellHalf, lon + cellHalf]],
          { color: 'none', fillColor: valueToColor(v, dataMin, dataMax), fillOpacity: 0.70, weight: 0 }
        )
          .bindTooltip(
            `<b>${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E</b><br/>` +
            `${variableName ?? 'Value'}: <b>${v.toFixed(2)} ${unit}</b>`,
            { sticky: true, className: 'him-tip' }
          )
          .addTo(map);
      }
    }

    // ── draw study region boundaries ─────────────────────────────────────────
    for (const [code, meta] of Object.entries(REGION_META)) {
      const isSelected = code === selectedRegion;
      const apiRegion  = regions?.[code];
      const val        = apiRegion?.value;

      const tooltipHtml =
        `<div style="font-family:system-ui;min-width:140px">` +
        `<div style="font-weight:700;font-size:12px;color:${meta.color};margin-bottom:4px">${code} — ${meta.name}</div>` +
        `<div style="font-size:11px;color:#444;line-height:1.6">` +
        `Zone: <b>${meta.zone}</b><br/>` +
        `Elevation: <b>${meta.elevation}</b><br/>` +
        `Climate: <b>${meta.climate}</b><br/>` +
        (val !== null && val !== undefined
          ? `Mean: <b>${val.toFixed(2)} ${unit}</b>`
          : '') +
        `</div></div>`;

      L.rectangle(
        [[meta.south, meta.west], [meta.north, meta.east]],
        {
          color:     isSelected ? '#FFD700' : '#ffffff',
          weight:    isSelected ? 3 : 1.5,
          fillOpacity: 0,
          dashArray: isSelected ? undefined : '6 4',
        }
      )
        .bindTooltip(tooltipHtml, { direction: 'top', sticky: false, className: 'him-region-tip' })
        .addTo(map);

      // Code label in the centre of each box
      const centerLat = (meta.south + meta.north) / 2;
      const centerLon = (meta.west  + meta.east)  / 2;
      L.marker([centerLat, centerLon], {
        icon: L.divIcon({
          className: '',
          html: `<span style="
            background:rgba(0,0,0,0.55);color:${isSelected ? '#FFD700' : '#fff'};
            font-size:9px;font-weight:700;font-family:monospace;
            padding:1px 4px;border-radius:3px;white-space:nowrap;
            border:${isSelected ? '1px solid #FFD700' : 'none'};
          ">${code}</span>`,
          iconAnchor: [16, 8],
        }),
        interactive: false,
      }).addTo(map);
    }

    // ── colour legend ─────────────────────────────────────────────────────────
    const legend = new L.Control({ position: 'bottomright' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div');
      const tRange = timeRange
        ? `<div style="color:#666;font-size:9px;margin-bottom:4px">
             ${timeRange.start?.slice(0,4) ?? ''} – ${timeRange.end?.slice(0,4) ?? ''}
           </div>`
        : '';
      div.innerHTML = `
        <div style="background:rgba(255,255,255,0.92);padding:8px 10px;
                    border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.25);
                    font-family:system-ui;min-width:160px">
          ${tRange}
          <div style="font-weight:600;font-size:11px;margin-bottom:5px">
            ${variableName ?? 'Value'} (${unit})
          </div>
          <div style="height:12px;border-radius:4px;background:${cssGradient()}"></div>
          <div style="display:flex;justify-content:space-between;font-size:10px;
                      color:#555;margin-top:3px">
            <span>${dataMin.toFixed(1)}</span>
            <span>${((dataMin + dataMax) / 2).toFixed(1)}</span>
            <span>${dataMax.toFixed(1)}</span>
          </div>
        </div>`;
      L.DomEvent.disableClickPropagation(div);
      return div;
    };
    legend.addTo(map);

    // ── scale bar ─────────────────────────────────────────────────────────────
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lats, lons, values, unit, variableName, selectedRegion, regions, timeRange]);

  return (
    <>
      <style>{`
        .him-tip {
          background: rgba(15,23,42,0.90) !important;
          border: 1px solid rgba(255,255,255,0.15) !important;
          color: #e2e8f0 !important;
          font-size: 12px !important;
          border-radius: 6px !important;
          padding: 6px 9px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
        }
        .him-tip::before { display:none !important; }
        .him-region-tip {
          background: #fff !important;
          border: none !important;
          box-shadow: 0 3px 12px rgba(0,0,0,0.25) !important;
          border-radius: 8px !important;
          padding: 8px 10px !important;
        }
        .him-region-tip::before { display:none !important; }
        .leaflet-control-attribution { font-size: 9px !important; }
      `}</style>
      <div
        ref={containerRef}
        style={{ height: 560, borderRadius: 12, overflow: 'hidden', background: '#0f172a' }}
      />
    </>
  );
}
