import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
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
import { fetchMapH3 } from '../../services/api';
function Location() {
  return <output data-testid="location">{useLocation().search}</output>;
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
describe('Location filter', () => {
  beforeEach(() => {
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
