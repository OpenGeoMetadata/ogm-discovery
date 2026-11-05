import { useRecord, useIndex, useResearchParams } from './hooks';
import { useEffect, useMemo, useState } from 'react';
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
  useEffect(() => {
    onMap(map);
    return () => onMap(null);
  }, [map, onMap]);
  const boundsKey = featureBounds(feature).join(',');
  const bounds = useMemo(() => boundsKey.split(',').map(Number), [boundsKey]);
  useEffect(() => {
    if (map)
      map.fitBounds(
        [
          [bounds[0], bounds[1]],
          [bounds[2], bounds[3]],
        ],
        { padding: 18, duration: 0 }
      );
  }, [map, bounds]);
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
export function EditionsPathway({ config }: { config: ThemeResearchConfig }) {
  const { t, text } = useI18n();
  const { params, update } = useResearchParams();
  const id = params.get('index') || config.records[0].id;
  const { features, error } = useIndex(id);
  const [leftMap, setLeftMap] = useState<GLMap | null>(null);
  const [rightMap, setRightMap] = useState<GLMap | null>(null);
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
  const left =
    editions.find(
      (f) => f.properties.recId === (params.get('left') || config.editions?.[0])
    ) ?? editions[0];
  const right =
    editions.find(
      (f) =>
        f.properties.recId === (params.get('right') || config.editions?.[1])
    ) ?? editions[editions.length - 1];
  useEffect(() => {
    if (!leftMap || !rightMap) return;
    let syncing = false;
    const sync = (from: GLMap, to: GLMap) => {
      if (syncing) return;
      syncing = true;
      to.jumpTo({
        center: from.getCenter(),
        zoom: from.getZoom(),
        bearing: from.getBearing(),
        pitch: from.getPitch(),
      });
      syncing = false;
    };
    const fromLeft = () => sync(leftMap, rightMap);
    const fromRight = () => sync(rightMap, leftMap);
    fromLeft();
    leftMap.on('move', fromLeft);
    rightMap.on('move', fromRight);
    return () => {
      leftMap.off('move', fromLeft);
      rightMap.off('move', fromRight);
    };
  }, [leftMap, rightMap]);
  function editionLabel(f: IndexFeature) {
    return `${f.properties.datePub || t('research.unknown')} · ${f.properties.dateReprnt ? t('research.printed', { year: f.properties.dateReprnt }) : t('research.printUnknown')} · ${f.properties.recId}`;
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
              update({ index, sheet: '', left: '', right: '' })
            }
            label={t('research.index')}
          />
        </div>
        <label className="research-field">
          {t('research.sheet')}
          <select
            value={group?.[1][0].properties.recId ?? ''}
            onChange={(e) =>
              update({ sheet: e.target.value, left: '', right: '' })
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
      ) : !left || !right ? (
        <p>{t('research.noSheets')}</p>
      ) : (
        <>
          <div className="research-edition-pair">
            {[left, right].map((feature, i) => (
              <section className="research-panel" key={i}>
                <div className="research-edition-heading">
                  <label className="research-field">
                    {t(i ? 'research.editionB' : 'research.editionA')}
                    <select
                      value={feature.properties.recId}
                      onChange={(e) =>
                        update({ [i ? 'right' : 'left']: e.target.value })
                      }
                    >
                      {editions.map((f) => (
                        <option
                          key={f.properties.recId}
                          value={f.properties.recId}
                        >
                          {editionLabel(f)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <span>
                    {t('research.survey')}:{' '}
                    {feature.properties.dateSurvey || t('research.unknown')}
                  </span>
                </div>
                <EditionMap
                  feature={feature}
                  onMap={i ? setRightMap : setLeftMap}
                />
                <Assets id={feature.properties.recId} />
              </section>
            ))}
          </div>
          <div
            className="research-chronology"
            aria-label={t('research.chronology')}
          >
            {[...new Set(editions.map((f) => f.properties.datePub))].map(
              (year) => (
                <button
                  key={year}
                  onClick={() =>
                    update({
                      right: editions.find(
                        (f) => f.properties.datePub === year
                      )!.properties.recId,
                    })
                  }
                  aria-pressed={right.properties.datePub === year}
                >
                  <strong>{year}</strong>
                  <span>
                    {t('research.printings', {
                      count: editions.filter(
                        (f) => f.properties.datePub === year
                      ).length,
                    })}
                  </span>
                </button>
              )
            )}
          </div>
          <p className="research-note">{text(config.note)}</p>
        </>
      )}
    </div>
  );
}
