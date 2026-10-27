import { Layers } from 'lucide-react';
import {
  createContext,
  useContext,
  useId,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Map as GLMap,
  NavigationControl,
  AttributionControl,
  type MapOptions,
  type ControlPosition,
  type IControl,
  type ErrorEvent,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../../styles/maplibre.css';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../hooks/useI18n';
import { resolveLocalizedText } from '../../i18n/messages';
import {
  basemapStyle,
  EMPTY_STYLE,
  getSavedBasemapKey,
  resolveBasemaps,
  saveBasemapKey,
} from '../../config/basemaps';
import type { BasemapConfig } from '../../config/institution';

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

export function MapLibreMap({
  children,
  center = [-98.5795, 39.8283],
  zoom = 2,
  className = '',
  onMap,
}: {
  children?: ReactNode;
  center?: [number, number];
  zoom?: number;
  className?: string;
  onMap?: (map: GLMap | null) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<GLMap | null>(null);
  const [failed, setFailed] = useState(false);
  const { theme } = useTheme();
  const { t, locale } = useI18n();
  const [selected, setSelected] = useState(() => getSavedBasemapKey(theme.map));
  const [active, setActive] = useState<BasemapConfig | null>(null);
  const [status, setStatus] = useState<'ready' | 'fallback' | 'empty'>('ready');
  const [retry, setRetry] = useState(0);
  const initial = useRef({ center, zoom });
  const onMapRef = useRef(onMap);
  onMapRef.current = onMap;
  useEffect(() => {
    if (!host.current) return;
    let instance: GLMap;
    try {
      const options: MapOptions = {
        container: host.current,
        style: EMPTY_STYLE,
        center: initial.current.center,
        zoom: initial.current.zoom,
        attributionControl: false,
        cooperativeGestures: true,
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        maxPitch: 0,
        renderWorldCopies: true,
      };
      instance = new GLMap(options);
      instance.touchZoomRotate.disableRotation();
      instance.addControl(
        new NavigationControl({ showCompass: false }),
        'top-left'
      );
      instance.addControl(
        new AttributionControl({ compact: false }),
        'bottom-right'
      );
      setMap(instance);
      onMapRef.current?.(instance);
    } catch {
      setFailed(true);
      return;
    }
    const resize = new ResizeObserver(() => instance.resize());
    resize.observe(host.current);
    return () => {
      resize.disconnect();
      onMapRef.current?.(null);
      instance.remove();
      setMap(null);
    };
  }, []);
  useEffect(() => {
    setSelected(getSavedBasemapKey(theme.map));
  }, [theme.map]);
  useEffect(() => {
    if (!map) return;
    const config = resolveBasemaps(theme.map);
    const requested =
      config.basemaps.find((b) => b.id === selected) ?? config.basemaps[0];
    const attempted = new Set<string>();
    let current: BasemapConfig | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let baseSources = new Set<string>();
    let tileFailures = new Map<string, number>();
    let baseAssets: string[] = [];
    let pending = false;
    let disposed = false;
    const switchTo = (basemap: BasemapConfig | null) => {
      if (disposed) return;
      clearTimeout(timer);
      tileFailures = new Map();
      baseSources = new Set();
      baseAssets = [];
      current = basemap;
      pending = true;
      if (basemap) attempted.add(basemap.id);
      setActive(basemap);
      setStatus(
        !basemap ? 'empty' : basemap.id === requested.id ? 'ready' : 'fallback'
      );
      // Revoke async overlay adapters before a new style can receive their work.
      map.fire('discovery:stylechanging');
      // Full replacement reliably removes provider-specific sources and glyphs.
      map.setStyle(basemap ? basemapStyle(basemap) : EMPTY_STYLE, {
        diff: false,
      });
      if (basemap) timer = setTimeout(fail, 15000);
    };
    const fail = () => {
      if (!current || disposed) return;
      switchTo(attempted.has(config.fallback.id) ? null : config.fallback);
    };
    const loaded = () => {
      pending = false;
      clearTimeout(timer);
      const style = map.getStyle();
      const sprites =
        typeof style.sprite === 'string'
          ? [style.sprite]
          : (style.sprite ?? []).map((sprite) => sprite.url);
      baseAssets = [
        ...sprites,
        ...(style.glyphs ? [style.glyphs.split('{')[0]] : []),
      ];
      // Sources created by Discovery always use the discovery- prefix. Preview adapters
      // attach only after style.load; capture the basemap sources before they run.
      baseSources = new Set(
        Object.keys(map.getStyle()?.sources ?? {}).filter(
          (id) => !id.startsWith('discovery-')
        )
      );
    };
    const error = (rawEvent: ErrorEvent) => {
      const event = rawEvent as ErrorEvent & {
        sourceId?: string;
        tile?: { tileID?: { key?: string | number } };
        error: Error & { url?: string };
      };
      if (!current) return;
      if (event.sourceId && !baseSources.has(event.sourceId)) return;
      if (pending && !event.sourceId) {
        fail();
        return;
      }
      if (
        !event.sourceId &&
        event.error?.url &&
        baseAssets.some((url) => event.error.url!.startsWith(url))
      ) {
        fail();
        return;
      }
      if (!event.sourceId || !event.tile) return;
      const key = String(event.tile.tileID?.key ?? event.error?.url ?? '');
      if (!key) return;
      const now = Date.now();
      tileFailures.set(`${event.sourceId}:${key}`, now);
      for (const [id, at] of tileFailures)
        if (now - at > 10000) tileFailures.delete(id);
      if (tileFailures.size >= 3) fail();
    };
    map.on('style.load', loaded);
    map.on('error', error);
    switchTo(requested);
    return () => {
      disposed = true;
      clearTimeout(timer);
      map.off('style.load', loaded);
      map.off('error', error);
    };
  }, [map, selected, retry, theme.map]);
  const config = resolveBasemaps(theme.map);
  return (
    <div
      ref={wrapper}
      className={`discovery-map relative ${className}`}
      role="region"
      aria-label={t('map.label')}
    >
      <div ref={host} className="absolute inset-0" />
      {failed && (
        <p role="status" className="relative bg-white p-4">
          {t('map.webgl')}
        </p>
      )}
      {map && (
        <MapLibreContext.Provider value={map}>
          {children}
          <BasemapSwitcher
            value={selected}
            options={config.basemaps}
            onChange={(id) => {
              saveBasemapKey(id);
              setSelected(id);
              setRetry((n) => n + 1);
            }}
          />
        </MapLibreContext.Provider>
      )}
      {active?.logo && (
        <a
          className="discovery-map-logo"
          href={active.logo.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src={active.logo.src}
            alt={resolveLocalizedText(active.logo.alt, locale, 'en')}
          />
        </a>
      )}
      {status !== 'ready' && (
        <div role="status" className="discovery-map-status">
          <span>
            {t(status === 'fallback' ? 'map.fallback' : 'map.unavailable')}
          </span>{' '}
          <button type="button" onClick={() => setRetry((n) => n + 1)}>
            {t('map.retry')}
          </button>
        </div>
      )}
    </div>
  );
}
import { createPortal } from 'react-dom';
function BasemapSwitcher({
  value,
  options,
  onChange,
}: {
  value: string;
  options: BasemapConfig[];
  onChange: (id: string) => void;
}) {
  const map = useMap();
  const container = useControlContainer(map);
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);
  return container
    ? createPortal(
        <div
          ref={root}
          className="discovery-basemap-switcher"
          onPointerEnter={(event) => {
            if (event.pointerType === 'mouse') setOpen(true);
          }}
          onPointerLeave={() => {
            if (!root.current?.contains(document.activeElement)) setOpen(false);
          }}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget))
              setOpen(false);
          }}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === 'Escape') {
              event.preventDefault();
              setOpen(false);
              trigger.current?.focus();
            }
          }}
        >
          <button
            ref={trigger}
            type="button"
            className="discovery-control-button"
            aria-label={t('map.basemap')}
            title={t('map.basemap')}
            aria-expanded={open}
            aria-controls={id}
            onClick={() => setOpen(true)}
          >
            <Layers size={18} strokeWidth={1.85} aria-hidden="true" />
          </button>
          {open && (
            <div
              id={id}
              role="radiogroup"
              aria-label={t('map.basemap')}
              className="discovery-basemap-options"
            >
              {options.map((basemap) => (
                <label key={basemap.id}>
                  <input
                    type="radio"
                    name={id}
                    value={basemap.id}
                    checked={value === basemap.id}
                    onChange={() => onChange(basemap.id)}
                  />
                  <span>
                    {resolveLocalizedText(basemap.label, locale, 'en')}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>,
        container
      )
    : null;
}
