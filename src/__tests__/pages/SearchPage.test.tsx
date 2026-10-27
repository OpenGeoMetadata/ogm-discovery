import { gazetteerResponse } from '../helpers/gazetteer';
import { render, screen, waitFor, act } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { HelmetProvider } from 'react-helmet-async';
import { SearchPage } from '../../pages/SearchPage';
import { ApiProvider } from '../../context/ApiContext';
import { DebugProvider } from '../../context/DebugContext';
import { fetchNominatimSearch, fetchSuggestions } from '../../services/api';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { GeoDocument, JsonApiResponse } from '../../types/api';

vi.mock('../../services/analytics', () => ({
  scheduleAnalyticsBatch: vi.fn(),
  generateAnalyticsId: vi.fn(() => 'search_test_id'),
  serializeSearchParams: vi.fn(() => ({})),
}));

vi.mock('../../services/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/api')>();
  return {
    ...actual,
    fetchNominatimSearch: vi.fn().mockResolvedValue({ data: [] }),
    fetchSuggestions: vi.fn().mockResolvedValue([]),
  };
});

vi.mock('../../components/search/GeospatialFilterMap', () => ({
  GeospatialFilterMap: () => <div data-testid="geo-filter-map">Geo Map</div>,
}));

vi.mock('../../components/search/ResourceClassFilterTabs', () => ({
  ResourceClassFilterTabs: () => (
    <div data-testid="resource-class-filter-tabs">Resource Class Tabs</div>
  ),
}));

