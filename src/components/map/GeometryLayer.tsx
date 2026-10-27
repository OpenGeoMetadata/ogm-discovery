import { useEffect, useMemo } from 'react';
import type { GeoJSONSource } from 'maplibre-gl';
import { useMap } from './MapLibreMap';
import { geometryData } from '../../utils/mapGeometry';

export function GeometryLayer({
  id,
  data,
  color = '#2563eb',
  opacity = 0.15,
  width = 2,
  dashed = false,
}: {
  id: string;
  data: unknown;
  color?: string;
  opacity?: number;
  width?: number;
  dashed?: boolean;
}) {
  const map = useMap();
  const sourceId = `discovery-${id}`;
  const geojson = useMemo(() => geometryData(data), [data]);
  useEffect(() => {
    let applied: GeoJSONSource | undefined;
    const draw = () => {
      if (!map.isStyleLoaded()) return;
      const existing = map.getSource(sourceId) as GeoJSONSource | undefined;
      if (existing) {
        if (existing === applied) return;
        applied = existing;
        existing.setData(geojson);
        return;
      }
      map.addSource(sourceId, { type: 'geojson', data: geojson });
      applied = map.getSource(sourceId) as GeoJSONSource;
      map.addLayer({
        id: `${sourceId}-fill`,
        type: 'fill',
        source: sourceId,
        filter: ['==', '$type', 'Polygon'],
        paint: { 'fill-color': color, 'fill-opacity': opacity },
      });
      map.addLayer({
        id: `${sourceId}-line`,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': color,
          'line-width': width,
          ...(dashed ? { 'line-dasharray': [5, 3] } : {}),
        },
      });
      map.addLayer({
        id: `${sourceId}-point`,
        type: 'circle',
        source: sourceId,
        filter: ['==', '$type', 'Point'],
        paint: { 'circle-color': color, 'circle-radius': 5 },
      });
    };
    draw();
    map.on('style.load', draw);
    map.on('idle', draw);
    return () => {
      map.off('style.load', draw);
      map.off('idle', draw);
      for (const suffix of ['fill', 'line', 'point'])
        if (map.getLayer(`${sourceId}-${suffix}`))
          map.removeLayer(`${sourceId}-${suffix}`);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    };
  }, [map, sourceId, geojson, color, opacity, width, dashed]);
  return null;
}
