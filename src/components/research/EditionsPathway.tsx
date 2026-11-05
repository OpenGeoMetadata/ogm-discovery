import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Map as GLMap } from 'maplibre-gl';
import type { ThemeResearchConfig } from '../../config/institution';
import type { GazetteerPlace, GeoDocument } from '../../types/api';
import { fetchNominatimSearch, fetchSearchResults } from '../../services/api';
import { parseBbox, type Bbox } from '../../services/research';
import { normalizeBboxSearchEnvelope } from '../../utils/bbox';
import { useI18n } from '../../hooks/useI18n';
import { useTheme } from '../../hooks/useTheme';
import { MapLibreMap } from '../map/MapLibreMap';
import { FeaturedItemPreviewLayer } from '../home/FeaturedItemPreviewLayer';
import { Assets } from './shared';
import { EditionSource } from './EditionSource';
import { ResearchFocus } from './ResearchFocus';
import { useRecord, useResearchParams } from './hooks';
import { useEditionMapLink } from './useEditionMapLink';
import {
  cameraText,
  parseResearchCamera,
  parseResearchPoint,
  pointText,
  researchUrl,
  type ResearchPoint,
} from './editionEvidence';
import {
  discoveryFilters,
  nearPoint,
  placeBounds,
  recordBounds,
  recordFeature,
  relatedKey,
} from './topoDiscovery';
import { DiscoveryFootprints } from './DiscoveryFootprints';

function Preview({
  record,
  opacity,
}: {
  record?: GeoDocument;
  opacity: number;
}) {
  const { t } = useI18n();
  const details = useMemo(() => (record ? [record] : []), [record]);
  return record && opacity > 0 ? (
    <FeaturedItemPreviewLayer
      activeIndex={0}
      featuredDetails={details}
      featuredInitiated
      opacity={opacity}
      errorMessage={t('research.previewError')}
    />
  ) : null;
}
function fit(map: GLMap | null, bounds: Bbox) {
  map?.fitBounds(
    [
      [bounds[0], bounds[1]],
      [bounds[2], bounds[3]],
    ],
    { padding: 35, maxZoom: 13, duration: 0 }
  );
}

