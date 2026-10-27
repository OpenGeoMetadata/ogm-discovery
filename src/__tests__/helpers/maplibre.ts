/* eslint-disable @typescript-eslint/no-explicit-any -- Small structural test double for overloaded MapLibre APIs. */
import { vi } from 'vitest';
export const instances: Map[] = [];
export class Map {
  host: HTMLElement;
  listeners = new globalThis.Map<string, Set<(...args: any[]) => void>>();
  sources: Record<string, any> = {};
  layers: Record<string, any> = {};
  loaded = true;
  center = { lng: -98, lat: 39 };
  zoom = 2;
  constructor(options: any) {
    this.host = options.container;
    instances.push(this);
  }
  on = vi.fn((event: string, layerOrHandler: any, handler?: any) => {
    const fn = handler ?? layerOrHandler;
    const key = handler ? `${event}:${layerOrHandler}` : event;
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(fn);
    return this;
  });
  off = vi.fn((event: string, layerOrHandler: any, handler?: any) => {
    this.listeners
      .get(handler ? `${event}:${layerOrHandler}` : event)
      ?.delete(handler ?? layerOrHandler);
    return this;
  });
  once = vi.fn((event: string, fn: any) => this.on(event, fn));
  fire(event: string, payload: any = {}) {
    for (const fn of this.listeners.get(event) ?? []) fn(payload);
  }
  setStyle = vi.fn(() => {
    this.sources = {};
    this.layers = {};
    this.loaded = false;
    return this;
  });
  styleLoaded() {
    this.loaded = true;
    this.fire('style.load');
  }
  isStyleLoaded = () => this.loaded;
  getStyle = () => ({
    sources: this.sources,
    layers: Object.values(this.layers),
  });
  getContainer = () => this.host;
  getCanvas = () => this.host;
  getCenter = () => this.center;
  getZoom = () => this.zoom;
  getBounds = () => ({
    getWest: () => -110,
    getSouth: () => 30,
    getEast: () => -80,
    getNorth: () => 50,
    getNorthEast: () => ({ lng: -80, lat: 50 }),
    getSouthWest: () => ({ lng: -110, lat: 30 }),
  });
  fitBounds = vi.fn();
  flyTo = vi.fn();
  jumpTo = vi.fn();
  panBy = vi.fn();
  resize = vi.fn();
  remove = vi.fn();
  cameraForBounds = vi.fn(() => ({ center: [0, 40], zoom: 4 }));
  project = ([x, y]: number[]) => ({ x, y });
  unproject = ([lng, lat]: number[]) => ({ lng, lat });
  addSource = vi.fn((id: string, data: any) => {
    this.sources[id] = {
      ...data,
      setData: vi.fn((next: any) => {
        this.sources[id].data = next;
      }),
    };
  });
  getSource = (id: string) => this.sources[id];
  removeSource = vi.fn((id: string) => {
    delete this.sources[id];
  });
  addLayer = vi.fn((layer: any) => {
    this.layers[layer.id] = layer;
  });
  getLayer = (id: string) => this.layers[id];
  removeLayer = vi.fn((id: string) => {
    delete this.layers[id];
  });
  moveLayer = vi.fn();
  setFeatureState = vi.fn();
  addControl = vi.fn((control: any) => {
    this.host.appendChild(control.onAdd(this));
  });
  removeControl = vi.fn((control: any) => control.onRemove(this));
  touchZoomRotate = { disableRotation: vi.fn() };
  dragPan = { enable: vi.fn(), disable: vi.fn() };
}
export class NavigationControl {
  onAdd() {
    return document.createElement('div');
  }
  onRemove() {}
}
export class AttributionControl extends NavigationControl {}
export class Marker {
  element: HTMLElement;
  position: any;
  constructor(options: any) {
    this.element = options.element;
  }
  setLngLat(position: any) {
    this.position = position;
    return this;
  }
  getLngLat() {
    return this.position;
  }
  addTo(map: Map) {
    map.host.appendChild(this.element);
    return this;
  }
  remove() {
    this.element.remove();
  }
  getElement() {
    return this.element;
  }
}
export class Popup {
  element = document.createElement('div');
  setLngLat() {
    return this;
  }
  setDOMContent(content: HTMLElement) {
    this.element.appendChild(content);
    return this;
  }
  addTo(map: Map) {
    map.host.appendChild(this.element);
    return this;
  }
  remove() {
    this.element.remove();
  }
}
