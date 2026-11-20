// @vitest-environment jsdom
import { useEffect, useState, type ReactNode } from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { HelmetProvider } from 'react-helmet-async';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Map as GLMap } from 'maplibre-gl';
import { ThemeProvider } from '../../../context/ThemeContext';
import { I18nProvider } from '../../../context/I18nContext';
import { MapLibreContext } from '../../../context/MapLibreContext';
import { THEME_STORAGE_KEY } from '../../../config/institution';
import {
  fetchNominatimSearch,
  fetchResourceDetails,
  fetchSearchResults,
} from '../../../services/api';
import { bboxFeature, type IndexFeature } from '../../../services/research';
import type {
  GeoDocument,
  JsonApiResponse,
  GazetteerResponse,
} from '../../../types/api';
import { Map as MockMap, instances, markers } from '../../helpers/maplibre';
import ResearchPage from '../../../pages/ResearchPage';
vi.mock('maplibre-gl', () => import('../../helpers/maplibre'));

// Replace only the browser renderer and external viewer; use real workflow,
// metadata/index parsing, URL state, i18n, asset links and controls.
vi.mock('../../../components/map/MapLibreMap', () => ({
  MapLibreMap: ({
    children,
    onMap,
  }: {
    children?: ReactNode;
    onMap?: (map: GLMap | null) => void;
  }) => {
    const [map] = useState(() => {
      const map = new MockMap({ container: document.createElement('div') });
      return Object.assign(map, { getBearing: () => 0, getPitch: () => 0 });
    });
    useEffect(() => {
      onMap?.(map as unknown as GLMap);
      return () => onMap?.(null);
    }, [map, onMap]);
    return (
      <MapLibreContext.Provider value={map as unknown as GLMap}>
        {children}
      </MapLibreContext.Provider>
    );
  },
}));
vi.mock('../../../components/home/FeaturedItemPreviewLayer', () => ({
  FeaturedItemPreviewLayer: ({
    featuredDetails,
  }: {
    featuredDetails: GeoDocument[];
  }) => <output data-testid="scan-preview">{featuredDetails[0].id}</output>,
}));
vi.mock('../../../components/layout/Footer', () => ({
  Footer: () => <footer id="footer" />,
}));

