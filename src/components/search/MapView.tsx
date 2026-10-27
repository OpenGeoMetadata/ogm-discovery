import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import type { GeoDocument } from '../../types/api';
import { useMap as useHoveredMap } from '../../context/MapContext';
import { MapLibreMap } from '../map/MapLibreMap';
import { useMap } from '../../context/MapLibreContext';
import { GeometryLayer } from '../map/GeometryLayer';
import {
  boundsPolygon,
  dataBounds,
  fitMap,
  geometryData,
  readSearchBounds,
} from '../../utils/mapGeometry';
function Contents({ results }: { results: GeoDocument[] }) {
  const map = useMap();
  const { hoveredGeometry } = useHoveredMap();
  const [params] = useSearchParams();
  const data = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: results.flatMap(
        (r) =>
          geometryData(
            r.meta?.ui?.viewer?.geometry ?? r.attributes.ogm.locn_geometry
          ).features
      ),
    }),
    [results]
  );
  const filter = useMemo(() => readSearchBounds(params), [params]);
  const highlight = useMemo(
    () => geometryData(hoveredGeometry),
    [hoveredGeometry]
  );
  useEffect(() => {
    const bounds = dataBounds(
      highlight.features.length
        ? highlight
        : {
            type: 'FeatureCollection',
            features: [
              ...data.features,
              ...(filter ? boundsPolygon(filter).features : []),
            ],
          }
    );
    if (bounds) fitMap(map, bounds);
  }, [map, data, highlight, filter]);
  return (
    <>
      <GeometryLayer id="bookmark-results" data={data} />
      <GeometryLayer
        id="bookmark-hover"
        data={highlight}
        width={3}
        opacity={0.3}
      />
      {filter && (
        <GeometryLayer
          id="bookmark-filter"
          data={boundsPolygon(filter)}
          color="#ef4444"
          dashed
        />
      )}
    </>
  );
}
export function MapView({ results }: { results: GeoDocument[] }) {
  return (
    <div className="sticky top-[88px]">
      <MapLibreMap className="h-[calc(100vh-120px)] w-full rounded-lg">
        <Contents results={results} />
      </MapLibreMap>
    </div>
  );
}
