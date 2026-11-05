// @vitest-environment jsdom
import { useEffect, useState, type ReactNode } from 'react';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
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
  fetchResourceDetails,
  fetchSearchResults,
} from '../../../services/api';
import { bboxFeature, type IndexFeature } from '../../../services/research';
import type { GeoDocument, JsonApiResponse } from '../../../types/api';
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
function edition(id: string, year: string, printing?: string): IndexFeature {
  return {
    ...tile(id, [-112.25, 36, -112, 36.25]),
    properties: {
      recId: id,
      title: 'Bright Angel',
      label: id,
      datePub: year,
      dateReprnt: printing,
      dateSurvey: '1903',
      scale: '1:48,000',
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

describe('historical edition research', () => {
  beforeEach(() => {
    features = [
      edition('usgs-htmc-314254', '1903'),
      edition('reprint', '1903', '1957'),
      edition('middle', '1906'),
      edition('usgs-htmc-464619', '1962', '1963'),
      {
        ...edition('other', '1920'),
        properties: {
          ...edition('other', '1920').properties,
          title: 'Other sheet',
        },
      },
    ];
  });

  it('shares a geographic cursor, pins on click, restores markers after a style change and supports keyboard coordinates', async () => {
    const view = setup('usgs-htmc');
    await screen.findByLabelText('Printing / scan · 1903');
    fireEvent.click(screen.getByRole('button', { name: 'Compare maps' }));
    await screen.findByLabelText('Printing / scan · 1962');
    fireEvent.click(screen.getByText('Go to coordinates'));
    const maps = [...instances];
    act(() =>
      maps[0].fire('mousemove', { lngLat: { lng: -112.2, lat: 36.12 } })
    );
    for (const marker of markers)
      expect(marker.getLngLat()).toEqual([-112.19999999999999, 36.12]);
    act(() => maps[0].fire('click', { lngLat: { lng: -112.1, lat: 36.1 } }));
    expect(route().get('point')).toBe('-112.10000, 36.10000');
    act(() => maps[1].fire('mousemove', { lngLat: { lng: 0, lat: 0 } }));
    for (const marker of markers)
      expect(marker.getLngLat()).toEqual([-112.1, 36.1]);
    act(() => {
      maps[0].setStyle();
      maps[0].styleLoaded();
    });
    expect(markers[0].getLngLat()).toEqual([-112.1, 36.1]);
    fireEvent.change(screen.getByLabelText('Longitude, latitude (WGS84)'), {
      target: { value: '200, 90' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Locate & pin' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter longitude');
    fireEvent.change(screen.getByLabelText('Longitude, latitude (WGS84)'), {
      target: { value: '-112.15, 36.15' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Locate & pin' }));
    for (const map of maps)
      expect(map.jumpTo).toHaveBeenLastCalledWith(
        expect.objectContaining({ center: { lng: -112.15, lat: 36.15 } })
      );
    fireEvent.click(screen.getByRole('button', { name: 'Clear pin' }));
    expect(route().has('point')).toBe(false);
    for (const marker of markers) expect(marker.getElement().hidden).toBe(true);
    view.unmount();
    for (const map of maps)
      for (const event of ['move', 'mousemove', 'mouseout', 'click'])
        expect(map.listeners.get(event)?.size).toBe(0);
  });
  it('restores and shares the selected printings, exact view and point through a collection URL', async () => {
    setup(
      'usgs-htmc',
      '?printings=reprint&point=-112.2,36.1&view=-112.2,36.1,12'
    );
    await screen.findByLabelText('Printing / scan · 1903');
    for (const map of instances)
      expect(map.jumpTo).toHaveBeenCalledWith({
        center: { lng: -112.2, lat: 36.1 },
        zoom: 12,
        bearing: 0,
        pitch: 0,
      });
    instances[0].center = { lng: -112.21, lat: 36.11 };
    instances[0].zoom = 13;
    act(() => instances[0].fire('move'));
    fireEvent.click(
      screen.getByRole('button', { name: 'Create link to this view' })
    );
    const link = new URL(
      screen
        .getByRole('link', { name: 'Open saved view' })
        .getAttribute('href')!
    );
    expect(link.pathname).toMatch(/usgs-htmc\/$/);
    const params = new URLSearchParams(link.hash.split('?')[1]);
    expect(params.get('view')).toBe('-112.21000,36.11000,13.000');
    expect(params.get('point')).toBe('-112.20000, 36.10000');
    expect(params.get('printings')).toBe('reprint,middle,usgs-htmc-464619');
  });
  it('opens original map margins and distinguishes index, survey and printing dates with the API citation', async () => {
    vi.mocked(fetchResourceDetails).mockImplementation(async (id) => {
      const data = record(id);
      data.meta!.ui!.downloads!.push({
        label: 'GeoPDF',
        type: 'pdf',
        url: 'https://assets.example/full-map.pdf',
      });
      data.attributes.ogm.dct_description_sm = [
        'Surveyed in 1903; printed in 1957.',
      ];
      return data;
    });
    setup('usgs-htmc', '?printings=reprint');
    await screen.findByLabelText('Printing / scan · 1903');
    const card = screen.getByRole('article', { name: '1903' });
    fireEvent.click(
      within(card).getByText('Inspect dates, map margins & citation')
    );
    expect(
      await within(card).findByRole('link', { name: /Open full map PDF/ })
    ).toHaveAttribute('href', 'https://assets.example/full-map.pdf');
    expect(within(card).getByText('Citation for reprint')).toBeVisible();
    expect(within(card).getByText('1957')).toBeVisible();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    fireEvent.click(
      within(card).getByRole('button', { name: 'Copy citation' })
    );
    await within(card).findByText('Citation copied.');
    expect(writeText).toHaveBeenCalledWith('Citation for reprint');
    writeText.mockRejectedValue(new Error('denied'));
    fireEvent.click(
      within(card).getByRole('button', { name: 'Copy citation' })
    );
    await within(card).findByText('Select and copy the citation above.');
  });

  it('starts with one map and an edition strip, preserves the view across editions, and compares only on request', async () => {
    const view = setup('usgs-htmc');
    expect(await screen.findByTestId('scan-preview')).toHaveTextContent(
      'usgs-htmc-314254'
    );
    expect(screen.getAllByRole('article')).toHaveLength(1);
    for (const year of ['1903', '1906', '1962'])
      expect(
        screen.getByRole('button', { name: `View ${year} edition` })
      ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: /Record an observation/ })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('editions across 4 scans / printings')
    ).toBeVisible();
    const primary = instances[0];
    primary.center = { lng: -112.1, lat: 36.1 };
    primary.zoom = 12;
    act(() => primary.fire('move'));
    fireEvent.click(screen.getByRole('button', { name: 'View 1906 edition' }));
    await waitFor(() =>
      expect(screen.getByTestId('scan-preview')).toHaveTextContent('middle')
    );
    expect(route().get('active')).toBe('middle');
    expect(instances).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Compare maps' }));
    await screen.findByLabelText('Printing / scan · 1962');
    const secondary = instances[1];
    expect(secondary.jumpTo).toHaveBeenCalledWith({
      center: primary.center,
      zoom: 12,
      bearing: 0,
      pitch: 0,
    });
    for (const map of instances) {
      map.jumpTo.mockClear();
      map.jumpTo.mockImplementation(() => map.fire('move'));
    }
    act(() => primary.fire('move'));
    expect(secondary.jumpTo).toHaveBeenCalledTimes(1);
    expect(primary.jumpTo).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Compare with'), {
      target: { value: '1903' },
    });
    fireEvent.change(await screen.findByLabelText('Printing / scan · 1903'), {
      target: { value: 'reprint' },
    });
    await waitFor(() =>
      expect(
        screen.getAllByTestId('scan-preview').map((e) => e.textContent)
      ).toEqual(['middle', 'reprint'])
    );
    expect(route().get('compare')).toBe('reprint');
    fireEvent.click(screen.getByRole('button', { name: 'Compare maps' }));
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(secondary.listeners.get('move')?.size).toBe(0);
    fireEvent.change(screen.getByLabelText('Map sheet'), {
      target: { value: 'other' },
    });
    await waitFor(() =>
      expect(screen.getByTestId('scan-preview')).toHaveTextContent('other')
    );
    for (const key of ['printings', 'active', 'compare', 'point', 'view'])
      expect(route().has(key)).toBe(false);
    view.unmount();
    for (const map of instances)
      expect(map.listeners.get('move')?.size).toBe(0);
  });
  it.each([
    '?left=reprint&right=usgs-htmc-464619',
    '?printings=reprint,middle,usgs-htmc-464619',
  ])(
    'restores preferred printings from %s while keeping every edition selectable',
    async (query) => {
      setup('usgs-htmc', query);
      expect(await screen.findByTestId('scan-preview')).toHaveTextContent(
        'reprint'
      );
      expect(screen.getByLabelText('Printing / scan · 1903')).toHaveValue(
        'reprint'
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'View 1906 edition' })
      );
      await waitFor(() =>
        expect(screen.getByTestId('scan-preview')).toHaveTextContent('middle')
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'View 1903 edition' })
      );
      await waitFor(() =>
        expect(screen.getByTestId('scan-preview')).toHaveTextContent('reprint')
      );
      expect(screen.getByLabelText('Printing / scan · 1903')).toHaveValue(
        'reprint'
      );
    }
  );
  it('restores optional comparison and can compare two printings of the same publication year', async () => {
    setup(
      'usgs-htmc',
      '?active=usgs-htmc-314254&compare=reprint&point=-112.1,36.1&view=-112.1,36.1,12'
    );
    await waitFor(() =>
      expect(
        screen.getAllByTestId('scan-preview').map((e) => e.textContent)
      ).toEqual(['usgs-htmc-314254', 'reprint'])
    );
    expect(
      screen.getByRole('button', { name: 'Compare maps' })
    ).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(
      screen.getByRole('button', { name: 'Create link to this view' })
    );
    const params = new URLSearchParams(
      screen
        .getByRole('link', { name: 'Open saved view' })
        .getAttribute('href')!
        .split('?')[1]
    );
    expect(params.get('active')).toBe('usgs-htmc-314254');
    expect(params.get('compare')).toBe('reprint');
    expect(params.get('point')).toBe('-112.10000, 36.10000');
    expect(params.get('view')).toBe('-112.10000,36.10000,12.000');
  });
  it('finds another state without opening a disclosure and replaces the old sheet and scans', async () => {
    vi.mocked(fetchSearchResults).mockResolvedValue({
      data: [record('another-index')],
    } as unknown as JsonApiResponse);
    const madison = {
      ...edition('wisconsin-scan', '1920'),
      properties: {
        ...edition('wisconsin-scan', '1920').properties,
        title: 'Madison',
      },
    };
    fetchMock.mockImplementation(async (url: string) => ({
      ok: true,
      json: async () => ({
        type: 'FeatureCollection',
        features: String(url).includes('another-index') ? [madison] : features,
      }),
    }));
    setup(
      'usgs-htmc',
      '?sheet=reprint&left=reprint&right=middle&printings=reprint'
    );
    await screen.findAllByTestId('scan-preview');
    expect(
      screen.queryByText('Find more in this collection')
    ).not.toBeInTheDocument();
    fireEvent.change(
      screen.getByLabelText('Find maps in another state or region'),
      {
        target: { value: 'Wisconsin' },
      }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Record another-index' })
    );
    expect(fetchSearchResults).toHaveBeenCalledWith('Wisconsin', 1, 20, [
      { field: 'gbl_resourceType_sm', value: 'Index maps' },
    ]);
    await waitFor(() =>
      expect(
        screen.getAllByTestId('scan-preview').map((e) => e.textContent)
      ).toEqual(['wisconsin-scan'])
    );
    expect(screen.getByLabelText('Map sheet')).toHaveTextContent('Madison');
    expect(screen.getByLabelText('Map sheet')).not.toHaveTextContent(
      'Bright Angel'
    );
    expect(screen.getByLabelText('Selected map index')).toHaveValue(
      'another-index'
    );
    expect(route().get('index')).toBe('another-index');
    for (const key of ['sheet', 'left', 'right', 'printings'])
      expect(route().has(key)).toBe(false);
  });
  it('browses all indexes with forward and backward pagination and resets to page one for a new search', async () => {
    vi.mocked(fetchSearchResults).mockImplementation(
      async (query, page) =>
        ({
          data: [record(`${query || 'all'}-${page}`)],
          meta: { totalPages: 2 },
        }) as unknown as JsonApiResponse
    );
    setup('usgs-htmc');
    await screen.findAllByTestId('scan-preview');
    fireEvent.click(
      screen.getByRole('button', { name: 'Browse all map indexes' })
    );
    await screen.findByRole('button', { name: 'Record all-1' });
    fireEvent.click(screen.getByRole('button', { name: 'Next results' }));
    await screen.findByRole('button', { name: 'Record all-2' });
    expect(
      screen.queryByRole('button', { name: 'Next results' })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Previous results' }));
    await screen.findByRole('button', { name: 'Record all-1' });
    fireEvent.click(screen.getByRole('button', { name: 'Next results' }));
    await screen.findByRole('button', { name: 'Record all-2' });
    fireEvent.change(
      screen.getByLabelText('Find maps in another state or region'),
      { target: { value: 'Alaska' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await screen.findByRole('button', { name: 'Record Alaska-1' });
    expect(
      screen.queryByRole('button', { name: 'Previous results' })
    ).not.toBeInTheDocument();
    expect(fetchSearchResults).toHaveBeenCalledWith('', 2, 20, [
      { field: 'gbl_resourceType_sm', value: 'Index maps' },
    ]);
  });
  it('retries a failed index search and explains an empty result without losing the comparison', async () => {
    vi.mocked(fetchSearchResults)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({
        data: [],
        meta: { totalPages: 0 },
      } as unknown as JsonApiResponse);
    setup('usgs-htmc');
    await screen.findAllByTestId('scan-preview');
    fireEvent.click(
      screen.getByRole('button', { name: 'Browse all map indexes' })
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Search could not be completed'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry search' }));
    expect(
      await screen.findByText('No matching records. Try a broader search.')
    ).toBeVisible();
    expect(screen.getAllByTestId('scan-preview')).toHaveLength(1);
  });
  it('reports an empty index without mounting a comparison', async () => {
    features = [];
    setup('usgs-htmc');
    expect(
      await screen.findByText('No sheets are available in this index.')
    ).toBeVisible();
    expect(screen.queryByTestId('scan-preview')).not.toBeInTheDocument();
  });
});

it.each(['usgs-tnm', 'usgs-htmc'])(
  'reports an unavailable index in %s',
  async (theme) => {
    fetchMock.mockRejectedValue(new Error('offline'));
    setup(theme);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The source index could not be loaded'
    );
  }
);
it('returns to discovery for a theme without research tools', () => {
  setup('btaa');
  expect(screen.getByTestId('route')).toHaveTextContent(/^\/$/);
  expect(
    screen.queryByRole('navigation', { name: 'Collection pathways' })
  ).not.toBeInTheDocument();
});
