import { useRecord, useIndex, useResearchParams } from './hooks';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Map as GLMap } from 'maplibre-gl';
import type { ThemeResearchConfig } from '../../config/institution';
import { useI18n } from '../../hooks/useI18n';
import {
  featureBounds,
  sheetKey,
  type IndexFeature,
} from '../../services/research';
import { MapLibreMap } from '../map/MapLibreMap';
import { FeaturedItemPreviewLayer } from '../home/FeaturedItemPreviewLayer';
import { Assets, RecordSelect } from './shared';

function EditionMap({
  feature,
  onMap,
}: {
  feature: IndexFeature;
  onMap: (map: GLMap | null) => void;
}) {
  const { data, error } = useRecord(feature.properties.recId);
  const { t } = useI18n();
  const [map, setMap] = useState<GLMap | null>(null);
  const details = useMemo(() => (data ? [data] : []), [data]);
  const boundsKey = featureBounds(feature).join(',');
  const bounds = useMemo(() => boundsKey.split(',').map(Number), [boundsKey]);
  useEffect(() => {
    if (!map) return;
    map.fitBounds(
      [
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]],
      ],
      { padding: 18, duration: 0 }
    );
    onMap(map);
    return () => onMap(null);
  }, [map, bounds, onMap]);
  return (
    <>
      <MapLibreMap className="research-edition-map" onMap={setMap}>
        {data && (
          <FeaturedItemPreviewLayer
            activeIndex={0}
            featuredDetails={details}
            featuredInitiated
            opacity={1}
            errorMessage={t('research.previewError')}
          />
        )}
      </MapLibreMap>
      {error && <p role="alert">{t('research.assetsError')}</p>}
      {!data && !error && <p role="status">{t('research.loading')}</p>}
    </>
  );
}
type MapCamera = {
  center: { lng: number; lat: number };
  zoom: number;
  bearing: number;
  pitch: number;
};
function cameraFor(map: GLMap): MapCamera {
  const { lng, lat } = map.getCenter();
  return {
    center: { lng, lat },
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  };
}

// The grid is keyed by sheet, so its camera and registrations reset together.
function EditionGrid({
  editions,
  preferredIds,
  onSelect,
}: {
  editions: IndexFeature[];
  preferredIds: string[];
  onSelect: (ids: string[]) => void;
}) {
  const { t } = useI18n();
  const maps = useRef(new Map<string, { map: GLMap; move: () => void }>());
  const camera = useRef<MapCamera | null>(null);
  const syncing = useRef(false);
  const register = useCallback((year: string, map: GLMap | null) => {
    const previous = maps.current.get(year);
    if (previous) previous.map.off('move', previous.move);
    maps.current.delete(year);
    if (!map) return;
    if (camera.current) map.jumpTo(camera.current);
    else camera.current = cameraFor(map);
    const move = () => {
      if (syncing.current) return;
      syncing.current = true;
      try {
        camera.current = cameraFor(map);
        for (const peer of maps.current.values()) {
          if (peer.map !== map) peer.map.jumpTo(camera.current);
        }
      } finally {
        syncing.current = false;
      }
    };
    maps.current.set(year, { map, move });
    map.on('move', move);
  }, []);
  const years = [
    ...new Set(editions.map((f) => String(f.properties.datePub || ''))),
  ];
  const selected = years.map((year) => {
    const scans = editions.filter(
      (f) => String(f.properties.datePub || '') === year
    );
    return (
      preferredIds
        .map((id) => scans.find((f) => f.properties.recId === id))
        .find(Boolean) ?? scans[0]
    );
  });
  return (
    <section aria-label={t('research.allEditions')}>
      <div className="research-grid-intro">
        <h2>{t('research.allEditions')}</h2>
        <p>{t('research.allEditionsHelp')}</p>
      </div>
      <div className="research-edition-grid">
        {selected.map((feature, i) => (
          <EditionCard
            key={years[i]}
            year={years[i]}
            feature={feature}
            scans={editions.filter(
              (f) => String(f.properties.datePub || '') === years[i]
            )}
            register={register}
            onSelect={(id) =>
              onSelect(
                selected.map((f, index) =>
                  index === i ? id : f.properties.recId
                )
              )
            }
          />
        ))}
      </div>
    </section>
  );
}

