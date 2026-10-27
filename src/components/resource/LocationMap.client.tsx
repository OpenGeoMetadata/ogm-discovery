import { useEffect, useMemo } from 'react';
import { MapLibreMap } from '../map/MapLibreMap';
import { useMap } from '../../context/MapLibreContext';
import { GeometryLayer } from '../map/GeometryLayer';
import {
  boundsPolygon,
  dataBounds,
  fitMap,
  geometryData,
} from '../../utils/mapGeometry';
import { useI18n } from '../../hooks/useI18n';
interface LocationMapProps {
  geometry: string | GeoJSON.Geometry | { wkt: string } | null;
}
function LocationGeometry({ geometry }: LocationMapProps) {
  const map = useMap();
  const data = useMemo(() => geometryData(geometry), [geometry]);
  const bounds = useMemo(() => dataBounds(data), [data]);
  useEffect(() => {
    if (bounds) fitMap(map, bounds, 20);
  }, [map, bounds]);
  return (
    <>
      <GeometryLayer id="location" data={data} />
      {bounds &&
        data.features.some((f) => f.geometry.type === 'MultiPolygon') && (
          <GeometryLayer
            id="location-extent"
            data={boundsPolygon(bounds)}
            opacity={0}
            dashed
          />
        )}
    </>
  );
}
export function LocationMap({ geometry }: LocationMapProps) {
  const { t } = useI18n();
  const valid = dataBounds(geometryData(geometry));
  return (
    <section className="bg-white rounded-lg shadow-md overflow-hidden">
      <h2 className="px-6 py-4 bg-gray-50 border-b border-gray-200 text-lg font-semibold">
        {t('map.location')}
      </h2>
      {valid ? (
        <MapLibreMap className="h-[300px] w-full">
          <LocationGeometry geometry={geometry} />
        </MapLibreMap>
      ) : (
        <p role="status" className="p-4">
          {t('map.geometryMissing')}
        </p>
      )}
    </section>
  );
}
export default LocationMap;