vi.mock('../../components/SearchResults', () => ({
  SearchResults: ({ results }: { results: GeoDocument[] }) => (
    <div data-testid="search-results-list">
      {results.map((result) => (
        <div key={result.id}>
          List Result {result.attributes.ogm.dct_title_s}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../../components/search/GalleryView', () => ({
  GalleryView: ({ results }: { results: GeoDocument[] }) => (
    <div data-testid="gallery-view">
      {results.map((result) => (
        <div key={result.id}>
          Gallery Result {result.attributes.ogm.dct_title_s}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../../components/search/MapResultView', () => ({
  MapResultView: () => <div data-testid="map-result-view">Map Result View</div>,
}));

const mockResults: GeoDocument[] = Array.from({ length: 40 }, (_, i) => ({
  type: 'file',
  id: `result-${i + 1}`,
  attributes: {
    ogm: {
      id: `result-${i + 1}`,
      dct_title_s: `Result ${i + 1}`,
      gbl_resourceClass_sm: ['Map'],
    },
  },
  links: { self: '#' },
}));

function createMockApiResponse(
  data: GeoDocument[],
  total = 100,
  page = 1
): JsonApiResponse {
  return {
    jsonapi: { version: '1.0', profile: [] },
    data,
    meta: {
      totalCount: total,
      totalPages: Math.ceil(total / 20),
      currentPage: page,
      perPage: 20,
      query: '',
    },
    links: { self: '', first: '', last: '' },
    included: [],
  };
}

describe('SearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchNominatimSearch).mockResolvedValue(gazetteerResponse());
    vi.mocked(fetchSuggestions).mockResolvedValue([]);
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const renderWithRouter = (
    initialUrl = '/search',
    searchResults: JsonApiResponse | null = null
  ) => {
    const routes = [
      {
        path: '/search',
        element: (
          <HelmetProvider>
            <ApiProvider>
              <DebugProvider>
                <SearchPage searchResults={searchResults} isLoading={false} />
              </DebugProvider>
            </ApiProvider>
          </HelmetProvider>
        ),
      },
    ];

    const router = createMemoryRouter(routes, {
      initialEntries: [initialUrl],
    });

    const result = render(<RouterProvider router={router} />);
    return { ...result, router };
  };

  it('renders map view by default', async () => {
    const results = createMockApiResponse(mockResults.slice(0, 20));
    renderWithRouter('/search?q=', results);

    expect(screen.getByTestId('map-result-view')).toBeInTheDocument();
    expect(screen.queryByTestId('gallery-view')).not.toBeInTheDocument();
  });

  it('renders gallery view when view=gallery is present', () => {
    const results = createMockApiResponse(mockResults.slice(0, 20));
    renderWithRouter('/search?q=&view=gallery', results);

    expect(screen.getByTestId('gallery-view')).toBeInTheDocument();
    expect(screen.queryByTestId('search-results-list')).not.toBeInTheDocument();
  });

  it('does not mount the location map by default in gallery view', () => {
    const results = createMockApiResponse(mockResults.slice(0, 20));
    renderWithRouter('/search?q=&view=gallery', results);

    expect(screen.queryByTestId('geo-filter-map')).not.toBeInTheDocument();
  });

  it('mounts the location map by default in map view', async () => {
    const results = createMockApiResponse(mockResults.slice(0, 20));
    renderWithRouter('/search?q=', results);

    await waitFor(() => {
      expect(screen.getByTestId('geo-filter-map')).toBeInTheDocument();
    });
  });

  it('restores saved gallery view preference when URL has no view param', async () => {
    localStorage.setItem('b1g_view_preference', 'gallery');
    const results = createMockApiResponse(mockResults.slice(0, 20));
    renderWithRouter('/search?q=', results);

    await waitFor(() => {
      expect(screen.getByTestId('gallery-view')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('map-result-view')).not.toBeInTheDocument();
  });

  it('preserves bbox filter when removing a facet constraint', async () => {
    const bboxAndMapsUrl =
      '/search?q=' +
      '&include_filters%5Bgeo%5D%5Btype%5D=bbox' +
      '&include_filters%5Bgeo%5D%5Bfield%5D=dcat_bbox' +
      '&include_filters%5Bgeo%5D%5Btop_left%5D%5Blat%5D=41.28' +
      '&include_filters%5Bgeo%5D%5Btop_left%5D%5Blon%5D=-90.76' +
      '&include_filters%5Bgeo%5D%5Bbottom_right%5D%5Blat%5D=34.59' +
      '&include_filters%5Bgeo%5D%5Bbottom_right%5D%5Blon%5D=-82.28' +
      '&include_filters%5Bgbl_resourceClass_sm%5D%5B%5D=Maps';

    const results = createMockApiResponse(mockResults.slice(0, 20));
    const { router } = renderWithRouter(bboxAndMapsUrl, results);

    const mapsButton = screen.getByRole('button', {
      name: /Resource Class: Maps/i,
    });
    await act(async () => {
      mapsButton.click();
    });

    const params = new URLSearchParams(router.state.location.search);
    expect(params.get('include_filters[geo][type]')).toBe('bbox');
    expect(params.get('include_filters[geo][top_left][lat]')).toBe('41.28');
    expect(params.get('include_filters[geo][bottom_right][lat]')).toBe('34.59');
    expect(params.get('include_filters[gbl_resourceClass_sm][]')).toBeNull();
  });

  it('displays page-based pagination text for gallery view', () => {
    const results = createMockApiResponse(mockResults.slice(0, 20), 100, 1);
    renderWithRouter('/search?q=&view=gallery', results);

    expect(
      screen.getByText(/Showing results 1-20 of 100/i)
    ).toBeInTheDocument();
  });

  it('shows the zero-results help without a 0-0 range or map facet', async () => {
    const results = createMockApiResponse([], 0, 1);
    renderWithRouter('/search?q=notfound', results);

    expect(screen.getByText('No search results found')).toBeInTheDocument();
    expect(
      await screen.findByText('No close keyword suggestions found.')
    ).toBeInTheDocument();
    expect(
      await screen.findByText('No matching geographic areas found.')
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Showing results 0-0 of 0/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('geo-filter-map')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Advanced Search/i })
    ).toBeInTheDocument();
  });
});
