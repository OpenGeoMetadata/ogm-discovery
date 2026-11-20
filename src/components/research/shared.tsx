import { useEffect, useState, useRef, useId } from 'react';
import { Link } from 'react-router';
import type { Map as GLMap, GeoJSONSource } from 'maplibre-gl';
import type { ThemeResearchConfig } from '../../config/institution';
import { useI18n } from '../../hooks/useI18n';
import { useMap } from '../../context/MapLibreContext';
import { MapLibreMap } from '../map/MapLibreMap';

import {
  parseBbox,
  bboxFeature,
  type Bbox,
  type IndexFeature,
} from '../../services/research';
import { fetchSearchResults } from '../../services/api';
import type { GeoDocument } from '../../types/api';
import { useRecord } from './hooks';

export function RecordSelect({
  config,
  value,
  onChange,
  label,
  indexSearch = false,
}: {
  config: ThemeResearchConfig;
  value: string;
  onChange: (value: string) => void;
  label: string;
  indexSearch?: boolean;
}) {
  const { text, t } = useI18n();
  const helpId = useId();
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [results, setResults] = useState<GeoDocument[]>([]);
  const [status, setStatus] = useState('idle');
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const generation = useRef(0);
  const custom = !config.records.some((record) => record.id === value);
  const { data: selectedRecord } = useRecord(custom ? value : '');
  useEffect(
    () => () => {
      generation.current++;
    },
    []
  );
  async function search(searchQuery: string, nextPage = 1) {
    const current = ++generation.current;
    setStatus('loading');
    setSubmittedQuery(searchQuery);
    setPage(nextPage);
    try {
      const response = await fetchSearchResults(
        searchQuery,
        nextPage,
        20,
        config.search?.resource_type
          ? [
              {
                field: 'gbl_resourceType_sm',
                value: config.search.resource_type,
              },
            ]
          : []
      );
      if (current === generation.current) {
        setResults(response.data);
        setHasNext(
          Boolean(response.links?.next) ||
            nextPage < (response.meta?.totalPages ?? 1)
        );
        setStatus('ready');
      }
    } catch {
      if (current === generation.current) setStatus('error');
    }
  }
  const searchControls = (
    <>
      {indexSearch && (
        <p id={helpId} className="research-muted">
          {t('research.findIndexHelp')}
        </p>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void search(query);
        }}
      >
        <label className="research-field">
          {t(indexSearch ? 'research.findIndex' : 'research.searchCollection')}
          <input
            type="search"
            value={query}
            aria-describedby={indexSearch ? helpId : undefined}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="research-actions">
          <button type="submit">{t('research.search')}</button>
          {indexSearch && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                void search('');
              }}
            >
              {t('research.browseIndexes')}
            </button>
          )}
        </div>
      </form>
      {status === 'loading' && <p role="status">{t('research.loading')}</p>}
      {status === 'error' && <p role="alert">{t('research.searchError')}</p>}
      {status === 'ready' && (
        <>
          <p role="status" className="research-muted">
            {t(results.length ? 'research.resultsPage' : 'research.noMatches', {
              count: results.length,
              page,
            })}
          </p>
          <ul>
            {results.map((record) => (
              <li key={record.id}>
                <button
                  aria-pressed={record.id === value}
                  onClick={() => {
                    onChange(record.id);
                    if (indexSearch) setStatus('idle');
                  }}
                >
                  {record.attributes.ogm.dct_title_s}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      {(status === 'ready' || status === 'error') && (
        <div className="research-actions">
          {page > 1 && (
            <button
              type="button"
              onClick={() => void search(submittedQuery, page - 1)}
            >
              {t('research.previousResults')}
            </button>
          )}
          {status === 'ready' && hasNext && (
            <button
              type="button"
              onClick={() => void search(submittedQuery, page + 1)}
            >
              {t('research.nextResults')}
            </button>
          )}
          {status === 'error' && (
            <button
              type="button"
              onClick={() => void search(submittedQuery, page)}
            >
              {t('research.retrySearch')}
            </button>
          )}
        </div>
      )}
    </>
  );
  return (
    <div>
      {config.search && indexSearch && (
        <div className="research-record-search research-index-search">
          {searchControls}
        </div>
      )}
      <label className="research-field">
        {label}
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {config.records.map((record) => (
            <option key={record.id} value={record.id}>
              {text(record.label)}
            </option>
          ))}
          {custom && (
            <option value={value}>
              {selectedRecord?.attributes.ogm.dct_title_s ?? value}
            </option>
          )}
        </select>
      </label>
      {config.search && !indexSearch && (
        <details className="research-record-search">
          <summary>{t('research.findMore')}</summary>
          {searchControls}
        </details>
      )}
    </div>
  );
}

export function Assets({ id }: { id: string }) {
  const { data, error } = useRecord(id);
  const { t } = useI18n();
  return (
    <div className="research-assets">
      <Link to={`/resources/${id}`}>{t('research.record')}</Link>
      {error ? (
        <span role="status">{t('research.assetsError')}</span>
      ) : (
        data?.meta?.ui?.downloads?.map((asset) => (
          <a key={asset.url} href={asset.url}>
            {asset.label}
          </a>
        ))
      )}
    </div>
  );
}
export function StudyArea({
  value,
  onChange,
  map,
}: {
  value: Bbox;
  onChange: (bbox: Bbox) => void;
  map?: GLMap | null;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(value.join(','));
  const [error, setError] = useState(false);
  useEffect(() => {
    setDraft(value.join(','));
    setError(false);
  }, [value]);
  return (
    <form
      className="research-area"
      onSubmit={(e) => {
        e.preventDefault();
        const bbox = parseBbox(draft);
        setError(!bbox);
        if (bbox) onChange(bbox);
      }}
    >
      <label className="research-field">
        {t('research.extent')}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-invalid={error}
          aria-describedby="bbox-help"
        />
      </label>
      <p id="bbox-help" className="research-muted">
        {t('research.bboxHelp')}
      </p>
      {error && <p role="alert">{t('research.bboxError')}</p>}
      <div className="research-actions">
        <button type="submit">{t('research.applyArea')}</button>
        {map && (
          <button
            type="button"
            onClick={() => {
              const b = map.getBounds();
              const bbox = parseBbox(
                [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]
                  .map((n) => n.toFixed(5))
                  .join(',')
              );
              if (bbox) onChange(bbox);
              else setError(true);
            }}
          >
            {t('research.useMap')}
          </button>
        )}
      </div>
    </form>
  );
}
export function BoundsLayer({
  bbox,
  features = [],
}: {
  bbox: Bbox;
  features?: IndexFeature[];
}) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(
      [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ],
      { padding: 45, duration: 0 }
    );
  }, [map, bbox]);
  useEffect(() => {
    const draw = () => {
      if (!map.isStyleLoaded()) return;
      const layers: [string, GeoJSON.FeatureCollection, string][] = [
        [
          'discovery-research-tiles',
          { type: 'FeatureCollection', features },
          '#16745b',
        ],
        [
          'discovery-research-aoi',
          { type: 'FeatureCollection', features: [bboxFeature(bbox)] },
          '#d65328',
        ],
      ];
      layers.forEach(([id, data, color]) => {
        const source = map.getSource(id) as GeoJSONSource | undefined;
        if (source) source.setData(data);
        else {
          map.addSource(id, { type: 'geojson', data });
          map.addLayer({
            id: id + '-fill',
            type: 'fill',
            source: id,
            paint: { 'fill-color': color, 'fill-opacity': 0.12 },
          });
          map.addLayer({
            id: id + '-line',
            type: 'line',
            source: id,
            paint: { 'line-color': color, 'line-width': 2 },
          });
        }
      });
    };
    draw();
    map.on('style.load', draw);
    return () => {
      map.off('style.load', draw);
      for (const id of ['discovery-research-tiles', 'discovery-research-aoi']) {
        for (const suffix of ['-line', '-fill'])
          if (map.getLayer(id + suffix)) map.removeLayer(id + suffix);
        if (map.getSource(id)) map.removeSource(id);
      }
    };
  }, [map, bbox, features]);
  return null;
}
export function AreaMap({
  bbox,
  features,
  onMap,
}: {
  bbox: Bbox;
  features?: IndexFeature[];
  onMap?: (map: GLMap | null) => void;
}) {
  return (
    <MapLibreMap className="research-area-map" onMap={onMap}>
      <BoundsLayer bbox={bbox} features={features} />
    </MapLibreMap>
  );
}
