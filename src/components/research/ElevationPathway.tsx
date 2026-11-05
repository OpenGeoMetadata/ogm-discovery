import { useIndex, useResearchParams } from './hooks';
import { useEffect, useMemo, useState } from 'react';
import type { Map as GLMap } from 'maplibre-gl';
import type { ThemeResearchConfig } from '../../config/institution';
import { useI18n } from '../../hooks/useI18n';
import { featureBounds, intersects, parseBbox } from '../../services/research';
import { AreaMap, Assets, RecordSelect, StudyArea } from './shared';

export function ElevationPathway({ config }: { config: ThemeResearchConfig }) {
  const { t, text } = useI18n();
  const { params, update } = useResearchParams();
  const id = params.get('index') || config.records[0].id;
  const { features, error } = useIndex(id);
  const [visibleCount, setVisibleCount] = useState(20);
  const [map, setMap] = useState<GLMap | null>(null);
  const bbox = useMemo(
    () => parseBbox(params.get('bbox') ?? '') ?? config.bbox,
    [params, config.bbox]
  );
  useEffect(() => setVisibleCount(20), [id, bbox]);
  const candidates = useMemo(
    () =>
      features?.filter(
        (feature) =>
          feature.properties.available !== false &&
          typeof feature.properties.download === 'string' &&
          /^https?:\/\//.test(feature.properties.download) &&
          intersects(featureBounds(feature), bbox)
      ) ?? [],
    [features, bbox]
  );
  const selectedIds = (params.get('tiles') ?? '').split(',');
  const selected = candidates.filter((f) =>
    selectedIds.includes(f.properties.recId)
  );
  const [manifest, setManifest] = useState('');
  useEffect(() => {
    const rows = candidates.filter((f) =>
      (params.get('tiles') ?? '').split(',').includes(f.properties.recId)
    );
    const blob = new Blob(
      [
        JSON.stringify(
          {
            schema: 'ogm-discovery-tile-manifest-v1',
            indexRecord: id,
            studyArea: bbox,
            selectionMethod:
              'positive-area bounding-box overlap with nominal index footprints',
            created: new Date().toISOString(),
            notice:
              'Original tiles; not clipped or mosaicked. Current asset URLs may change. Check source metadata for CRS, vertical datum, units and nodata.',
            tiles: rows.map((f) => ({
              recordId: f.properties.recId,
              title: f.properties.title,
              nominalBounds: featureBounds(f),
              published: f.properties.datePub,
              download: f.properties.download,
              source: f.properties.websiteUrl,
            })),
          },
          null,
          2
        ),
      ],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    setManifest(url);
    return () => URL.revokeObjectURL(url);
  }, [candidates, params, id, bbox]);
  return (
    <div className="research-elevation-layout">
      <section className="research-panel research-elevation-map">
        <div className="research-step">{t('research.areaStep')}</div>
        <div className="research-area-toolbar">
          <RecordSelect
            config={config}
            value={id}
            onChange={(index) => update({ index, tiles: '' })}
            label={t('research.product')}
          />
          <StudyArea
            value={bbox}
            map={map}
            onChange={(b) => update({ bbox: b.join(','), tiles: '' })}
          />
        </div>
        <AreaMap bbox={bbox} features={features} onMap={setMap} />
        <div className="research-map-key">
          <span className="research-key-aoi">{t('research.studyArea')}</span>
          <span className="research-key-tiles">
            {t('research.tileFootprints')}
          </span>
        </div>
        <p className="research-note">{text(config.note)}</p>
      </section>
      <section className="research-panel research-downloads">
        <div className="research-step">{t('research.downloadStep')}</div>
        <h2>{t('research.overlapping', { count: candidates.length })}</h2>
        {error ? (
          <p role="alert">{t('research.indexError')}</p>
        ) : !features ? (
          <p role="status">{t('research.loading')}</p>
        ) : !candidates.length ? (
          <p>{t('research.noTiles')}</p>
        ) : (
          <>
            <div className="research-actions">
              <button
                onClick={() =>
                  update({
                    tiles: candidates.map((f) => f.properties.recId).join(','),
                  })
                }
              >
                {t('research.selectAll')}
              </button>
              <button onClick={() => update({ tiles: '' })}>
                {t('research.clear')}
              </button>
            </div>
            <div className="research-tile-list">
              {candidates.slice(0, visibleCount).map((feature) => {
                const p = feature.properties;
                const checked = selectedIds.includes(p.recId);
                return (
                  <article
                    key={p.recId}
                    className={
                      checked ? 'research-tile selected' : 'research-tile'
                    }
                  >
                    <label>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          update({
                            tiles: (checked
                              ? selectedIds.filter((v) => v !== p.recId)
                              : [...selectedIds.filter(Boolean), p.recId]
                            ).join(','),
                          })
                        }
                      />
                      <span>
                        <strong>{p.label || p.title}</strong>
                        <small>
                          {t('research.published')}:{' '}
                          {p.datePub || t('research.unknown')}
                        </small>
                      </span>
                    </label>
                    {checked && <Assets id={p.recId} />}
                  </article>
                );
              })}
            </div>
            {candidates.length > visibleCount && (
              <div className="research-actions">
                <button onClick={() => setVisibleCount((count) => count + 20)}>
                  {t('research.moreTiles', {
                    count: candidates.length - visibleCount,
                  })}
                </button>
              </div>
            )}
            <div className="research-export">
              <strong>
                {t('research.selected', { count: selected.length })}
              </strong>
              {selected.length > 0 && (
                <a
                  className="research-primary"
                  href={manifest}
                  download="elevation-tile-manifest.json"
                >
                  {t('research.export')}
                </a>
              )}
              <p>{t('research.manifestHelp')}</p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
