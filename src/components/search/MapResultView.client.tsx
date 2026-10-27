import { useEffect, useMemo, useRef } from 'react';
import { Marker, Popup } from 'maplibre-gl';
import { useSearchParams } from 'react-router';
import type { GeoDocument } from '../../types/api';
import {
  getBboxFromGeometry,
  getCentroidFromGeometry,
} from '../../utils/geometryUtils';
import { parseBboxToLeafletBounds } from '../../utils/bbox';
import {
  boundsPolygon,
  dataBounds,
  fitMap,
  geometryData,
  readSearchBounds,
  toMapBounds,
  type MapBounds,
} from '../../utils/mapGeometry';
import { MapLibreMap, useMap } from '../map/MapLibreMap';
import { GeometryLayer } from '../map/GeometryLayer';
import { useI18n } from '../../hooks/useI18n';
import { useMap as useHoveredMap } from '../../context/MapContext';
interface MapResultViewProps {
  results: GeoDocument[];
  highlightedResourceId?: string | null;
  highlightedGeometry?: string | null;
  resultStartIndex?: number;
}
function centroid(resource: GeoDocument): [number, number] | null {
  const ogm = resource.attributes.ogm;
  const raw = ogm.dcat_centroid ?? ogm.dcat_centroid_original;
  if (raw) {
    const [lat, lon] = raw.split(',').map(Number);
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lon) <= 180
    )
      return [lon, lat];
  }
  const p = getCentroidFromGeometry(
    resource.meta?.ui?.viewer?.geometry ??
      ogm.locn_geometry ??
      ogm.locn_geometry_original
  );
  return p ? [p[1], p[0]] : null;
}
export function spiderOffsets(count: number): [number, number][] {
  return Array.from({ length: count }, (_, i) => {
    const angle = count < 9 ? (i * 2 * Math.PI) / count : i * 0.8;
    const radius = count < 9 ? Math.max(40, count * 7) : 35 + i * 5;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  });
}
function ResultsContents({
  results,
  highlightedResourceId,
  highlightedGeometry,
  resultStartIndex = 1,
}: MapResultViewProps) {
  const map = useMap();
  const { t } = useI18n();
  const hovered = useHoveredMap();
  const [params] = useSearchParams();
  const filterBounds = readSearchBounds(params);
  const markers = useRef<
    Array<{ marker: Marker; resource: GeoDocument; position: [number, number] }>
  >([]);
  const pins = useMemo(
    () =>
      results.flatMap((resource, i) => {
        const position = centroid(resource);
        return position
          ? [{ resource, position, number: resultStartIndex + i }]
          : [];
      }),
    [results, resultStartIndex]
  );
  const hoverRef = useRef(hovered);
  hoverRef.current = hovered;
  useEffect(() => {
    const extents: MapBounds[] = results.flatMap((r) => {
      const ogm = r.attributes.ogm;
      const bbox =
        parseBboxToLeafletBounds(
          (ogm.dcat_bbox ?? ogm.dcat_bbox_original) as string | undefined
        ) ??
        getBboxFromGeometry(
          r.meta?.ui?.viewer?.geometry ??
            ogm.locn_geometry ??
            ogm.locn_geometry_original
        );
      const p = centroid(r);
      return bbox ? [toMapBounds(bbox)] : p ? [[p, p] as MapBounds] : [];
    });
    const filter = readSearchBounds(params);
    if (filter) extents.push(filter);
    if (extents.length)
      fitMap(
        map,
        [
          [
            Math.min(...extents.map((b) => b[0][0])),
            Math.min(...extents.map((b) => b[0][1])),
          ],
          [
            Math.max(...extents.map((b) => b[1][0])),
            Math.max(...extents.map((b) => b[1][1])),
          ],
        ],
        50
      );
  }, [map, results, params]);
  useEffect(() => {
    let expanded = false;
    let popup: Popup | null = null;
    const id = 'discovery-pin-connectors';
    let connectors: GeoJSON.FeatureCollection | null = null;
    const drawConnectors = () => {
      if (!connectors || !map.isStyleLoaded() || map.getSource(id)) return;
      map.addSource(id, { type: 'geojson', data: connectors });
      map.addLayer({
        id,
        type: 'line',
        source: id,
        paint: { 'line-color': '#475569', 'line-width': 1 },
      });
    };
    const collapse = () => {
      for (const entry of markers.current)
        entry.marker.setLngLat(entry.position);
      expanded = false;
      connectors = null;
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    };
    const entries = pins.map((pin) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'discovery-numbered-pin';
      button.textContent = String(pin.number);
      button.setAttribute(
        'aria-label',
        `${t('map.result', { number: pin.number })}: ${pin.resource.attributes.ogm.dct_title_s || t('map.untitled')}`
      );
      const marker = new Marker({ element: button })
        .setLngLat(pin.position)
        .addTo(map);
      const show = () => {
        const content = document.createElement('div');
        const title = document.createElement('strong');
        title.textContent =
          pin.resource.attributes.ogm.dct_title_s || t('map.untitled');
        const link = document.createElement('a');
        link.href = `${import.meta.env.BASE_URL}#/resources/${encodeURIComponent(pin.resource.id)}`;
        link.textContent = t('map.details');
        content.append(title, document.createElement('br'), link);
        popup?.remove();
        popup = new Popup()
          .setLngLat(marker.getLngLat())
          .setDOMContent(content)
          .addTo(map);
      };
      button.onclick = (event) => {
        event.stopPropagation();
        const origin = map.project(pin.position);
        const near = markers.current.filter((e) => {
          const p = map.project(e.position);
          return Math.hypot(p.x - origin.x, p.y - origin.y) < 30;
        });
        if (expanded || near.length < 2) {
          show();
          return;
        }
        collapse();
        expanded = true;
        const offsets = spiderOffsets(near.length);
        const features: GeoJSON.Feature<GeoJSON.LineString>[] = near.map(
          (entry, i) => {
            const p = map.unproject([
              origin.x + offsets[i][0],
              origin.y + offsets[i][1],
            ]);
            entry.marker.setLngLat(p);
            return {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [entry.position, [p.lng, p.lat]],
              },
            };
          }
        );
        connectors = { type: 'FeatureCollection', features };
        drawConnectors();
      };
      const enter = () => {
        hoverRef.current.setHoveredResourceId(pin.resource.id);
        const geometry = pin.resource.attributes.ogm.locn_geometry;
        hoverRef.current.setHoveredGeometry(
          typeof geometry === 'string'
            ? geometry
            : geometry
              ? JSON.stringify(geometry)
              : null
        );
      };
      const leave = () => {
        hoverRef.current.setHoveredResourceId(null);
        hoverRef.current.setHoveredGeometry(null);
      };
      button.onmouseenter = enter;
      button.onfocus = enter;
      button.onmouseleave = leave;
      button.onblur = leave;
      return { marker, resource: pin.resource, position: pin.position };
    });
    markers.current = entries;
    map.on('style.load', drawConnectors);
    map.on('idle', drawConnectors);
    map.on('movestart', collapse);
    map.on('click', collapse);
    return () => {
      map.off('style.load', drawConnectors);
      map.off('idle', drawConnectors);
      map.off('movestart', collapse);
      map.off('click', collapse);
      collapse();
      popup?.remove();
      entries.forEach((e) => e.marker.remove());
      markers.current = [];
    };
  }, [map, pins, t]);
  useEffect(() => {
    for (const entry of markers.current)
      entry.marker.getElement().dataset.highlighted = String(
        entry.resource.id ===
          (highlightedResourceId ?? hovered.hoveredResourceId)
      );
  }, [highlightedResourceId, hovered.hoveredResourceId, pins]);
  const highlight = highlightedGeometry ?? hovered.hoveredGeometry;
  const data = geometryData(highlight);
  const extent = dataBounds(data);
  return (
    <>
      <GeometryLayer
        id="result-highlight"
        data={data}
        color="#f59e0b"
        opacity={0.25}
        width={3}
      />
      {extent &&
        data.features.some((f) => f.geometry.type === 'MultiPolygon') && (
          <GeometryLayer
            id="result-extent"
            data={boundsPolygon(extent)}
            color="#f59e0b"
            opacity={0}
            dashed
          />
        )}
      {filterBounds && (
        <GeometryLayer
          id="result-filter"
          data={boundsPolygon(filterBounds)}
          dashed
        />
      )}
    </>
  );
}
export function MapResultView(props: MapResultViewProps) {
  const { t } = useI18n();
  if (!props.results.some((r) => centroid(r)))
    return (
      <p className="p-6" role="status">
        {t('map.noResults')}
      </p>
    );
  return (
    <MapLibreMap className="h-full w-full rounded-lg">
      <ResultsContents {...props} />
    </MapLibreMap>
  );
}
