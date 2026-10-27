import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('maplibre-gl', () => import('../../helpers/maplibre'));
import { instances } from '../../helpers/maplibre';
import { MapProvider } from '../../../context/MapContext';
import {
  MapResultView,
  spiderOffsets,
} from '../../../components/search/MapResultView.client';
import type { GeoDocument } from '../../../types/api';
const result = (id: string): GeoDocument => ({
  id,
  type: 'resource',
  attributes: {
    ogm: {
      id,
      dct_title_s: `Map ${id}`,
      dcat_centroid: '40,-90',
      dcat_bbox: 'ENVELOPE(-100,-80,50,30)',
    },
  },
});
const setup = (results: GeoDocument[], start = 1) =>
  render(
    <MemoryRouter>
      <MapProvider>
        <MapResultView results={results} resultStartIndex={start} />
      </MapProvider>
    </MemoryRouter>
  );
describe('Results map', () => {
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
  it('numbers pins using the page offset and fits full footprints', () => {
    setup([result('one')], 11);
    expect(
      screen.getByRole('button', { name: 'Result 11: Map one' })
    ).toHaveTextContent('11');
    expect(instances.at(-1)!.fitBounds).toHaveBeenCalledWith(
      [
        [-100, 30],
        [-80, 50],
      ],
      expect.any(Object)
    );
  });
  it('expands overlapping pins and keeps each record selectable', () => {
    setup([result('one'), result('two')]);
    const map = instances.at(-1)!;
    act(() => map.styleLoaded());
    fireEvent.click(screen.getByRole('button', { name: 'Result 1: Map one' }));
    expect(
      map.getSource('discovery-pin-connectors').data.features
    ).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: 'Result 2: Map two' }));
    expect(screen.getByRole('link', { name: 'View Details' })).toHaveAttribute(
      'href',
      '/#/resources/two'
    );
  });
  it('derives a pin from geometry if centroid is missing', () => {
    const r = result('one');
    delete r.attributes.ogm.dcat_centroid;
    r.attributes.ogm.locn_geometry = 'ENVELOPE(-100,-80,50,30)';
    setup([r]);
    expect(
      screen.getByRole('button', { name: 'Result 1: Map one' })
    ).toBeInTheDocument();
  });
  it('shows an accessible empty state', () => {
    setup([]);
    expect(screen.getByRole('status')).toHaveTextContent('No mappable results');
  });
  it('uses distinct circle and spiral positions for crowded records', () => {
    for (const count of [2, 8, 20])
      expect(new Set(spiderOffsets(count).map((p) => p.join(','))).size).toBe(
        count
      );
  });
});
