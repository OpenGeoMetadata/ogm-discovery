import { useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import type { GeoJSONSource, Map as GLMap } from 'maplibre-gl';
import type { GeoDocument } from '../../types/api';
import { recordFeature } from './topoDiscovery';

export function DiscoveryFootprints({
  map,
  records,
}: {
  map: GLMap | null;
  records: GeoDocument[];
}) {
  const { theme } = useTheme();
  const color = theme.branding?.colors?.primary || '#905125';
  useEffect(() => {
    if (!map) return;
    const id = 'research-discovery-footprints';
    const data: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: records.flatMap((record) => {
        const f = recordFeature(record);
        return f ? [f] : [];
      }),
    };
    const draw = () => {
      if (!map.isStyleLoaded()) return;
      if (!map.getSource(id)) map.addSource(id, { type: 'geojson', data });
      else (map.getSource(id) as GeoJSONSource).setData(data);
      if (!map.getLayer(id))
        map.addLayer({
          id,
          type: 'line',
          source: id,
          paint: {
            'line-color': color,
            'line-width': 1.5,
            'line-opacity': 0.65,
          },
        });
    };
    draw();
    map.on('style.load', draw);
    return () => {
      map.off('style.load', draw);
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    };
  }, [map, records, color]);
  return null;
}
