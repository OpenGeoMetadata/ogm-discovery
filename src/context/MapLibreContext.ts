import { createContext, useContext, useEffect, useState } from 'react';
import type { Map as GLMap, ControlPosition, IControl } from 'maplibre-gl';

export const MapLibreContext = createContext<GLMap | null>(null);
export function useMap() {
  const map = useContext(MapLibreContext);
  if (!map) throw new Error('Map component must be inside MapLibreMap');
  return map;
}

/** Native controls host React portals; MapLibre owns positioning and cleanup. */
export function useControlContainer(
  map: GLMap | null,
  position: ControlPosition = 'top-left'
) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!map) return;
    const div = document.createElement('div');
    div.className =
      'maplibregl-ctrl maplibregl-ctrl-group discovery-map-control';
    const stop = (e: Event) => e.stopPropagation();
    for (const event of ['mousedown', 'dblclick', 'touchstart', 'wheel'])
      div.addEventListener(event, stop);
    const control: IControl = {
      onAdd: () => div,
      onRemove: () => div.remove(),
    };
    map.addControl(control, position);
    setContainer(div);
    return () => {
      map.removeControl(control);
      setContainer(null);
    };
  }, [map, position]);
  return container;
}
