import type { Event, Evented, Map, MapEventType } from 'maplibre-gl';

type DiscoveryMapEvents = MapEventType & {
  'discovery:stylechanging': Event;
};

/** MapLibre's event emitter also carries our overlay lifecycle event. */
export function mapLifecycleEvents(map: Map) {
  return map as Evented<DiscoveryMapEvents>;
}
