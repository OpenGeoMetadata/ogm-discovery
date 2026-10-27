import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router';
import { latLngToCell } from 'h3-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../services/api', () => ({
  fetchMapH3: vi.fn(),
  fetchNominatimSearch: vi.fn(),
  getApiBasePath: () => '/api/v1',
}));
vi.mock('maplibre-gl', () => import('../helpers/maplibre'));
import { instances } from '../helpers/maplibre';
import { MapProvider } from '../../context/MapContext';
import { GeospatialFilterMap } from '../../components/search/GeospatialFilterMap.client';
import { fetchMapH3, type MapH3Response } from '../../services/api';
function Location() {
  const navigate = useNavigate();
  return (
    <>
      <output data-testid="location">{useLocation().search}</output>
      <button onClick={() => navigate('/search?q=iran')}>Search Iran</button>
      <button onClick={() => navigate('/search?q=japan')}>Search Japan</button>
      <button onClick={() => navigate('/search?q=iran&page=2')}>
        Next page
      </button>
    </>
  );
}
function setup(query = '') {
  return render(
    <MemoryRouter initialEntries={[`/search${query}`]}>
      <MapProvider>
        <GeospatialFilterMap />
        <Location />
      </MapProvider>
    </MemoryRouter>
  );
}
const bbox =
  '?include_filters[geo][type]=bbox&include_filters[geo][top_left][lat]=50&include_filters[geo][top_left][lon]=-110&include_filters[geo][bottom_right][lat]=30&include_filters[geo][bottom_right][lon]=-80';
