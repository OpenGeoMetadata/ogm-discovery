import { useRecord, useResearchParams } from './hooks';
import { useEffect, useMemo, useState } from 'react';
import type { Map as GLMap } from 'maplibre-gl';
import { Link } from 'react-router';
import type { ThemeResearchConfig } from '../../config/institution';
import { useI18n } from '../../hooks/useI18n';
import {
  imageryUrl,
  parseBbox,
  parseDailyPeriods,
  reference,
  validDay,
  type DailyPeriod,
} from '../../services/research';
import { AreaMap, RecordSelect, StudyArea } from './shared';

function ImageryFrame({ url, day }: { url: string; day: string }) {
  const { t } = useI18n();
  const [status, setStatus] = useState('loading');
  return (
    <figure className="research-imagery-frame">
      <figcaption>
        <span>{t('research.observation')}</span>
        <strong>{day}</strong>
      </figcaption>
      {status !== 'ready' && (
        <p role="status">
          {t(status === 'error' ? 'research.imageError' : 'research.loading')}
        </p>
      )}
      <img
        src={url}
        alt={t('research.imageryAlt', { date: day })}
        onLoad={() => setStatus('ready')}
        onError={() => setStatus('error')}
        style={{ display: status === 'error' ? 'none' : undefined }}
      />
      <a href={url} target="_blank" rel="noreferrer">
        {t('research.openImage')}
      </a>
    </figure>
  );
}
export function ImageryPathway({ config }: { config: ThemeResearchConfig }) {
  const { t, text } = useI18n();
  const { params, update } = useResearchParams();
  const id = params.get('layer') || config.records[0].id;
  const bbox = useMemo(
    () => parseBbox(params.get('bbox') ?? '') ?? config.bbox,
    [params, config.bbox]
  );
  const dates = [
    params.get('before') || config.dates?.[0] || '',
    params.get('after') || config.dates?.[1] || '',
  ];
  const { data, error } = useRecord(id);
  const [map, setMap] = useState<GLMap | null>(null);
  const [domain, setDomain] = useState<{
    id: string;
    periods?: DailyPeriod[];
    error?: boolean;
  }>({ id });
  const layer = data?.attributes.ogm.gbl_wxsIdentifier_s;
  useEffect(() => {
    const controller = new AbortController();
    setDomain({ id });
    if (!data || !config.imagery) return () => controller.abort();
    if (
      !layer ||
      !reference(data, 'http://www.opengis.net/def/serviceType/ogc/wms')
    ) {
      setDomain({ id, error: true });
      return () => controller.abort();
    }
    const url = new URL(config.imagery.domain_endpoint);
    Object.entries({
      SERVICE: 'WMTS',
      REQUEST: 'DescribeDomains',
      VERSION: '1.0.0',
      LAYER: layer,
      TILEMATRIXSET: config.imagery.tile_matrix_set,
    }).forEach(([k, v]) => url.searchParams.set(k, v));
    fetch(url, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error('domain');
        return r.text();
      })
      .then((xml) => {
        if (!controller.signal.aborted)
          setDomain({ id, periods: parseDailyPeriods(xml) });
      })
      .catch(() => {
        if (!controller.signal.aborted) setDomain({ id, error: true });
      });
    return () => controller.abort();
  }, [id, data, layer, config.imagery]);
  const periods = domain.id === id ? domain.periods : undefined;
  const valid = periods && dates.every((day) => validDay(day, periods));
  const source = data && reference(data, 'http://schema.org/url');
  return (
    <div className="research-imagery-layout">
      <aside className="research-panel">
        <div className="research-step">{t('research.imageryStep')}</div>
        <RecordSelect
          config={config}
          value={id}
          onChange={(layer) => update({ layer })}
          label={t('research.layer')}
        />
        <div className="research-date-pair">
          {dates.map((day, i) => (
            <label key={i} className="research-field">
              {t(i ? 'research.after' : 'research.before')}
              <input
                type="date"
                value={day}
                onChange={(e) =>
                  update({ [i ? 'after' : 'before']: e.target.value })
                }
                aria-invalid={!!periods && !validDay(day, periods)}
              />
            </label>
          ))}
        </div>
        {periods && (
          <p className="research-muted">
            {t('research.dateRange', {
              start: periods[0].start,
              end: periods[periods.length - 1].end,
              count: periods.length,
            })}
          </p>
        )}
        {periods && !valid && <p role="alert">{t('research.invalidDates')}</p>}
        <AreaMap bbox={bbox} onMap={setMap} />
        <StudyArea
          value={bbox}
          map={map}
          onChange={(b) => update({ bbox: b.join(',') })}
        />
        <div className="research-assets">
          <Link to={`/resources/${id}`}>{t('research.record')}</Link>
          {source && <a href={source}>{t('research.source')}</a>}
        </div>
      </aside>
      <section
        className="research-imagery-stage"
        aria-label={t('research.comparison')}
      >
        <div className="research-stage-heading">
          <strong>{t('research.sameExtent')}</strong>
          <span>{bbox.join(' / ')} · EPSG:4326</span>
        </div>
        {error || domain.error ? (
          <p role="alert" className="research-empty">
            {t('research.domainError')}
          </p>
        ) : !periods ? (
          <p role="status" className="research-empty">
            {t('research.loading')}
          </p>
        ) : valid && layer && config.imagery ? (
          <div className="research-image-pair">
            {dates.map((day, i) => {
              const url = imageryUrl(
                config.imagery!.map_endpoint,
                layer,
                day,
                bbox
              );
              return <ImageryFrame key={i + url} url={url} day={day} />;
            })}
          </div>
        ) : (
          <p className="research-empty">{t('research.chooseDates')}</p>
        )}
        <p className="research-note">{text(config.note)}</p>
      </section>
    </div>
  );
}
