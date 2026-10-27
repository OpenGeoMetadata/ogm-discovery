import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import type { GeoJSONSource } from 'maplibre-gl';
import { useMap } from '../../context/MapLibreContext';
import {
  boundsPolygon,
  writeSearchBounds,
  type MapBounds,
} from '../../utils/mapGeometry';

export function BboxRectangleSelector() {
  const map = useMap();
  const navigate = useNavigate();
  useEffect(() => {
    let start: [number, number] | null = null;
    let bounds: MapBounds | null = null;
    let suppress = false;
    const id = 'discovery-drawing';
    const remove = () => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    };
    const point = (e: MouseEvent): [number, number] => {
      const rect = map.getContainer().getBoundingClientRect();
      const p = map.unproject([e.clientX - rect.left, e.clientY - rect.top]);
      return [p.lng, p.lat];
    };
    const cancel = () => {
      start = null;
      bounds = null;
      map.dragPan.enable();
      remove();
    };
    const down = (e: MouseEvent) => {
      if (e.button || !(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      e.stopPropagation();
      start = point(e);
      map.dragPan.disable();
    };
    const move = (e: MouseEvent) => {
      if (!start || !map.isStyleLoaded()) return;
      const end = point(e);
      bounds = [
        [Math.min(start[0], end[0]), Math.min(start[1], end[1])],
        [Math.max(start[0], end[0]), Math.max(start[1], end[1])],
      ];
      const data = boundsPolygon(bounds);
      if (map.getSource(id)) (map.getSource(id) as GeoJSONSource).setData(data);
      else {
        map.addSource(id, { type: 'geojson', data });
        map.addLayer({
          id,
          type: 'line',
          source: id,
          paint: { 'line-color': '#2563eb', 'line-width': 2 },
        });
      }
    };
    const up = (e: MouseEvent) => {
      if (!start) return;
      e.preventDefault();
      const result = bounds;
      suppress = !!bounds;
      cancel();
      if (result) {
        const params = writeSearchBounds(new URLSearchParams(), result);
        if (params) navigate(`/search?${params}`);
      }
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancel();
    };
    const click = (e: MouseEvent) => {
      if (suppress) {
        e.stopPropagation();
        e.preventDefault();
        suppress = false;
      }
    };
    const host = map.getContainer();
    host.addEventListener('mousedown', down, true);
    host.addEventListener('click', click, true);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    document.addEventListener('keydown', key);
    window.addEventListener('blur', cancel);
    return () => {
      host.removeEventListener('mousedown', down, true);
      host.removeEventListener('click', click, true);
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      document.removeEventListener('keydown', key);
      window.removeEventListener('blur', cancel);
      cancel();
    };
  }, [map, navigate]);
  return null;
}
