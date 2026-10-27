import { act, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('maplibre-gl', () => import('../helpers/maplibre'));
import { instances } from '../helpers/maplibre';
import { MapProvider } from '../../context/MapContext';
import { MapView } from '../../components/search/MapView';
import type { GeoDocument } from '../../types/api';
const result = {
  id: 'one',
  attributes: { ogm: { locn_geometry: 'ENVELOPE(-100,-90,50,40)' } },
} as GeoDocument;
describe('Bookmarks map', () => {
  beforeEach(() => {
    instances.length = 0;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      }
    );
  });
  it('draws resource footprints and fits their extent', () => {
    const view = render(
      <MemoryRouter>
        <MapProvider>
          <MapView results={[result]} />
        </MapProvider>
      </MemoryRouter>
    );
    const map = instances.at(-1)!;
    act(() => map.styleLoaded());
    expect(
      map.getSource('discovery-bookmark-results').data.features
    ).toHaveLength(1);
    expect(map.fitBounds).toHaveBeenCalledWith(
      [
        [-100, 40],
        [-90, 50],
      ],
      expect.any(Object)
    );
    expect(view.container.querySelector('.sticky')).toBeInTheDocument();
  });
  it('cleans up on navigation', () => {
    const view = render(
      <MemoryRouter>
        <MapProvider>
          <MapView results={[]} />
        </MapProvider>
      </MemoryRouter>
    );
    const map = instances.at(-1)!;
    view.unmount();
    expect(map.remove).toHaveBeenCalledOnce();
  });
});