const iran: MapH3Response = {
  hexes: [{ h3: latLngToCell(32, 54, 2), count: 10 }],
  resolution: 2,
  globalCount: 10,
};
describe('Location filter', () => {
  beforeEach(() => {
    vi.mocked(fetchMapH3).mockReset();
    instances.length = 0;
    localStorage.clear();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      }
    );
    vi.mocked(fetchMapH3).mockResolvedValue({
      hexes: [],
      resolution: 2,
      globalCount: 0,
    });
  });
  it('fits Iran from the full search even when the initial US viewport is empty', async () => {
    let finishExtent!: (response: MapH3Response) => void;
    vi.mocked(fetchMapH3).mockImplementation((_query, viewport) =>
      viewport
        ? Promise.resolve({ hexes: [], resolution: 2, globalCount: 10 })
        : new Promise((resolve) => {
            finishExtent = resolve;
          })
    );
    setup('?q=iran&include_filters[schema_provider_s][]=Campus');
    await waitFor(() =>
      expect(fetchMapH3).toHaveBeenCalledWith(
        'iran',
        undefined,
        2,
        expect.stringContaining('Campus')
      )
    );
    const map = instances.at(-1)!;
    expect(map.fitBounds).not.toHaveBeenCalled();
    await act(async () => finishExtent(iran));
    await waitFor(() => expect(map.fitBounds).toHaveBeenCalledTimes(1));
    const [[west, south], [east, north]] = map.fitBounds.mock.calls[0][0];
    expect(west).toBeGreaterThan(45);
    expect(west).toBeLessThan(54);
    expect(east).toBeGreaterThan(54);
    expect(east).toBeLessThan(65);
    expect(south).toBeLessThan(32);
    expect(north).toBeGreaterThan(32);
  });
  it('refits on a new search but preserves the camera on pagination and panning', async () => {
    vi.mocked(fetchMapH3).mockImplementation(async (query, viewport) => ({
      ...iran,
      hexes: viewport
        ? []
        : [
            {
              h3:
                query === 'japan' ? latLngToCell(36, 138, 2) : iran.hexes[0].h3,
              count: 10,
            },
          ],
    }));
    setup('?q=iran');
    const map = instances.at(-1)!;
    await waitFor(() => expect(map.fitBounds).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await act(async () => {
      map.zoom = 4;
      map.fire('movestart', { originalEvent: {} });
      map.fire('moveend');
    });
    expect(map.fitBounds).toHaveBeenCalledTimes(1);
    expect(
      vi.mocked(fetchMapH3).mock.calls.filter((call) => !call[1])
    ).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Search Japan' }));
    await waitFor(() => expect(map.fitBounds).toHaveBeenCalledTimes(2));
    expect(map.fitBounds.mock.calls[1][0][0][0]).toBeGreaterThan(130);
  });
  it('honors explicit location bounds and fits results when the filter is cleared', async () => {
    vi.mocked(fetchMapH3).mockResolvedValue(iran);
    setup(`${bbox}&q=iran`);
    const map = instances.at(-1)!;
    await act(async () => {});
    expect(map.fitBounds).toHaveBeenCalledTimes(1);
    expect(map.fitBounds).toHaveBeenCalledWith(
      [
        [-110, 30],
        [-80, 50],
      ],
      expect.any(Object)
    );
    expect(vi.mocked(fetchMapH3).mock.calls.every((call) => !!call[1])).toBe(
      true
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Clear location filter' })
    );
    await waitFor(() => expect(map.fitBounds).toHaveBeenCalledTimes(2));
    expect(map.fitBounds.mock.calls[1][0][0][0]).toBeGreaterThan(45);
  });
  it('ignores a delayed extent from the previous search', async () => {
    let finishIran!: (response: MapH3Response) => void;
    vi.mocked(fetchMapH3).mockImplementation((query, viewport) => {
      if (query === 'iran' && !viewport)
        return new Promise((resolve) => {
          finishIran = resolve;
        });
      return Promise.resolve({
        ...iran,
        hexes: viewport ? [] : [{ h3: latLngToCell(36, 138, 2), count: 10 }],
      });
    });
    setup('?q=iran');
    const map = instances.at(-1)!;
    fireEvent.click(screen.getByRole('button', { name: 'Search Japan' }));
    await waitFor(() => expect(map.fitBounds).toHaveBeenCalledTimes(1));
    expect(map.fitBounds.mock.calls[0][0][0][0]).toBeGreaterThan(130);
    await act(async () => finishIran(iran));
    expect(map.fitBounds).toHaveBeenCalledTimes(1);
  });
  it('leaves the camera in place for empty results and refits a returning search', async () => {
    vi.mocked(fetchMapH3).mockImplementation(async (query, viewport) => ({
      ...iran,
      hexes: viewport || query === 'japan' ? [] : iran.hexes,
    }));
    setup('?q=iran');
    const map = instances.at(-1)!;
    await waitFor(() => expect(map.fitBounds).toHaveBeenCalledTimes(1));
    await act(async () =>
      fireEvent.click(screen.getByRole('button', { name: 'Search Japan' }))
    );
    expect(map.fitBounds).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Search Iran' }));
    await waitFor(() => expect(map.fitBounds).toHaveBeenCalledTimes(2));
  });
  it('forwards active query and filters to H3', async () => {
    setup('?q=water&include_filters[schema_provider_s][]=Campus');
    await waitFor(() =>
      expect(fetchMapH3).toHaveBeenCalledWith(
        'water',
        expect.any(String),
        2,
        expect.stringContaining('Campus')
      )
    );
  });
  it('updates within/overlap without losing bounds', () => {
    setup(bbox);
    expect(screen.getByRole('button', { name: 'Overlap' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Within' }));
    expect(
      decodeURIComponent(screen.getByTestId('location').textContent!)
    ).toContain('include_filters[geo][relation]=within');
  });
  it('clears only geo filters and resets pagination', () => {
    setup(`${bbox}&q=water&page=4`);
    fireEvent.click(
      screen.getByRole('button', { name: 'Clear location filter' })
    );
    expect(screen.getByTestId('location')).toHaveTextContent('?q=water');
  });
  it('searches the moved viewport only on request', () => {
    setup('?q=water');
    act(() => instances.at(-1)!.fire('movestart', { originalEvent: {} }));
    expect(screen.getByTestId('location')).toHaveTextContent('?q=water');
    fireEvent.click(screen.getByRole('button', { name: 'Search here' }));
    expect(
      decodeURIComponent(screen.getByTestId('location').textContent!)
    ).toContain('include_filters[geo][top_left][lon]=-110');
  });
  it('persists the H3 toggle', () => {
    setup();
    fireEvent.click(screen.getByRole('button', { name: 'Hide hex map layer' }));
    expect(
      screen.getByRole('button', { name: 'Show hex map layer' })
    ).toBeInTheDocument();
  });
});