export function EditionsPathway({ config }: { config: ThemeResearchConfig }) {
  const { t, text } = useI18n();
  const { themeId } = useTheme();
  const { params, update } = useResearchParams();
  const areaText = params.get('area') || '';
  const area = useMemo(() => parseBbox(areaText), [areaText]);
  const query = params.get('q') || '';
  const start = params.get('start') || '';
  const end = params.get('end') || '';
  const selectedId =
    params.get('active') ||
    params.get('left') ||
    params.get('right') ||
    params.get('sheet') ||
    params.get('printings')?.split(',')[0] ||
    '';
  const compareId = params.get('compare') || '';
  const selected = useRecord(selectedId);
  const comparison = useRecord(compareId);
  const [mode, setMode] = useState<'place' | 'name'>(query ? 'name' : 'place');
  const [input, setInput] = useState(query || params.get('place') || '');
  const [places, setPlaces] = useState<GazetteerPlace[] | null>(null);
  const [placeState, setPlaceState] = useState<'idle' | 'loading' | 'error'>(
    'idle'
  );
  const placeRequest = useRef(0);
  useEffect(
    () => () => {
      placeRequest.current++;
    },
    []
  );
  const [from, setFrom] = useState(start);
  const [to, setTo] = useState(end);
  const [yearError, setYearError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<{
    key: string;
    records: GeoDocument[];
    total: number;
    pages: number;
    status: 'loading' | 'ready' | 'error';
  }>({ key: '', records: [], total: 0, pages: 0, status: 'ready' });
  const searchKey = JSON.stringify([
    areaText,
    query,
    start,
    end,
    config.search?.map_resource_type,
  ]);
  const requested = Boolean(area || query);
  useEffect(() => {
    setPage(1);
  }, [searchKey]);
  const lastKey = useRef(searchKey);
  useEffect(() => {
    if (!requested) return;
    // A changed search always starts at page one, even before the reset renders.
    if (lastKey.current !== searchKey && page !== 1) return;
    lastKey.current = searchKey;
    let current = true;
    setResults((previous) => ({
      ...(previous.key === searchKey
        ? previous
        : { key: searchKey, records: [], total: 0, pages: 0 }),
      status: 'loading',
    }));
    fetchSearchResults(
      query,
      page,
      20,
      [],
      undefined,
      'year_asc',
      [],
      [],
      undefined,
      discoveryFilters(area, config.search?.map_resource_type, start, end)
    )
      .then((response) => {
        if (!current) return;
        setResults((previous) => ({
          key: searchKey,
          records: [
            ...new Map(
              [
                ...(page > 1 && previous.key === searchKey
                  ? previous.records
                  : []),
                ...response.data,
              ].map((record) => [record.id, record])
            ).values(),
          ],
          total: response.meta?.totalCount ?? response.data.length,
          pages: response.meta?.totalPages ?? 1,
          status: 'ready',
        }));
      })
      .catch(() => {
        if (current)
          setResults((previous) => ({ ...previous, status: 'error' }));
      });
    return () => {
      current = false;
    };
  }, [
    searchKey,
    requested,
    area,
    query,
    start,
    end,
    config.search?.map_resource_type,
    page,
    retry,
  ]);
  const records = useMemo(
    () => (requested && results.key === searchKey ? results.records : []),
    [requested, results, searchKey]
  );
  const [map, setMap] = useState<GLMap | null>(null);
  const [peer, setPeer] = useState<GLMap | null>(null);
  const [hover, setHover] = useState<ResearchPoint | null>(null);
  const pointValue = params.get('point');
  const pinned = useMemo(() => parseResearchPoint(pointValue), [pointValue]);
  const [overlay, setOverlay] = useState(true);
  const opacityValue = Number(params.get('opacity') ?? '.85');
  const opacity = Number.isFinite(opacityValue)
    ? Math.max(0, Math.min(1, opacityValue))
    : 0.85;
  const [opacityDraft, setOpacityDraft] = useState(opacity);
  useEffect(() => setOpacityDraft(opacity), [opacity]);
  const [coverage, setCoverage] = useState(true);
  const footprints = useMemo(
    () => (coverage ? records : []),
    [coverage, records]
  );
  const resetSelection = {
    active: '',
    compare: '',
    left: '',
    right: '',
    sheet: '',
    index: '',
    printings: '',
    view: '',
  };
  function searchArea(
    bounds: Bbox,
    label = '',
    point: ResearchPoint | null = null
  ) {
    update({
      ...resetSelection,
      area: bounds.join(','),
      q: '',
      place: label,
      point: point ? pointText(point) : '',
    });
    setPlaces(null);
    setOverlay(true);
  }
  const linked = useEditionMapLink(
    themeId,
    parseResearchCamera(params.get('view')),
    pinned,
    (point) => searchArea(nearPoint(point), '', point),
    setHover
  );
  const { register } = linked;
  const initialBounds = useRef(area || config.bbox);
  const initialView = useRef(parseResearchCamera(params.get('view')));
  useEffect(() => {
    if (!map) return;
    if (!initialView.current) fit(map, initialBounds.current);
    register('primary', map);
    return () => register('primary', null);
  }, [map, register]);
  useEffect(() => {
    if (!peer) return;
    register('comparison', peer);
    return () => register('comparison', null);
  }, [peer, register]);
  // Resolve older record links by their own footprint, never a default state.
  const legacyBounds = selected.data && recordBounds(selected.data);
  const legacyText = legacyBounds?.join(',') || '';
  useEffect(() => {
    if (!areaText && !query && legacyText) {
      update({ area: legacyText });
      if (!params.get('view'))
        fit(map, legacyText.split(',').map(Number) as Bbox);
    }
    // URL changes are deliberately limited to resolving a legacy record once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaText, query, legacyText, map]);
  useEffect(() => {
    setFrom(start);
    setTo(end);
  }, [start, end]);
  const related = useMemo(() => {
    if (!selected.data) return [];
    const key = relatedKey(selected.data);
    return [
      ...new Map(
        [
          selected.data,
          ...records.filter((r) => key && relatedKey(r) === key),
        ].map((r) => [r.id, r])
      ).values(),
    ].sort((a, b) =>
      String(a.attributes.ogm.dct_issued_s || '').localeCompare(
        String(b.attributes.ogm.dct_issued_s || '')
      )
    );
  }, [selected.data, records]);
  const feature = selected.data && recordFeature(selected.data);
  const comparisonFeature = comparison.data && recordFeature(comparison.data);
  const onSelect = useCallback(
    (id: string) => {
      update({
        active: id,
        left: '',
        right: '',
        sheet: '',
        ...(id === compareId ? { compare: '' } : {}),
      });
      setOverlay(true);
    },
    [update, compareId]
  );
  async function findPlace() {
    const request = ++placeRequest.current;
    setPlaceState('loading');
    setPlaces(null);
    try {
      const response = await fetchNominatimSearch(input, 5);
      if (request === placeRequest.current) {
        setPlaces(response.data);
        setPlaceState('idle');
      }
    } catch {
      if (request === placeRequest.current) setPlaceState('error');
    }
  }
  function searchViewport() {
    if (!map) return;
    const b = map.getBounds();
    const bounds = normalizeBboxSearchEnvelope(
      b.getWest(),
      b.getSouth(),
      b.getEast(),
      b.getNorth()
    );
    if (!bounds) return;
    // The backend box contract cannot cross the antimeridian. Use the full
    // longitude range for a wrapped viewport, with its latitude range intact.
    const w = bounds.topLeft.lon,
      e = bounds.bottomRight.lon;
    searchArea([
      w > e ? -180 : w,
      bounds.bottomRight.lat,
      w > e ? 180 : e,
      bounds.topLeft.lat,
    ]);
  }
  const busy =
    requested && (results.key !== searchKey || results.status === 'loading');
  return (
    <div className="topo-explorer">
      <form
        className="topo-search research-panel"
        onSubmit={(event) => {
          event.preventDefault();
          if (mode === 'place') void findPlace();
          else {
            placeRequest.current++;
            setPlaceState('idle');
            setPlaces(null);
            update({
              ...resetSelection,
              q: input.trim(),
              area: '',
              place: '',
              point: '',
            });
          }
        }}
      >
        <div
          className="topo-search-mode"
          role="group"
          aria-label={t('research.findBy')}
        >
          {(['place', 'name'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => {
                placeRequest.current++;
                setPlaceState('idle');
                setPlaces(null);
                setMode(value);
                setInput('');
              }}
            >
              {t(value === 'place' ? 'research.location' : 'research.mapName')}
            </button>
          ))}
        </div>
        <label className="research-field topo-query">
          {t(
            mode === 'place' ? 'research.findLocation' : 'research.findMapName'
          )}
          <input
            value={input}
            onChange={(event) => {
              placeRequest.current++;
              setPlaceState('idle');
              setPlaces(null);
              setInput(event.target.value);
            }}
            required
          />
        </label>
        <button
          className="research-primary"
          type="submit"
          disabled={placeState === 'loading'}
        >
          {t('research.search')}
        </button>
        <p className="research-muted topo-search-help">
          {t(
            mode === 'place' ? 'research.locationHelp' : 'research.mapNameHelp'
          )}
        </p>
        {placeState === 'loading' && (
          <p role="status">{t('research.findingPlaces')}</p>
        )}
        {placeState === 'error' && (
          <p role="alert">{t('research.placeError')}</p>
        )}
        {places && (
          <ul className="topo-places">
            {places.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  disabled={!placeBounds(place)}
                  onClick={() => {
                    const bounds = placeBounds(place);
                    if (!bounds) return;
                    const label =
                      place.attributes.display_name || place.attributes.name;
                    setInput(place.attributes.name);
                    searchArea(bounds, label);
                    fit(map, bounds);
                  }}
                >
                  {place.attributes.display_name || place.attributes.name}
                </button>
              </li>
            ))}
            {!places.length && <li role="status">{t('research.noPlaces')}</li>}
          </ul>
        )}
      </form>
      <div className="topo-layout">
        <section
          className="topo-stage research-panel"
          aria-label={t('research.mapExplorer')}
        >
          <div className="topo-map-toolbar research-actions">
            <button type="button" onClick={searchViewport}>
              {t('research.searchArea')}
            </button>
            <span>{t('research.clickToSearch')}</span>
            <label>
              <input
                type="checkbox"
                checked={coverage}
                onChange={(e) => setCoverage(e.target.checked)}
              />{' '}
              {t('research.footprints')}
            </label>
          </div>
          <div className={`topo-maps ${compareId ? 'topo-comparing' : ''}`}>
            <div className="topo-map-pane">
              <MapLibreMap className="topo-map" onMap={setMap}>
                <Preview
                  record={selected.data}
                  opacity={overlay ? opacity : 0}
                />
              </MapLibreMap>
              <DiscoveryFootprints map={map} records={footprints} />
            </div>
            {compareId && (
              <div className="topo-map-pane">
                <MapLibreMap className="topo-map" onMap={setPeer}>
                  <Preview
                    record={comparison.data}
                    opacity={overlay ? opacity : 0}
                  />
                </MapLibreMap>
                <p className="topo-map-caption">
                  {comparison.data?.attributes.ogm.dct_title_s ||
                    t('research.loading')}
                </p>
              </div>
            )}
          </div>
          {selectedId && (
            <div className="topo-selected">
              <div className="topo-selected-heading">
                <h2>
                  {selected.data?.attributes.ogm.dct_title_s ||
                    t('research.loading')}
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    update({
                      active: '',
                      compare: '',
                      left: '',
                      right: '',
                      sheet: '',
                      printings: '',
                    })
                  }
                >
                  {t('research.closeMap')}
                </button>
              </div>
              {(selected.error || comparison.error) && (
                <p role="alert">{t('research.assetsError')}</p>
              )}
              <div className="research-actions">
                <button
                  type="button"
                  onClick={() => {
                    const bounds = selected.data && recordBounds(selected.data);
                    if (bounds) fit(map, bounds);
                  }}
                  disabled={!feature}
                >
                  {t('research.fitMap')}
                </button>
                <button
                  type="button"
                  aria-pressed={overlay}
                  onClick={() => setOverlay(!overlay)}
                >
                  {t('research.showScan')}
                </button>
                <label className="topo-opacity">
                  {t('research.opacity')}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step=".05"
                    value={opacityDraft}
                    onChange={(e) => setOpacityDraft(Number(e.target.value))}
                    onPointerUp={() =>
                      update({ opacity: String(opacityDraft) })
                    }
                    onKeyUp={() => update({ opacity: String(opacityDraft) })}
                    onBlur={() => update({ opacity: String(opacityDraft) })}
                  />
                </label>
              </div>
              <div
                className="topo-strip"
                role="group"
                aria-label={t('research.relatedScans')}
              >
                {related.map((record) => (
                  <button
                    key={record.id}
                    type="button"
                    aria-pressed={record.id === selectedId}
                    title={record.attributes.ogm.dct_title_s}
                    onClick={() => onSelect(record.id)}
                  >
                    <strong>
                      {record.attributes.ogm.dct_issued_s ||
                        t('research.unknown')}
                    </strong>
                    <span>{record.attributes.ogm.dct_title_s}</span>
                  </button>
                ))}
              </div>
              <p className="research-muted">{t('research.relatedHelp')}</p>
              <label className="research-field">
                {t('research.compareWith')}
                <select
                  value={compareId}
                  onChange={(e) => update({ compare: e.target.value })}
                >
                  <option value="">{t('research.singleMap')}</option>
                  {[
                    ...new Map(
                      [
                        ...records,
                        ...(comparison.data ? [comparison.data] : []),
                      ].map((r) => [r.id, r])
                    ).values(),
                  ]
                    .filter((r) => r.id !== selectedId)
                    .map((record) => (
                      <option key={record.id} value={record.id}>
                        {record.attributes.ogm.dct_title_s}
                      </option>
                    ))}
                </select>
              </label>
              <Assets id={selectedId} />
              {feature && <EditionSource key={selectedId} feature={feature} />}
              {comparisonFeature && (
                <div className="topo-compare-source">
                  <h3>{comparison.data?.attributes.ogm.dct_title_s}</h3>
                  <Assets id={compareId} />
                  <EditionSource key={compareId} feature={comparisonFeature} />
                </div>
              )}
            </div>
          )}
          <ResearchFocus
            pinned={pinned}
            hover={hover}
            onLocate={linked.locate}
            onClear={() => update({ point: '' })}
            workspaceUrl={() => {
              const snapshot = new URLSearchParams(params);
              const camera = linked.camera();
              if (camera) snapshot.set('view', cameraText(camera));
              return researchUrl(themeId, '/research', snapshot);
            }}
          />
        </section>
        <aside
          className="topo-results research-panel"
          aria-label={t('research.matchingMaps')}
        >
          <div className="topo-results-head">
            <h2>{t('research.matchingMaps')}</h2>
            <p>
              {params.get('place') ||
                (pinned
                  ? t('research.nearPoint', { point: pointText(pinned) })
                  : area
                    ? t('research.selectedArea')
                    : query
                      ? t('research.namedMaps', { query })
                      : t('research.startLocation'))}
            </p>
          </div>
          <form
            className="topo-years"
            onSubmit={(event) => {
              event.preventDefault();
              const valid =
                (!from || /^\d{4}$/.test(from)) &&
                (!to || /^\d{4}$/.test(to)) &&
                (!from || !to || Number(from) <= Number(to));
              setYearError(!valid);
              if (valid) update({ start: from, end: to });
            }}
          >
            <label className="research-field">
              {t('research.yearFrom')}
              <input
                inputMode="numeric"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="research-field">
              {t('research.yearTo')}
              <input
                inputMode="numeric"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
            <button type="submit">{t('research.applyYears')}</button>
            <button
              type="button"
              onClick={() => {
                setYearError(false);
                update({ start: '', end: '' });
                setFrom('');
                setTo('');
              }}
            >
              {t('research.allYears')}
            </button>
            {yearError && <p role="alert">{t('research.yearError')}</p>}
          </form>
          {!requested && (
            <p className="topo-intro">{t('research.discoveryStart')}</p>
          )}
          {requested && (
            <>
              <p className="topo-result-count" role="status">
                {t('research.loadedMaps', {
                  count: records.length,
                  total: results.key === searchKey ? results.total : 0,
                })}
              </p>
              {busy && <p role="status">{t('research.loading')}</p>}
              {results.key === searchKey && results.status === 'error' && (
                <div role="alert">
                  <p>{t('research.mapSearchError')}</p>
                  <button
                    type="button"
                    onClick={() => setRetry((value) => value + 1)}
                  >
                    {t('research.retrySearch')}
                  </button>
                </div>
              )}
              {!busy && results.status === 'ready' && !records.length && (
                <p>{t('research.noMaps')}</p>
              )}
              {results.status === 'ready' && page < results.pages && (
                <button
                  className="research-primary topo-more"
                  type="button"
                  onClick={() => setPage((value) => value + 1)}
                >
                  {t('research.loadMoreMaps')}
                </button>
              )}
              <ol className="topo-record-list">
                {records.map((record) => (
                  <li key={record.id}>
                    <button
                      type="button"
                      aria-pressed={record.id === selectedId}
                      onClick={() => {
                        onSelect(record.id);
                        if (!area) {
                          const bounds = recordBounds(record);
                          if (bounds) fit(map, bounds);
                        }
                      }}
                    >
                      <span className="topo-record-year">
                        {record.attributes.ogm.dct_issued_s ||
                          t('research.unknown')}
                      </span>
                      <span>{record.attributes.ogm.dct_title_s}</span>
                    </button>
                  </li>
                ))}
              </ol>
              <p className="research-muted">{t('research.coverageHelp')}</p>
            </>
          )}
        </aside>
      </div>
      <p className="research-note">{text(config.note)}</p>
    </div>
  );
}
