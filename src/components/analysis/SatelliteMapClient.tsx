'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import React, { useEffect, useRef } from 'react';

// ─── colour scale (RdYlBu_r) ────────────────────────────────────────────────
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
  const t   = Math.max(0, Math.min(1, (value - min) / (max - min)));
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
  return COLOR_STOPS.map((s, i) =>
    `rgb(${s[0]},${s[1]},${s[2]}) ${Math.round((i / (COLOR_STOPS.length - 1)) * 100)}%`
  ).join(', ');
}

// ─── zone colour palette (matches shapefile colors) ─────────────────────────
const ZONE_COLORS: Record<string, string> = {
  Central: '#27ae60',
  Eastern: '#2980b9',
  Western: '#e74c3c',
};

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

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // ── compute actual min/max from the grid values ──────────────────────────
    let dataMin = Infinity, dataMax = -Infinity;
    for (const row of values)
      for (const v of row)
        if (v !== null && v !== undefined) {
          if (v < dataMin) dataMin = v;
          if (v > dataMax) dataMax = v;
        }
    if (!isFinite(dataMin)) { dataMin = 0; dataMax = 1; }

    // ── initialise map ───────────────────────────────────────────────────────
    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      attributionControl: true,
    });
    mapRef.current = map;

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

    // ── draw CRU 0.5° climate grid ───────────────────────────────────────────
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

    // ── load shapefile boundaries as GeoJSON ─────────────────────────────────
    fetch('/geojson/all_regions.geojson')
      .then(r => r.json())
      .then((geojson: GeoJSON.FeatureCollection) => {
        if (!mapRef.current) return;

        L.geoJSON(geojson, {
          style: (feature) => {
            const props  = feature?.properties ?? {};
            const code   = props.region_code as string;
            const zone   = props.zone as string;
            const isSel  = code === selectedRegion;
            const color  = ZONE_COLORS[zone] ?? '#ffffff';
            return {
              color:       isSel ? '#FFD700' : color,
              weight:      isSel ? 3          : 2,
              opacity:     1,
              fillOpacity: isSel ? 0.10       : 0.05,
              fillColor:   isSel ? '#FFD700'  : color,
              dashArray:   isSel ? undefined  : '6 4',
            };
          },
          onEachFeature: (feature, layer) => {
            const props     = feature.properties ?? {};
            const code      = props.region_code as string;
            const apiRegion = regions?.[code];
            const val       = apiRegion?.value;
            const zone      = props.zone as string;
            const zoneColor = ZONE_COLORS[zone] ?? '#888';

            const popupHtml =
              `<div style="font-family:system-ui;min-width:160px">` +
              `<div style="font-weight:700;font-size:13px;color:${zoneColor};margin-bottom:6px">` +
              `  ${code} — ${props.area_name}` +
              `</div>` +
              `<table style="font-size:11px;color:#444;border-collapse:collapse;width:100%">` +
              `  <tr><td style="padding:2px 6px 2px 0;color:#888">Zone</td>` +
              `      <td><b>${zone}</b></td></tr>` +
              `  <tr><td style="padding:2px 6px 2px 0;color:#888">Elevation</td>` +
              `      <td><b>${props.elevation_range}</b></td></tr>` +
              `  <tr><td style="padding:2px 6px 2px 0;color:#888">Climate</td>` +
              `      <td><b>${apiRegion?.climate_zone ?? '—'}</b></td></tr>` +
              (val !== null && val !== undefined
                ? `  <tr><td style="padding:2px 6px 2px 0;color:#888">Mean</td>` +
                  `      <td><b>${val.toFixed(2)} ${unit}</b></td></tr>`
                : '') +
              `</table></div>`;

            layer.bindPopup(popupHtml, { className: 'him-popup', maxWidth: 220 });

            // Permanent code label at centroid
            const centLat = props.centroid_lat as number;
            const centLon = props.centroid_lon as number;
            if (centLat && centLon && mapRef.current) {
              const isSel = code === selectedRegion;
              L.marker([centLat, centLon], {
                icon: L.divIcon({
                  className: '',
                  html: `<span style="
                    background:rgba(0,0,0,0.60);
                    color:${isSel ? '#FFD700' : '#fff'};
                    font-size:10px;font-weight:700;font-family:monospace;
                    padding:2px 5px;border-radius:3px;white-space:nowrap;
                    border:1px solid ${isSel ? '#FFD700' : 'rgba(255,255,255,0.3)'};
                    pointer-events:none;
                  ">${code}</span>`,
                  iconAnchor: [18, 9],
                }),
                interactive: false,
              }).addTo(mapRef.current);
            }
          },
        }).addTo(map);
      })
      .catch(() => {
        // GeoJSON failed to load — map still works with CRU grid
      });

    // ── colour legend (bottom-right) ─────────────────────────────────────────
    const legend = new L.Control({ position: 'bottomright' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div');
      const yr = timeRange
        ? `<div style="color:#888;font-size:9px;margin-bottom:3px">` +
          `${timeRange.start?.slice(0,4) ?? ''} – ${timeRange.end?.slice(0,4) ?? ''}` +
          `</div>` : '';
      div.innerHTML =
        `<div style="background:rgba(255,255,255,0.93);padding:8px 10px;border-radius:8px;
                     box-shadow:0 2px 8px rgba(0,0,0,0.25);font-family:system-ui;min-width:165px">` +
          `${yr}` +
          `<div style="font-weight:600;font-size:11px;margin-bottom:5px">` +
          `  ${variableName ?? 'Value'} (${unit})` +
          `</div>` +
          `<div style="height:12px;border-radius:4px;background:linear-gradient(to right,${cssGradient()})"></div>` +
          `<div style="display:flex;justify-content:space-between;font-size:10px;color:#555;margin-top:3px">` +
          `  <span>${dataMin.toFixed(1)}</span>` +
          `  <span>${((dataMin+dataMax)/2).toFixed(1)}</span>` +
          `  <span>${dataMax.toFixed(1)}</span>` +
          `</div>` +
        `</div>`;
      L.DomEvent.disableClickPropagation(div);
      return div;
    };
    legend.addTo(map);

    // ── shapefile zone legend (top-right) ─────────────────────────────────────
    const zoneLegend = new L.Control({ position: 'topright' });
    zoneLegend.onAdd = () => {
      const div = L.DomUtil.create('div');
      div.innerHTML =
        `<div style="background:rgba(255,255,255,0.93);padding:8px 10px;border-radius:8px;
                     box-shadow:0 2px 8px rgba(0,0,0,0.25);font-family:system-ui">` +
          `<div style="font-weight:600;font-size:11px;margin-bottom:5px">Study Regions</div>` +
          Object.entries(ZONE_COLORS).map(([zone, color]) =>
            `<div style="display:flex;align-items:center;gap:6px;font-size:11px;margin-bottom:3px">` +
            `  <div style="width:12px;height:12px;border-radius:2px;background:${color};opacity:0.85"></div>` +
            `  <span style="color:#333">${zone} Himalaya</span>` +
            `</div>`
          ).join('') +
          `<div style="margin-top:5px;padding-top:5px;border-top:1px solid #eee;font-size:10px;color:#888">` +
          `  Click region for details` +
          `</div>` +
        `</div>`;
      L.DomEvent.disableClickPropagation(div);
      return div;
    };
    zoneLegend.addTo(map);

    // ── scale bar ─────────────────────────────────────────────────────────────
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
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
        .him-popup .leaflet-popup-content-wrapper {
          border-radius: 10px !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.2) !important;
          padding: 0 !important;
        }
        .him-popup .leaflet-popup-content { margin: 10px 12px !important; }
        .him-popup .leaflet-popup-tip-container { display: none !important; }
        .leaflet-control-attribution { font-size: 9px !important; }
      `}</style>
      <div
        ref={containerRef}
        style={{ height: 560, borderRadius: 12, overflow: 'hidden', background: '#0f172a' }}
      />
    </>
  );
}
