import { useRecord, useIndex, useResearchParams } from './hooks';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
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
import { useTheme } from '../../hooks/useTheme';
import { EditionSource } from './EditionSource';
import { ResearchFocus } from './ResearchFocus';
import { useEditionMapLink } from './useEditionMapLink';
import {
  cameraText,
  parseResearchCamera,
  parseResearchPoint,
  pointText,
  researchUrl,
  type ResearchPoint,
} from './editionEvidence';

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
function EditionCard({
  year,
  mapKey,
  feature,
  scans,
  register,
  onSelect,
}: {
  year: string;
  mapKey: string;
  feature: IndexFeature;
  scans: IndexFeature[];
  register: (year: string, map: GLMap | null) => void;
  onSelect: (id: string) => void;
}) {
  const { t } = useI18n();
  const headingId = useId();
  const onMap = useCallback(
    (map: GLMap | null) => register(mapKey, map),
    [register, mapKey]
  );
  const label = year || t('research.unknown');
  return (
    <article
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
      <EditionMap feature={feature} onMap={onMap} />
      <Assets id={feature.properties.recId} />
      <EditionSource key={feature.properties.recId} feature={feature} />
    </article>
  );
}

export function EditionsPathway({ config }: { config: ThemeResearchConfig }) {
  const { t, text } = useI18n();
  const { themeId } = useTheme();
  const [hover, setHover] = useState<ResearchPoint | null>(null);
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
  const active =
    editions.find(
      (f) =>
        f.properties.recId ===
        (params.get('active') || params.get('left') || params.get('right'))
    ) ?? selected[0];
  const comparison = editions.find(
    (f) => f.properties.recId === params.get('compare')
  );
  const activeYear = String(active?.properties.datePub || '');
  const compareYear = String(comparison?.properties.datePub || '');
  function selectPrinting(scanId: string) {
    const scan = editions.find((f) => f.properties.recId === scanId)!;
    update({
      active: scanId,
      printings: selected
        .map((f) =>
          f.properties.datePub === scan.properties.datePub
            ? scanId
            : f.properties.recId
        )
        .join(','),
      left: '',
      right: '',
    });
  }
  const pinned = useMemo(
    () => parseResearchPoint(params.get('point')),
    [params]
  );
  const linked = useEditionMapLink(
    `${id}:${group?.[0] ?? ''}:${params.get('view') ?? ''}`,
    parseResearchCamera(params.get('view')),
    pinned,
    (point) => update({ point: pointText(point) }),
    setHover
  );
  function workspaceUrl() {
    const snapshot = new URLSearchParams();
    snapshot.set('index', id);
    if (active) snapshot.set('active', active.properties.recId);
    if (comparison) snapshot.set('compare', comparison.properties.recId);
    if (group) snapshot.set('sheet', group[1][0].properties.recId);
    snapshot.set(
      'printings',
      selected.map((f) => f.properties.recId).join(',')
    );
    if (pinned) snapshot.set('point', pointText(pinned));
    const camera = linked.camera();
    if (camera) snapshot.set('view', cameraText(camera));
    return researchUrl(themeId, '/research', snapshot);
  }
  return (
    <div className="research-editions-layout">
      <section className="research-panel research-sheet-bar">
        <div>
          <div className="research-step">{t('research.sheetStep')}</div>
          <RecordSelect
            config={config}
            value={id}
            onChange={(index) =>
              update({
                index,
                sheet: '',
                left: '',
                right: '',
                printings: '',
                point: '',
                view: '',
                active: '',
                compare: '',
              })
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
                point: '',
                view: '',
                active: '',
                compare: '',
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
      <div className="research-editions-workbench">
        {error ? (
          <p role="alert">{t('research.indexError')}</p>
        ) : !features ? (
          <p role="status">{t('research.loading')}</p>
        ) : !editions.length ? (
          <p>{t('research.noSheets')}</p>
        ) : (
          <>
            <section
              className="research-timeline"
              aria-label={t('research.editionStrip')}
            >
              <div className="research-timeline-heading">
                <h2>{t('research.editionStrip')}</h2>
                <button
                  type="button"
                  aria-pressed={Boolean(comparison)}
                  disabled={editions.length < 2}
                  onClick={() =>
                    update({
                      compare: comparison
                        ? ''
                        : (
                            [...selected]
                              .reverse()
                              .find(
                                (f) =>
                                  f.properties.recId !== active.properties.recId
                              ) ?? active
                          ).properties.recId,
                    })
                  }
                >
                  {t('research.compareMaps')}
                </button>
              </div>
              <div className="research-edition-strip">
                {selected.map((feature) => {
                  const year = String(
                    feature.properties.datePub || t('research.unknown')
                  );
                  return (
                    <button
                      type="button"
                      key={year}
                      aria-pressed={
                        feature.properties.datePub === active.properties.datePub
                      }
                      aria-label={t('research.viewEdition', { year })}
                      onClick={() => selectPrinting(feature.properties.recId)}
                    >
                      <strong>{year}</strong>
                      <span>
                        {t('research.printings', {
                          count: editions.filter(
                            (f) =>
                              f.properties.datePub ===
                              feature.properties.datePub
                          ).length,
                        })}
                      </span>
                    </button>
                  );
                })}
              </div>
              {comparison && (
                <label className="research-field research-compare-picker">
                  {t('research.compareWith')}
                  <select
                    value={comparison.properties.datePub || ''}
                    onChange={(event) =>
                      update({
                        compare: selected.find(
                          (f) =>
                            String(f.properties.datePub || '') ===
                            event.target.value
                        )!.properties.recId,
                      })
                    }
                  >
                    {selected.map((f) => (
                      <option
                        key={f.properties.recId}
                        value={f.properties.datePub || ''}
                      >
                        {f.properties.datePub || t('research.unknown')}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </section>
            {editions.length > 0 && (
              <ResearchFocus
                pinned={pinned}
                hover={hover}
                onLocate={linked.locate}
                onClear={() => {
                  setHover(null);
                  update({ point: '' });
                }}
                workspaceUrl={workspaceUrl}
              />
            )}
            <div
              className={`research-map-stage${comparison ? ' is-comparing' : ''}`}
            >
              <EditionCard
                mapKey="primary"
                year={activeYear}
                feature={active}
                scans={editions.filter(
                  (f) => String(f.properties.datePub || '') === activeYear
                )}
                register={linked.register}
                onSelect={selectPrinting}
              />
              {comparison && (
                <EditionCard
                  mapKey="comparison"
                  year={compareYear}
                  feature={comparison}
                  scans={editions.filter(
                    (f) => String(f.properties.datePub || '') === compareYear
                  )}
                  register={linked.register}
                  onSelect={(compare) => update({ compare })}
                />
              )}
            </div>
            <p className="research-muted">{t('research.editionStripHelp')}</p>
            <p className="research-note">{text(config.note)}</p>
          </>
        )}
      </div>
    </div>
  );
}
