import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Popup,
  type GeoJSONSource,
  type MapLayerMouseEvent,
} from 'maplibre-gl';
import { cellArea, UNITS } from 'h3-js';
import { useMap } from './MapLibreMap';
import { useMapH3 } from '../../hooks/useMapH3';
import {
  hexGeoJSON,
  h3RequestBboxes,
  mapZoomToResolution,
} from '../../utils/h3Map';
import { buildSearchUrl } from '../../utils/h3SearchUrl';
import { useI18n } from '../../hooks/useI18n';
import type { MapFeatureClickPayload } from '../../types/map';
export type HexHoverData = { h3: string; count: number; resolution: number };
export interface HexStats {
  hexes: Array<{ h3: string; count: number }>;
  hexCount: number;
  totalInView: number;
  loading: boolean;
  error: string | null;
  resolution: number;
}
export function MapUpdaterHex({
  searchQuery,
  queryString,
  onFeatureClick,
  onHexClick,
  enableSearchPopup = false,
  onHexData,
  onHexHover,
  hoveredHex,
  interactive = true,
}: {
  searchQuery: string;
  queryString?: string;
  onFeatureClick?: (feature: MapFeatureClickPayload) => void;
  onHexClick?: (hex: HexHoverData) => void;
  enableSearchPopup?: boolean;
  onHexData?: (stats: HexStats) => void;
  onHexHover?: (hex: HexHoverData | null) => void;
  hoveredHex?: HexHoverData | null;
  interactive?: boolean;
}) {
  const map = useMap();
  const { t, locale } = useI18n();
  const [view, setView] = useState(() => {
    const b = map.getBounds();
    return {
      bboxes: h3RequestBboxes([
        [b.getWest(), b.getSouth()],
        [b.getEast(), b.getNorth()],
      ]),
      resolution: mapZoomToResolution(map.getZoom()),
    };
  });
  useEffect(() => {
    const update = () => {
      const b = map.getBounds();
      const next = {
        bboxes: h3RequestBboxes([
          [b.getWest(), b.getSouth()],
          [b.getEast(), b.getNorth()],
        ]),
        resolution: mapZoomToResolution(map.getZoom()),
      };
      setView((prev) =>
        JSON.stringify(prev) === JSON.stringify(next) ? prev : next
      );
    };
    map.on('moveend', update);
    return () => {
      map.off('moveend', update);
    };
  }, [map]);
  const stats = useMapH3(searchQuery, null, view.resolution, queryString, {
    bboxes: view.bboxes,
  });
  const onData = useRef(onHexData);
  onData.current = onHexData;
  const { hexes, hexCount, totalInView, loading, error } = stats;
  useEffect(() => {
    onData.current?.({
      hexes,
      hexCount,
      totalInView,
      loading,
      error,
      resolution: view.resolution,
    });
  }, [hexes, hexCount, totalInView, loading, error, view.resolution]);
  const data = useMemo(() => hexGeoJSON(stats.hexes), [stats.hexes]);
  const callbacks = useRef({ onHexHover, onHexClick, onFeatureClick });
  callbacks.current = { onHexHover, onHexClick, onFeatureClick };
  const hoverRef = useRef(hoveredHex);
  hoverRef.current = hoveredHex;
  useEffect(() => {
    const id = 'discovery-hexes';
    let applied: GeoJSONSource | undefined;
    const draw = () => {
      if (!map.isStyleLoaded()) return;
      const source = map.getSource(id) as GeoJSONSource | undefined;
      if (source) {
        if (applied === source) return;
        applied = source;
        source.setData(data);
        return;
      }
      map.addSource(id, { type: 'geojson', data });
      applied = map.getSource(id) as GeoJSONSource;
      if (hoverRef.current)
        map.setFeatureState(
          { source: id, id: hoverRef.current.h3 },
          { hover: true }
        );
      const before = map
        .getStyle()
        .layers?.find((l) => l.id.startsWith('discovery-') && l.id !== id)?.id;
      map.addLayer(
        {
          id,
          type: 'fill',
          source: id,
          paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.7 },
        },
        before
      );
      map.addLayer(
        {
          id: `${id}-line`,
          type: 'line',
          source: id,
          paint: {
            'line-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              '#3b82f6',
              'white',
            ],
            'line-width': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              3,
              1,
            ],
          },
        },
        before
      );
    };
    draw();
    map.on('style.load', draw);
    map.on('idle', draw);
    return () => {
      map.off('style.load', draw);
      map.off('idle', draw);
      for (const layer of [`${id}-line`, id])
        if (map.getLayer(layer)) map.removeLayer(layer);
      if (map.getSource(id)) map.removeSource(id);
    };
  }, [map, data]);
  useEffect(() => {
    if (!interactive) return;
    const id = 'discovery-hexes';
    let hovered: string | null = null;
    let popup: Popup | null = null;
    const highlight = (value: string | null) => {
      if (map.getSource(id)) {
        if (hovered)
          map.setFeatureState({ source: id, id: hovered }, { hover: false });
        if (value)
          map.setFeatureState({ source: id, id: value }, { hover: true });
      }
      hovered = value;
    };
    const hex = (e: MapLayerMouseEvent): HexHoverData | null => {
      const p = e.features?.[0]?.properties;
      return p
        ? { h3: p.h3, count: Number(p.count), resolution: view.resolution }
        : null;
    };
    const enter = (e: MapLayerMouseEvent) => {
      const h = hex(e);
      highlight(h?.h3 ?? null);
      callbacks.current.onHexHover?.(h);
      map.getCanvas().style.cursor = 'pointer';
    };
    const leave = () => {
      highlight(null);
      callbacks.current.onHexHover?.(null);
      map.getCanvas().style.cursor = '';
    };
    const click = (e: MapLayerMouseEvent) => {
      if (e.originalEvent.ctrlKey || e.originalEvent.metaKey) return;
      const h = hex(e);
      if (!h) return;
      if (!enableSearchPopup) {
        if (callbacks.current.onHexClick) callbacks.current.onHexClick(h);
        else
          callbacks.current.onFeatureClick?.({
            properties: { name: `Hex ${h.h3.slice(-6)}`, hits: h.count },
          });
        return;
      }
      const content = document.createElement('div');
      const heading = document.createElement('strong');
      heading.textContent = `H3 ${h.h3}`;
      const info = document.createElement('p');
      info.textContent = `${t('map.resources')}: ${h.count.toLocaleString(locale)} · ${t('map.resolution')}: ${h.resolution} · ${t('map.area')}: ${cellArea(h.h3, UNITS.km2).toLocaleString(locale)} km²`;
      const link = document.createElement('a');
      link.textContent = t('map.searchHex');
      link.href = `${import.meta.env.BASE_URL}#${buildSearchUrl(h.h3, h.resolution, searchQuery, queryString)}`;
      content.append(heading, info, link);
      popup?.remove();
      popup = new Popup({ closeButton: true })
        .setLngLat(e.lngLat)
        .setDOMContent(content)
        .addTo(map);
    };
    map.on('mousemove', id, enter);
    map.on('mouseleave', id, leave);
    map.on('click', id, click);
    return () => {
      map.off('mousemove', id, enter);
      map.off('mouseleave', id, leave);
      map.off('click', id, click);
      popup?.remove();
    };
  }, [
    map,
    interactive,
    enableSearchPopup,
    view.resolution,
    searchQuery,
    queryString,
    t,
    locale,
  ]);
  useEffect(() => {
    if (hoveredHex && map.getSource('discovery-hexes')) {
      map.setFeatureState(
        { source: 'discovery-hexes', id: hoveredHex.h3 },
        { hover: true }
      );
      return () => {
        if (map.getSource('discovery-hexes'))
          map.setFeatureState(
            { source: 'discovery-hexes', id: hoveredHex.h3 },
            { hover: false }
          );
      };
    }
  }, [map, hoveredHex]);
  return stats.error ? (
    <p className="discovery-map-status" role="status">
      {t('map.dataError')}
    </p>
  ) : null;
}