const wms = 'http://www.opengis.net/def/serviceType/ogc/wms';
const periods = `<Domains xmlns:ows="http://www.opengis.net/ows/1.1"><DimensionDomain><ows:Identifier>time</ows:Identifier><Domain>2024-01-01/2025-08-08/P1D,2025-08-10/2025-12-31/P1D</Domain></DimensionDomain></Domains>`;
function record(id: string): GeoDocument {
  return {
    id,
    type: 'resource',
    attributes: {
      ogm: {
        id,
        dct_title_s: `Record ${id}`,
        gbl_wxsIdentifier_s: id,
        dct_references_s: JSON.stringify({
          [wms]: 'https://assets.example/wms',
          'http://schema.org/url': `https://source.example/${id}`,
          'https://openindexmaps.org': `https://assets.example/${id}.geojson`,
        }),
      },
    },
    meta: {
      ui: {
        citation: `Citation for ${id}`,
        downloads: [
          {
            url: `https://assets.example/${id}.tif`,
            label: 'Original GeoTIFF',
            type: 'tiff',
          },
        ],
      },
    },
  };
}
function tile(
  id: string,
  bbox: [number, number, number, number] = [-92, 41, -91, 42]
): IndexFeature {
  return {
    ...bboxFeature(bbox),
    properties: {
      recId: id,
      title: id,
      label: id,
      datePub: '2024',
      available: true,
      download: `https://assets.example/${id}.tif`,
      websiteUrl: `https://source.example/${id}`,
    },
  };
}
let features: IndexFeature[];
let blobs: Map<string, Blob>;
let fetchMock: ReturnType<typeof vi.fn>;
function RouteState() {
  return (
    <output data-testid="route">
      {useLocation().pathname}
      {useLocation().search}
    </output>
  );
}
function setup(theme = 'nasa-gibs', query = '') {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  return render(
    <MemoryRouter initialEntries={['/research' + query]}>
      <ThemeProvider initialThemeId={theme}>
        <I18nProvider>
          <HelmetProvider>
            <ResearchPage />
            <RouteState />
          </HelmetProvider>
        </I18nProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}
function route() {
  return new URLSearchParams(
    screen.getByTestId('route').textContent!.split('?')[1]
  );
}
function editBounds(value: string) {
  fireEvent.change(screen.getByLabelText('Study area bounds'), {
    target: { value },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Apply extent' }));
}
async function readManifest() {
  const url = screen
    .getByRole('link', { name: 'Export tile manifest ↓' })
    .getAttribute('href')!;
  const blob = blobs.get(url)!;
  const text = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsText(blob);
  });
  return JSON.parse(text);
}
beforeEach(() => {
  localStorage.clear();
  instances.length = 0;
  markers.length = 0;
  blobs = new Map();
  features = [tile('east'), tile('west', [-93, 41, -92, 42])];
  vi.mocked(fetchResourceDetails)
    .mockReset()
    .mockImplementation(async (id) => record(id));
  vi.mocked(fetchSearchResults)
    .mockReset()
    .mockResolvedValue({ data: [] } as unknown as JsonApiResponse);
  fetchMock = vi.fn(async (url: URL | string) =>
    String(url).endsWith('.geojson')
      ? {
          ok: true,
          json: async () => ({ type: 'FeatureCollection', features }),
        }
      : { ok: true, text: async () => periods }
  );
  vi.stubGlobal('fetch', fetchMock);
  const BaseURL = URL;
  vi.stubGlobal(
    'URL',
    class extends BaseURL {
      static createObjectURL(blob: Blob) {
        const url = `blob:test-${blobs.size}`;
        blobs.set(url, blob);
        return url;
      }
      static revokeObjectURL = vi.fn();
    }
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('imagery research', () => {
  it('requests matching extents with explicit dates, rejects missing days, and exposes image failures', async () => {
    setup();
    const images = await screen.findAllByAltText(/Satellite imagery for/);
    const urls = images.map((img) => new URL(img.getAttribute('src')!));
    expect(urls.map((url) => url.searchParams.get('TIME'))).toEqual([
      '2024-06-01',
      '2024-12-01',
    ]);
    expect(urls[0].searchParams.get('BBOX')).toBe(
      urls[1].searchParams.get('BBOX')
    );
    fireEvent.load(images[0]);
    fireEvent.error(images[1]);
    expect(screen.getByText(/Imagery could not be loaded/)).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Open source viewer ↗' })
    ).toHaveAttribute('href', expect.stringContaining('source.example'));
    fireEvent.change(screen.getByLabelText('First date'), {
      target: { value: '2025-08-09' },
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'outside the available daily intervals'
    );
    expect(screen.queryAllByAltText(/Satellite imagery for/)).toHaveLength(0);
    fireEvent.change(screen.getByLabelText('First date'), {
      target: { value: '2025-08-10' },
    });
    fireEvent.change(screen.getByLabelText('Second date'), {
      target: { value: '2025-08-11' },
    });
    editBounds('-100,30,-80,45');
    expect(route().get('before')).toBe('2025-08-10');
    expect(
      screen
        .getAllByAltText(/Satellite imagery for/)
        .every(
          (img) =>
            new URL(img.getAttribute('src')!).searchParams.get('BBOX') ===
            '-100,30,-80,45'
        )
    ).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Use map view' }));
    expect(route().get('bbox')).toBe('-110,30,-80,50');
  });
  it.each(['service', 'metadata', 'unsupported'])(
    'keeps metadata access when %s is unavailable',
    async (failure) => {
      if (failure === 'service') fetchMock.mockResolvedValue({ ok: false });
      if (failure === 'metadata')
        vi.mocked(fetchResourceDetails).mockRejectedValue(new Error('offline'));
      if (failure === 'unsupported')
        vi.mocked(fetchResourceDetails).mockImplementation(async (id) => ({
          ...record(id),
          attributes: { ogm: { id, dct_title_s: 'Static layer' } },
        }));
      setup();
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Daily availability could not be verified'
      );
      expect(screen.queryAllByAltText(/Satellite imagery for/)).toHaveLength(0);
      expect(
        screen.getByRole('link', { name: 'Metadata & citation' })
      ).toHaveAttribute('href', expect.stringContaining('/resources/'));
    }
  );
  it('discovers another layer through metadata search and reports search failures', async () => {
    vi.mocked(fetchSearchResults)
      .mockResolvedValueOnce({
        data: [record('custom-layer')],
      } as unknown as JsonApiResponse)
      .mockRejectedValueOnce(new Error('offline'));
    setup();
    await screen.findAllByAltText(/Satellite imagery for/);
    fireEvent.click(screen.getByText('Find more in this collection'));
    fireEvent.change(screen.getByLabelText('Search collection metadata'), {
      target: { value: 'aerosol' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Record custom-layer' })
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Imagery layer')).toHaveValue('custom-layer')
    );
    expect(route().get('layer')).toBe('custom-layer');
    await waitFor(() =>
      expect(
        screen.getAllByAltText(/Satellite imagery for/)[0]
      ).toHaveAttribute('src', expect.stringContaining('LAYERS=custom-layer'))
    );
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Search could not be completed'
    );
  });
});

describe('elevation research', () => {
  it('exports only selected overlapping original tiles, and clears selection for a new area', async () => {
    features.push(
      {
        ...tile('unavailable'),
        properties: { ...tile('unavailable').properties, available: false },
      },
      tile('distant', [10, 10, 11, 11])
    );
    setup('usgs-tnm');
    await screen.findByRole('heading', { name: '2 overlapping tiles' });
    fireEvent.click(screen.getByRole('button', { name: 'Select all' }));
    await screen.findAllByRole('link', { name: 'Original GeoTIFF' });
    const manifest = await readManifest();
    expect(manifest.studyArea).toEqual([-92.2, 41.2, -91.6, 41.8]);
    expect(manifest.tiles.map((t: { recordId: string }) => t.recordId)).toEqual(
      ['east', 'west']
    );
    expect(manifest.tiles[0].download).toBe('https://assets.example/east.tif');
    fireEvent.click(screen.getByRole('checkbox', { name: /west/ }));
    expect((await readManifest()).tiles).toHaveLength(1);
    editBounds('invalid');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Enter four valid coordinates'
    );
    expect(route().get('tiles')).toBe('east');
    editBounds('-92,41,-91,42');
    expect(
      screen.getByRole('heading', { name: '1 overlapping tiles' })
    ).toBeVisible();
    expect(
      screen.queryByRole('link', { name: 'Export tile manifest ↓' })
    ).not.toBeInTheDocument();
    expect(route().has('tiles')).toBe(false);
    fireEvent.click(screen.getByRole('checkbox', { name: /east/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(screen.getByRole('checkbox', { name: /east/ })).not.toBeChecked();
  });
  it('does not imply coverage outside the index', async () => {
    setup('usgs-tnm', '?bbox=0,0,1,1');
    expect(await screen.findByText(/No indexed tiles overlap/)).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Select all' })
    ).not.toBeInTheDocument();
  });
  it('shows index and per-asset failures without offering a fabricated download', async () => {
    vi.mocked(fetchResourceDetails).mockImplementation(async (id) => {
      if (id === 'east') throw new Error('offline');
      return record(id);
    });
    setup('usgs-tnm');
    fireEvent.click(await screen.findByRole('button', { name: 'Select all' }));
    expect(
      await screen.findByText(/Asset metadata could not be loaded/)
    ).toBeVisible();
    expect(
      screen.getAllByRole('link', { name: 'Metadata & citation' })
    ).toHaveLength(2);
    expect(
      screen.getAllByRole('link', { name: 'Original GeoTIFF' })
    ).toHaveLength(1);
  });
  it('bounds the initial tile list while the manifest can include the entire selection', async () => {
    features = Array.from({ length: 21 }, (_, i) => tile(`tile-${i}`));
    setup('usgs-tnm');
    await screen.findByRole('heading', { name: '21 overlapping tiles' });
    expect(screen.getAllByRole('checkbox')).toHaveLength(20);
    fireEvent.click(screen.getByRole('button', { name: 'Select all' }));
    await waitFor(() =>
      expect(
        screen.getAllByRole('link', { name: 'Original GeoTIFF' })
      ).toHaveLength(20)
    );
    expect((await readManifest()).tiles).toHaveLength(21);
    fireEvent.click(
      screen.getByRole('button', { name: 'Show more tiles (1 remaining)' })
    );
    expect(screen.getAllByRole('checkbox')).toHaveLength(21);
    await waitFor(() =>
      expect(
        screen.getAllByRole('link', { name: 'Original GeoTIFF' })
      ).toHaveLength(21)
    );
  });
});

it.each(['usgs-tnm'])('reports an unavailable index in %s', async (theme) => {
  fetchMock.mockRejectedValue(new Error('offline'));
  setup(theme);
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'The source index could not be loaded'
  );
});
it('returns to discovery for a theme without research tools', () => {
  setup('btaa');
  expect(screen.getByTestId('route')).toHaveTextContent(/^\/$/);
  expect(
    screen.queryByRole('navigation', { name: 'Collection pathways' })
  ).not.toBeInTheDocument();
});

function scan(
  id: string,
  year = '1952',
  name = 'Minneapolis South',
  bbox = 'ENVELOPE(-93.375, -93.25, 45, 44.875)'
) {
  const result = record(id);
  Object.assign(result.attributes.ogm, {
    dct_title_s: `${name} ${year} (${id})`,
    dct_alternative_sm: [name],
    dct_issued_s: year,
    dcat_bbox: bbox,
  });
  return result;
}
const placeResponse = {
  data: [
    {
      id: 'mn',
      attributes: {
        name: 'Minneapolis',
        display_name: 'Minneapolis, Minnesota',
        min_longitude: -93.329125,
        max_longitude: -93.193859,
        min_latitude: 44.8906175,
        max_latitude: 45.0512576,
      },
    },
    {
      id: 'ks',
      attributes: {
        name: 'Minneapolis',
        display_name: 'Minneapolis, Kansas',
        min_longitude: -98,
        max_longitude: -97,
        min_latitude: 39,
        max_latitude: 40,
      },
    },
  ],
} as GazetteerResponse;
const searchResponse = (
  data: GeoDocument[],
  totalCount = data.length,
  totalPages = 1
) => ({ data, meta: { totalCount, totalPages } }) as JsonApiResponse;
function apiFilters() {
  return vi.mocked(fetchSearchResults).mock.calls.at(-1)![9]!;
}
async function findMinneapolis() {
  fireEvent.change(screen.getByLabelText('Find a city, place or address'), {
    target: { value: 'Minneapolis' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  fireEvent.click(
    await screen.findByRole('button', { name: 'Minneapolis, Minnesota' })
  );
}
describe('location-first historical maps', () => {
  beforeEach(() => {
    vi.mocked(fetchNominatimSearch)
      .mockReset()
      .mockResolvedValue(placeResponse);
    vi.mocked(fetchResourceDetails).mockImplementation(async (id) =>
      scan(id, id === 'later' ? '1967' : '1952')
    );
    vi.mocked(fetchSearchResults).mockResolvedValue(
      searchResponse([
        scan('early'),
        scan('later', '1967'),
        scan('other', '1952', 'Saint Paul'),
      ])
    );
  });
  it('starts nationally without fetching the Arizona index and finds maps by place bounds', async () => {
    setup('usgs-htmc');
    expect(fetchResourceDetails).not.toHaveBeenCalled();
    expect(fetchSearchResults).not.toHaveBeenCalled();
    expect(screen.queryByText(/Record an observation/)).not.toBeInTheDocument();
    await findMinneapolis();
    expect(await screen.findByText('3 of 3 maps loaded')).toBeVisible();
    expect(fetchNominatimSearch).toHaveBeenCalledWith('Minneapolis', 5);
    expect(vi.mocked(fetchSearchResults).mock.calls.at(-1)![0]).toBe('');
    expect(apiFilters().get('include_filters[gbl_resourceType_sm][]')).toBe(
      'Topographic maps'
    );
    expect(apiFilters().get('include_filters[geo][top_left][lon]')).toBe(
      '-93.329125'
    );
    expect(apiFilters().get('include_filters[geo][relation]')).toBe(
      'intersects'
    );
    expect(route().get('place')).toBe('Minneapolis, Minnesota');
    expect(instances[0].fitBounds).toHaveBeenLastCalledWith(
      [
        [-93.329125, 44.8906175],
        [-93.193859, 45.0512576],
      ],
      expect.anything()
    );
    expect(
      instances[0].getSource('research-discovery-footprints').data.features
    ).toHaveLength(3);
    act(() => instances[0].styleLoaded());
    expect(
      instances[0].getLayer('research-discovery-footprints')
    ).toBeDefined();
  });
  it('searches actual map names independently of the current extent', async () => {
    setup('usgs-htmc', '?area=-94,44,-93,45');
    await screen.findByText('3 of 3 maps loaded');
    fireEvent.click(screen.getByRole('button', { name: 'Map name' }));
    fireEvent.change(screen.getByLabelText('Find maps by name'), {
      target: { value: 'Minneapolis' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() =>
      expect(vi.mocked(fetchSearchResults).mock.calls.at(-1)![0]).toBe(
        'Minneapolis'
      )
    );
    expect(apiFilters().has('include_filters[geo][type]')).toBe(false);
    expect(apiFilters().get('include_filters[gbl_resourceType_sm][]')).toBe(
      'Topographic maps'
    );
    fireEvent.click(
      screen.getByRole('button', { name: /Minneapolis South 1952 \(early\)/ })
    );
    expect(await screen.findByTestId('scan-preview')).toHaveTextContent(
      'early'
    );
    expect(instances[0].fitBounds).toHaveBeenLastCalledWith(
      [
        [-93.375, 44.875],
        [-93.25, 45],
      ],
      expect.anything()
    );
  });
  it('loads additional pages without duplicates, retries failures and resets paging for years', async () => {
    vi.mocked(fetchSearchResults)
      .mockResolvedValueOnce(searchResponse([scan('early')], 3, 2))
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(
        searchResponse(
          [scan('early'), scan('later', '1967'), scan('other')],
          3,
          2
        )
      )
      .mockResolvedValue(searchResponse([]));
    setup('usgs-htmc', '?area=-94,44,-93,45');
    await screen.findByText('1 of 3 maps loaded');
    fireEvent.click(screen.getByRole('button', { name: 'Load more maps' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This does not mean there are no maps here'
    );
    expect(screen.queryByText(/No maps match/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry search' }));
    await screen.findByText('3 of 3 maps loaded');
    expect(
      screen.queryByRole('button', { name: 'Load more maps' })
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Publication year from'), {
      target: { value: '1970' },
    });
    fireEvent.change(screen.getByLabelText('Publication year to'), {
      target: { value: '1900' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply years' }));
    expect(screen.getByRole('alert')).toHaveTextContent('four-digit');
    fireEvent.change(screen.getByLabelText('Publication year to'), {
      target: { value: '1980' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Apply years' }));
    await screen.findByText(/No maps match/);
    expect(vi.mocked(fetchSearchResults).mock.calls.at(-1)![1]).toBe(1);
    expect(apiFilters().get('include_filters[year_range][start]')).toBe('1970');
    fireEvent.click(screen.getByRole('button', { name: 'All years' }));
    await waitFor(() =>
      expect(apiFilters().has('include_filters[year_range][start]')).toBe(false)
    );
  });
  it('uses bounded nearby searches on map clicks and explicit viewport search', async () => {
    setup('usgs-htmc');
    act(() =>
      instances[0].fire('click', { lngLat: { lng: -93.265, lat: 44.977 } })
    );
    await screen.findByText('3 of 3 maps loaded');
    expect(apiFilters().get('include_filters[geo][top_left][lon]')).toBe(
      '-93.27'
    );
    expect(apiFilters().get('include_filters[geo][bottom_right][lon]')).toBe(
      '-93.26'
    );
    expect(route().get('point')).toBe('-93.26500, 44.97700');
    fireEvent.click(screen.getByRole('button', { name: 'Search this area' }));
    await waitFor(() =>
      expect(apiFilters().get('include_filters[geo][top_left][lon]')).toBe(
        '-110'
      )
    );
    expect(route().has('point')).toBe(false);
  });
  it('shows related scans, keeps one map mounted, compares and shares the synchronized view', async () => {
    const view = setup('usgs-htmc', '?area=-94,44,-93,45');
    fireEvent.click(
      await screen.findByRole('button', {
        name: /Minneapolis South 1952 \(early\)/,
      })
    );
    await screen.findByTestId('scan-preview');
    const strip = screen.getByRole('group', { name: 'Related scans' });
    expect(strip).toHaveTextContent('early');
    expect(strip).toHaveTextContent('later');
    expect(strip).not.toHaveTextContent('other');
    fireEvent.click(
      screen.getByRole('button', {
        name: '1967 Minneapolis South 1967 (later)',
      })
    );
    await waitFor(() =>
      expect(screen.getByTestId('scan-preview')).toHaveTextContent('later')
    );
    expect(instances).toHaveLength(1);
    const primary = instances[0];
    primary.center = { lng: -93.3, lat: 44.9 };
    primary.zoom = 11;
    act(() => primary.fire('move'));
    fireEvent.change(screen.getByLabelText('Compare with'), {
      target: { value: 'early' },
    });
    await waitFor(() =>
      expect(screen.getAllByTestId('scan-preview')).toHaveLength(2)
    );
    expect(instances[1].jumpTo).toHaveBeenCalledWith({
      center: primary.center,
      zoom: 11,
      bearing: 0,
      pitch: 0,
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Create link to this view' })
    );
    const url = screen
      .getByRole('link', { name: 'Open saved view' })
      .getAttribute('href')!;
    expect(url).toContain('usgs-htmc/#/research');
    expect(url).toContain('active=later');
    expect(url).toContain('compare=early');
    fireEvent.click(
      screen.getByRole('button', { name: 'Show historical scan' })
    );
    expect(screen.queryByTestId('scan-preview')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back to coverage' }));
    expect(screen.queryByLabelText('Compare with')).not.toBeInTheDocument();
    view.unmount();
    for (const map of instances)
      expect(map.listeners.get('click')?.size).toBe(0);
  });
  it('resolves legacy right-hand record links from their own footprint', async () => {
    setup('usgs-htmc', '?right=early');
    expect(await screen.findByTestId('scan-preview')).toHaveTextContent(
      'early'
    );
    await waitFor(() =>
      expect(route().get('area')).toBe('-93.375,44.875,-93.25,45')
    );
    expect(apiFilters().get('include_filters[geo][top_left][lon]')).toBe(
      '-93.375'
    );
  });
  it('keeps failed place lookup distinct from no results and ignores stale responses', async () => {
    vi.mocked(fetchNominatimSearch)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ data: [] } as unknown as GazetteerResponse);
    setup('usgs-htmc');
    fireEvent.change(screen.getByLabelText('Find a city, place or address'), {
      target: { value: 'Minneapolis' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Check your connection'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await screen.findByText(/No locations found/);
    let finish!: (value: GazetteerResponse) => void;
    vi.mocked(fetchNominatimSearch).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    fireEvent.change(screen.getByLabelText('Find a city, place or address'), {
      target: { value: 'Madison' },
    });
    await act(async () => finish(placeResponse));
    expect(
      screen.queryByRole('button', { name: 'Minneapolis, Minnesota' })
    ).not.toBeInTheDocument();
  });
});

it('preserves original source evidence without inferring structured dates', async () => {
  const original = scan('source');
  original.attributes.ogm.dct_description_sm = [
    'Field checked in 1952; printed in 1954.',
  ];
  original.meta!.ui!.downloads!.push({
    url: 'https://assets.example/source.pdf',
    label: 'Original PDF',
    type: 'pdf',
  });
  vi.mocked(fetchResourceDetails).mockResolvedValue(original);
  setup('usgs-htmc', '?active=source&area=-94,44,-93,45');
  await screen.findByTestId('scan-preview');
  fireEvent.click(screen.getByText('Inspect dates, map margins & citation'));
  expect(
    await screen.findByText('Field checked in 1952; printed in 1954.')
  ).toBeVisible();
  expect(
    screen.getByRole('link', { name: /Open full map PDF/ })
  ).toHaveAttribute('href', 'https://assets.example/source.pdf');
  expect(screen.getAllByText('See description or map margins')).toHaveLength(3);
  expect(screen.getByText('Citation for source')).toBeVisible();
});

it('ignores an old map-search response after a new location is selected', async () => {
  let finish!: (value: JsonApiResponse) => void;
  vi.mocked(fetchSearchResults)
    .mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      })
    )
    .mockResolvedValueOnce(searchResponse([scan('new')]));
  vi.mocked(fetchNominatimSearch).mockResolvedValue(placeResponse);
  setup('usgs-htmc', '?area=-100,30,-99,31');
  await findMinneapolis();
  await screen.findByText('1 of 1 maps loaded');
  await act(async () => finish(searchResponse([scan('stale')])));
  expect(
    screen.queryByRole('button', { name: /\(stale\)/ })
  ).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: /\(new\)/ })).toBeVisible();
});
