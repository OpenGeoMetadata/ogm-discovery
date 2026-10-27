import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { MapLibreMap, useMap } from '../map/MapLibreMap';
import { GeometryLayer } from '../map/GeometryLayer';
import { MapUpdaterHex, type HexStats } from '../map/MapUpdaterHex';
import { HexLayerToggleControl } from '../map/HexLayerToggleControl';
import { MapGeosearchControl } from '../map/MapGeosearchControl';
import {
  boundsPolygon,
  clearSearchBounds,
  dataBounds,
  fitMap,
  readSearchBounds,
  writeSearchBounds,
} from '../../utils/mapGeometry';
import { hexGeoJSON } from '../../utils/h3Map';
import {
  getSavedHexLayerEnabled,
  saveHexLayerEnabled,
} from '../../utils/hexLayerPreference';
import { useI18n } from '../../hooks/useI18n';
import { useMap as useHoveredMap } from '../../context/MapContext';
const EMPTY_STATS: HexStats = {
  hexes: [],
  resolution: 2,
  hexCount: 0,
  totalInView: 0,
  loading: false,
  error: null,
};
function FilterContents() {
  const map = useMap();
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const { hoveredGeometry } = useHoveredMap();
  const queryString = params.toString();
  const bounds = useMemo(
    () => readSearchBounds(new URLSearchParams(queryString)),
    [queryString]
  );
  const [showSearch, setShowSearch] = useState(false);
  const [placeGeometry, setPlaceGeometry] = useState<unknown>(null);
  const [enabled, setEnabled] = useState(getSavedHexLayerEnabled);
  const [stats, setStats] = useState(EMPTY_STATS);
  const fitKey = useRef<string | null>(null);
  const queryKey = useMemo(() => {
    const q = new URLSearchParams(queryString);
    q.delete('page');
    q.delete('view');
    q.delete('per_page');
    return q.toString();
  }, [queryString]);
  const onHexData = useCallback(
    (next: HexStats) => {
      setStats(next);
      if (fitKey.current === queryKey || next.loading || next.error || bounds)
        return;
      fitKey.current = queryKey;
      const extent = dataBounds(hexGeoJSON(next.hexes));
      if (extent) fitMap(map, extent);
    },
    [map, queryKey, bounds]
  );
  useEffect(() => {
    saveHexLayerEnabled(enabled);
  }, [enabled]);
  useEffect(() => {
    if (bounds) fitMap(map, bounds, 20);
    else setPlaceGeometry(null);
    setShowSearch(false);
  }, [map, bounds]);
  useEffect(() => {
    const moved = (event: { originalEvent?: unknown }) => {
      if (event.originalEvent) setShowSearch(true);
    };
    map.on('movestart', moved);
    return () => {
      map.off('movestart', moved);
    };
  }, [map]);
  const search = () => {
    const b = map.getBounds();
    const next = writeSearchBounds(
      new URLSearchParams(params),
      [
        [b.getWest(), b.getSouth()],
        [b.getEast(), b.getNorth()],
      ],
      params.get('include_filters[geo][relation]') || 'intersects'
    );
    if (next) setParams(next);
    setShowSearch(false);
  };
  return (
    <>
      <MapGeosearchControl
        onPlaceSelect={(place) => {
          setPlaceGeometry(
            place.attributes.geojson ??
              boundsPolygon([
                [place.attributes.min_longitude, place.attributes.min_latitude],
                [place.attributes.max_longitude, place.attributes.max_latitude],
              ])
          );
          setShowSearch(true);
        }}
      />
      <HexLayerToggleControl
        enabled={enabled}
        onToggle={setEnabled}
        {...stats}
        searchQuery={params.get('q') ?? ''}
        queryString={queryString}
      />
      {enabled && (
        <MapUpdaterHex
          searchQuery={params.get('q') ?? ''}
          queryString={queryString}
          onHexData={onHexData}
          interactive={false}
        />
      )}
      {bounds && (
        <GeometryLayer id="filter-bounds" data={boundsPolygon(bounds)} />
      )}
      <GeometryLayer id="selected-place" data={placeGeometry} />
      <GeometryLayer
        id="hovered-record"
        data={hoveredGeometry}
        color="#f59e0b"
      />
      {showSearch && (
        <button
          className="absolute top-2 right-2 z-10 bg-blue-700 text-white p-2 rounded"
          onClick={search}
        >
          {t('common.searchHere')}
        </button>
      )}
    </>
  );
}
export function GeospatialFilterMap({
  hideHeading = false,
}: {
  hideHeading?: boolean;
}) {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const hasBounds = !!readSearchBounds(params);
  const relation = params.get('include_filters[geo][relation]') || 'intersects';
  return (
    <div className={hideHeading ? '' : 'mb-6'}>
      {!hideHeading && (
        <div className="flex justify-between mb-1">
          <h3 className="font-semibold">{t('map.location')}</h3>
          {hasBounds && (
            <button
              aria-label={t('map.clearLocation')}
              onClick={() =>
                setParams(clearSearchBounds(new URLSearchParams(params)))
              }
            >
              {t('map.clear')}
            </button>
          )}
        </div>
      )}
      {hasBounds && (
        <div
          className="flex gap-1 mb-2"
          role="group"
          aria-label={t('map.relation')}
        >
          {(['within', 'intersects'] as const).map((mode) => (
            <button
              key={mode}
              aria-pressed={relation === mode}
              className={`rounded px-2 py-1 text-xs ${relation === mode ? 'bg-blue-700 text-white' : 'bg-white'}`}
              onClick={() => {
                const next = new URLSearchParams(params);
                next.set('include_filters[geo][relation]', mode);
                next.delete('page');
                setParams(next);
              }}
            >
              {t(`map.${mode}`)}
            </button>
          ))}
        </div>
      )}
      <MapLibreMap className="aspect-square w-full rounded-lg border border-gray-200">
        <FilterContents />
      </MapLibreMap>
    </div>
  );
}
export default GeospatialFilterMap;