function EditionCard({
  year,
  feature,
  scans,
  register,
  onSelect,
}: {
  year: string;
  feature: IndexFeature;
  scans: IndexFeature[];
  register: (year: string, map: GLMap | null) => void;
  onSelect: (id: string) => void;
}) {
  const { t } = useI18n();
  const headingId = useId();
  const host = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(
    () => typeof IntersectionObserver === 'undefined'
  );
  const onMap = useCallback(
    (map: GLMap | null) => register(year, map),
    [register, year]
  );
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !host.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: '160px' }
    );
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  const label = year || t('research.unknown');
  return (
    <article
      ref={host}
      className="research-panel research-edition-card"
      aria-labelledby={headingId}
    >
      <div className="research-edition-heading">
        <div className="research-edition-year">
          <h3 id={headingId}>{label}</h3>
          <span>{t('research.printings', { count: scans.length })}</span>
        </div>
        <label className="research-field">
          {t('research.printingForYear', { year: label })}
          <select
            value={feature.properties.recId}
            onChange={(e) => onSelect(e.target.value)}
          >
            {scans.map((f) => (
              <option key={f.properties.recId} value={f.properties.recId}>
                {f.properties.dateReprnt
                  ? t('research.printed', { year: f.properties.dateReprnt })
                  : t('research.printUnknown')}{' '}
                · {f.properties.recId}
              </option>
            ))}
          </select>
        </label>
        <span>
          {t('research.survey')}:{' '}
          {feature.properties.dateSurvey || t('research.unknown')}
        </span>
      </div>
      {visible ? (
        <EditionMap feature={feature} onMap={onMap} />
      ) : (
        <div className="research-edition-map research-map-placeholder">
          <p>{t('research.mapLoadsOnScroll')}</p>
        </div>
      )}
      <Assets id={feature.properties.recId} />
    </article>
  );
}

export function EditionsPathway({ config }: { config: ThemeResearchConfig }) {
  const { t, text } = useI18n();
  const { params, update } = useResearchParams();
  const id = params.get('index') || config.records[0].id;
  const { features, error } = useIndex(id);
  const groups = useMemo(() => {
    const groups = new Map<string, IndexFeature[]>();
    features?.forEach((f) => {
      const key = sheetKey(f);
      groups.set(key, [...(groups.get(key) ?? []), f]);
    });
    return [...groups.entries()].sort((a, b) =>
      a[1][0].properties.title.localeCompare(b[1][0].properties.title)
    );
  }, [features]);
  const group =
    groups.find(([, fs]) =>
      fs.some((f) => f.properties.recId === params.get('sheet'))
    ) ??
    groups.find(([, fs]) => fs[0].properties.title === config.sheet) ??
    groups[0];
  const editions = useMemo(
    () =>
      group
        ? [...group[1]].sort(
            (a, b) =>
              String(a.properties.datePub).localeCompare(
                String(b.properties.datePub)
              ) ||
              String(a.properties.dateReprnt ?? '').localeCompare(
                String(b.properties.dateReprnt ?? '')
              )
          )
        : [],
    [group]
  );
  const preferredIds = [
    ...(params.get('printings')?.split(',') ?? []),
    params.get('left'),
    params.get('right'),
    ...(config.editions ?? []),
  ].filter((id): id is string => Boolean(id));
  return (
    <div className="research-editions-layout">
      <section className="research-panel research-sheet-bar">
        <div>
          <div className="research-step">{t('research.sheetStep')}</div>
          <RecordSelect
            config={config}
            value={id}
            onChange={(index) =>
              update({ index, sheet: '', left: '', right: '', printings: '' })
            }
            label={t('research.selectedIndex')}
            indexSearch
          />
        </div>
        <label className="research-field">
          {t('research.sheet')}
          <select
            value={group?.[1][0].properties.recId ?? ''}
            onChange={(e) =>
              update({
                sheet: e.target.value,
                left: '',
                right: '',
                printings: '',
              })
            }
          >
            {groups.map(([key, fs]) => (
              <option key={key} value={fs[0].properties.recId}>
                {fs[0].properties.title} · {fs[0].properties.scale}
              </option>
            ))}
          </select>
        </label>
        <div className="research-edition-count">
          <strong>
            {new Set(editions.map((f) => f.properties.datePub)).size}
          </strong>
          <span>{t('research.editionsCount', { count: editions.length })}</span>
        </div>
        <p className="research-muted">{t('research.linkedMaps')}</p>
      </section>
      {error ? (
        <p role="alert">{t('research.indexError')}</p>
      ) : !features ? (
        <p role="status">{t('research.loading')}</p>
      ) : !editions.length ? (
        <p>{t('research.noSheets')}</p>
      ) : (
        <>
          <EditionGrid
            key={`${id}:${group?.[0]}`}
            editions={editions}
            preferredIds={preferredIds}
            onSelect={(ids) =>
              update({ printings: ids.join(','), left: '', right: '' })
            }
          />
          <p className="research-note">{text(config.note)}</p>
        </>
      )}
    </div>
  );
}
