import type { Map as GLMap } from 'maplibre-gl';
import type { GazetteerResponse } from '../../../types/api';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
vi.mock('../../../services/api', () => ({ fetchNominatimSearch: vi.fn() }));
vi.mock('maplibre-gl', () => import('../../helpers/maplibre'));
import { Map } from '../../helpers/maplibre';
import { MapLibreContext } from '../../../context/MapLibreContext';
import { MapGeosearchControl } from '../../../components/map/MapGeosearchControl';
import { fetchNominatimSearch } from '../../../services/api';
describe('Map place search', () => {
  it('fits a selected place using longitude-first coordinates and exposes its geometry', async () => {
    const map = new Map({ container: document.body });
    const selected = vi.fn();
    vi.mocked(fetchNominatimSearch).mockResolvedValue({
      data: [
        {
          id: 'place',
          attributes: {
            name: 'Madison',
            display_name: 'Madison, Wisconsin',
            min_latitude: 42,
            max_latitude: 44,
            min_longitude: -90,
            max_longitude: -88,
          },
        },
      ],
    } as unknown as GazetteerResponse);
    render(
      <MapLibreContext.Provider value={map as unknown as GLMap}>
        <MapGeosearchControl onPlaceSelect={selected} />
      </MapLibreContext.Provider>
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Search places on map' })
    );
    fireEvent.change(screen.getByPlaceholderText('Search places'), {
      target: { value: 'Madison' },
    });
    await waitFor(() =>
      expect(screen.getByText('Madison, Wisconsin')).toBeInTheDocument()
    );
    fireEvent.click(screen.getByText('Madison, Wisconsin'));
    expect(map.fitBounds).toHaveBeenCalledWith(
      [
        [-90, 42],
        [-88, 44],
      ],
      { padding: 24, maxZoom: 11 }
    );
    expect(selected).toHaveBeenCalled();
  });
});
