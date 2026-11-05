import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Marker, type Map as GLMap, type MapMouseEvent } from 'maplibre-gl';
import type { ResearchCamera, ResearchPoint } from './editionEvidence';

function cameraFor(map: GLMap): ResearchCamera {
  const { lng, lat } = map.getCenter();
  return {
    center: { lng, lat },
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  };
}
function paintPoint(marker: Marker, point: ResearchPoint | null) {
  marker.getElement().hidden = !point;
  if (point) marker.setLngLat(point);
}
export function useEditionMapLink(
  scope: string,
  initialCamera: ResearchCamera | null,
  pinned: ResearchPoint | null,
  onPin: (point: ResearchPoint) => void,
  onHover: (point: ResearchPoint | null) => void
) {
  const initial = useRef(initialCamera);
  initial.current = initialCamera;
  // A controller per sheet keeps late cleanups from an old sheet separate from
  // the registrations for its replacement.
  const controller = useMemo(
    () => ({
      scope,
      maps: new Map<
        string,
        { map: GLMap; marker: Marker; dispose: () => void }
      >(),
      camera: initial.current,
      syncing: false,
      point: null as ResearchPoint | null,
    }),
    [scope]
  );
  const callbacks = useRef({ onPin, onHover, pinned });
  callbacks.current = { onPin, onHover, pinned };
  const frame = useRef<number | null>(null);
  const paint = useCallback(
    (point: ResearchPoint | null) => {
      controller.point = point;
      for (const { marker } of controller.maps.values())
        paintPoint(marker, point);
    },
    [controller]
  );
  useEffect(() => {
    paint(pinned);
  }, [pinned, paint]);
  useEffect(() => {
    callbacks.current.onHover(null);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [controller]);
  const register = useCallback(
    (key: string, map: GLMap | null) => {
      controller.maps.get(key)?.dispose();
      controller.maps.delete(key);
      if (!map) return;
      // A DOM marker stays above both native raster layers and the COG
      // previewer's separate canvas. It does not intercept map gestures.
      const element = document.createElement('div');
      element.className = 'research-focus-marker';
      element.setAttribute('aria-hidden', 'true');
      const marker = new Marker({ element }).setLngLat([0, 0]).addTo(map);
      if (controller.camera) map.jumpTo(controller.camera);
      else controller.camera = cameraFor(map);
      const move = () => {
        if (controller.syncing) return;
        controller.syncing = true;
        try {
          controller.camera = cameraFor(map);
          for (const peer of controller.maps.values())
            if (peer.map !== map) peer.map.jumpTo(controller.camera);
        } finally {
          controller.syncing = false;
        }
      };
      const mouse = (event: MapMouseEvent) => {
        if (callbacks.current.pinned) return;
        const point: ResearchPoint = [
          ((((event.lngLat.lng + 180) % 360) + 360) % 360) - 180,
          event.lngLat.lat,
        ];
        paint(point);
        if (frame.current !== null) cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() => {
          frame.current = null;
          callbacks.current.onHover(point);
        });
      };
      const leave = () => {
        if (frame.current !== null) cancelAnimationFrame(frame.current);
        frame.current = null;
        paint(callbacks.current.pinned);
        callbacks.current.onHover(null);
      };
      const click = (event: MapMouseEvent) => {
        if (frame.current !== null) cancelAnimationFrame(frame.current);
        frame.current = null;
        const point: ResearchPoint = [
          ((((event.lngLat.lng + 180) % 360) + 360) % 360) - 180,
          event.lngLat.lat,
        ];
        paint(point);
        callbacks.current.onPin(point);
      };
      controller.maps.set(key, {
        map,
        marker,
        dispose: () => {
          map.off('move', move);
          map.off('mousemove', mouse);
          map.off('mouseout', leave);
          map.off('click', click);
          marker.remove();
        },
      });
      map.on('move', move);
      map.on('mousemove', mouse);
      map.on('mouseout', leave);
      map.on('click', click);
      paintPoint(marker, callbacks.current.pinned ?? controller.point);
    },
    [controller, paint]
  );
  const locate = useCallback(
    (point: ResearchPoint) => {
      const camera = {
        ...(controller.camera ?? { zoom: 12, bearing: 0, pitch: 0 }),
        center: { lng: point[0], lat: point[1] },
      };
      controller.camera = camera;
      controller.syncing = true;
      try {
        for (const { map } of controller.maps.values()) map.jumpTo(camera);
      } finally {
        controller.syncing = false;
      }
      paint(point);
      callbacks.current.onPin(point);
    },
    [controller, paint]
  );
  return { register, locate, camera: () => controller.camera };
}
