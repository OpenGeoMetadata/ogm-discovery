import type { Map as GLMap } from 'maplibre-gl';
/** An async protocol adapter must not mutate a newer style/record after disposal. */
export function previewMapLease(map: GLMap) {
  let live = true;
  const sources = new Set<string>();
  const layers = new Set<string>();
  const listeners: unknown[][] = [];
  const proxy = new Proxy(map, {
    get(target, property) {
      if (property === 'addSource')
        return (id: string, ...args: unknown[]) => {
          if (!live) return proxy;
          sources.add(id);
          return Reflect.apply(target.addSource, target, [id, ...args]);
        };
      if (property === 'addLayer')
        return (layer: { id: string }, ...args: unknown[]) => {
          if (!live) return proxy;
          layers.add(layer.id);
          return Reflect.apply(target.addLayer, target, [layer, ...args]);
        };
      if (!live && (property === 'getSource' || property === 'getLayer'))
        return () => undefined;
      const value = Reflect.get(target, property, target);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) => {
        if (
          !live &&
          /^(add|remove|set|move|on|once|fire)/.test(String(property))
        )
          return proxy;
        if (property === 'on' || property === 'once') listeners.push(args);
        return Reflect.apply(value, target, args);
      };
    },
  });
  return {
    map: proxy,
    dispose() {
      if (!live) return;
      live = false;
      for (const args of listeners) Reflect.apply(map.off, map, args);
      for (const id of layers) if (map.getLayer(id)) map.removeLayer(id);
      for (const id of sources) if (map.getSource(id)) map.removeSource(id);
    },
  };
}
