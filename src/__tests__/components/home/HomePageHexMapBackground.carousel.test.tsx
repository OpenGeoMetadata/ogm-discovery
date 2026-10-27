vi.mock('../../../components/map/BboxRectangleSelector', () => ({
  BboxRectangleSelector: () => null,
}));
/**
 * Behavior tests for the Featured resources carousel on the homepage.
 * Covers: thumbnail selection (no auto-start), Play/Pause, animation from selected item.
 */
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as api from '../../../services/api';
import { HomePageHexMapBackground } from '../../../components/home/HomePageHexMapBackground.client';
import { THEME_STORAGE_KEY } from '../../../config/institution';
import { ThemeProvider } from '../../../context/ThemeContext';

vi.mock('leaflet/dist/leaflet.css', () => ({}));
vi.mock('leaflet-gesture-handling', () => ({ GestureHandling: {} }));

vi.mock('../../../components/map/BasemapSwitcherControl', () => ({
  BasemapSwitcherControl: () => null,
}));

vi.mock('../../../components/map/HexLayerToggleControl', () => ({
  HexLayerToggleControl: ({
    enabled,
    onToggle,
  }: {
    enabled: boolean;
    onToggle: (enabled: boolean) => void;
  }) => (
    <div>
      <div data-testid="homepage-hex-enabled-state">{String(enabled)}</div>
      <button
        type="button"
        data-testid="homepage-hex-toggle-btn"
        onClick={() => onToggle(!enabled)}
      >
        Toggle homepage hex
      </button>
    </div>
  ),
}));

vi.mock('../../../components/map/MapGeosearchControl', () => ({
  MapGeosearchControl: () => <div data-testid="homepage-map-geosearch" />,
}));

vi.mock('../../../components/map/GeometryLayer', () => ({
  GeometryLayer: () => null,
}));
const mockPane = document.createElement('div');
vi.mock('../../../components/map/MapLibreMap', () => ({
  MapLibreMap: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
}));

vi.mock('../../../context/MapLibreContext', () => ({
  useMap: () => ({
    getContainer: () => document.createElement('div'),
    getBounds: () => ({
      getWest: () => -100,
      getSouth: () => 30,
      getEast: () => -80,
      getNorth: () => 50,
      getNorthEast: () => ({ lat: 50, lng: -80 }),
      getSouthWest: () => ({ lat: 30, lng: -100 }),
    }),
    getZoom: () => 5,
    getCenter: () => ({ lat: 44, lng: -80 }),
    whenReady: (cb: () => void) => cb(),
    on: () => {},
    off: () => {},
    hasLayer: () => false,
    addLayer: vi.fn(),
    removeLayer: () => {},
    fitBounds: () => {},
    getPane: () => null,
    createPane: () => mockPane,
    panBy: () => {},
  }),
}));

vi.mock('../../../components/map/MapUpdaterHex', () => ({
  MapUpdaterHex: () => null,
}));

vi.mock('../../../components/home/FeaturedMapController', () => ({
  FeaturedMapController: () => null,
}));

vi.mock('../../../components/home/FeaturedItemPreviewLayer', () => ({
  FeaturedItemPreviewLayer: () => null,
}));

vi.mock('../../../components/home/FeaturedItemBoundsLayer', () => ({
  FeaturedItemBoundsLayer: () => null,
}));

vi.mock('../../../components/map/H3HexDataTable', () => ({
  H3HexDataTable: () => <div data-testid="h3-hex-table">Hex table</div>,
}));

function makeMockDetail(id: string, title: string) {
  return {
    id,
    type: 'resource',
    attributes: {
      ogm: {
        id,
        dct_title_s: title,
        dct_description_sm: ['Description'],
        dct_temporal_sm: ['2023'],
        dc_publisher_sm: ['Publisher'],
        gbl_resourceClass_sm: ['Dataset'],
      },
    },
    meta: {
      ui: {
        thumbnail_url: null,
        viewer: {
          geometry: {
            type: 'Point',
            coordinates: [-93.265, 44.9778],
          },
        },
      },
    },
  };
}

describe('HomePageHexMapBackground – Featured carousel behavior', () => {
  const user = userEvent.setup({ delay: null });
  const previewTitleById = new Map<string, string>();

  beforeEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    localStorage.setItem(THEME_STORAGE_KEY, 'unr');
    previewTitleById.clear();
    vi.mocked(api.fetchFeaturedResourcePreview).mockImplementation(
      (id: string) => {
        if (!previewTitleById.has(id)) {
          previewTitleById.set(
            id,
            `Featured Item ${previewTitleById.size + 1}`
          );
        }

        return Promise.resolve(
          makeMockDetail(
            id,
            previewTitleById.get(id) || 'Featured Item'
          ) as Awaited<ReturnType<typeof api.fetchFeaturedResourcePreview>>
        );
      }
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderCarousel = () => {
    render(
      <BrowserRouter>
        <ThemeProvider initialThemeId="unr">
          <HomePageHexMapBackground />
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  const waitForFeaturedData = async () => {
    await screen.findByRole(
      'button',
      { name: /Featured Item 1|Test Resource/i },
      { timeout: 8000 }
    );
  };

  const getPlayPauseButton = () =>
    screen.getByRole('button', {
      name: /Start featured carousel|Play featured carousel|Pause featured carousel/i,
    });

  const getProgressBar = () =>
    screen.getByRole('progressbar', { name: /Time remaining/i });

  it('carousel region renders with expected structure', async () => {
    renderCarousel();
    const carousel = await screen.findByRole('region', {
      name: /Featured resources/i,
    });
    expect(carousel).toBeInTheDocument();
    expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');
    expect(getPlayPauseButton()).toBeInTheDocument();
  });

  it('restores and persists homepage hex layer preference via localStorage', async () => {
    localStorage.setItem('hex_layer_enabled', '0');
    renderCarousel();

    expect(
      await screen.findByTestId('homepage-hex-enabled-state')
    ).toHaveTextContent('false');

    await user.click(screen.getByTestId('homepage-hex-toggle-btn'));

    await waitFor(() => {
      expect(localStorage.getItem('hex_layer_enabled')).toBe('1');
    });
    expect(screen.getByTestId('homepage-hex-enabled-state')).toHaveTextContent(
      'true'
    );
  });

  it('clicking a featured item thumbnail highlights it without starting the animation', async () => {
    renderCarousel();
    await waitForFeaturedData();

    const thirdThumb = screen.getByRole('button', {
      name: /Featured Item 3/i,
    });
    vi.useFakeTimers();
    fireEvent.click(thirdThumb);

    expect(screen.getByRole('status', { hidden: true })).toHaveTextContent(
      /Current featured item: Featured Item 3/i
    );

    const progressBar = getProgressBar();
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    vi.useRealTimers();

    expect(getProgressBar()).toHaveAttribute('aria-valuenow', '100');
  });
});
