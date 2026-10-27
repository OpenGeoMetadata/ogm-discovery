import { act, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('maplibre-gl', () => import('../../helpers/maplibre'));
import { instances } from '../../helpers/maplibre';
import { MapLibreMap } from '../../../components/map/MapLibreMap';
import { GeometryLayer } from '../../../components/map/GeometryLayer';
import { boundsPolygon } from '../../../utils/mapGeometry';
import { EMPTY_STYLE } from '../../../config/basemaps';
describe('MapLibre lifecycle and basemap resilience', () => {
  beforeEach(() => {
    instances.length = 0;
    document.cookie = 'preferred_basemap=; max-age=0; path=/';
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      }
    );
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  it('restores data after switching style and keeps saved preference during fallback', () => {
    render(
      <MapLibreMap>
        <GeometryLayer
          id="test"
          data={boundsPolygon([
            [1, 2],
            [3, 4],
          ])}
        />
      </MapLibreMap>
    );
    const map = instances.at(-1)!;
    act(() => map.styleLoaded());
    expect(map.getSource('discovery-test')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Basemap' }));
    fireEvent.click(
      screen.getByRole('radio', { name: 'OpenFreeMap Positron' })
    );
    expect(map.setStyle).toHaveBeenLastCalledWith(
      'https://tiles.openfreemap.org/styles/positron',
      { diff: false }
    );
    act(() => map.fire('error', { error: new Error('style failed') }));
    expect(map.setStyle).toHaveBeenLastCalledWith(
      'https://tiles.openfreemap.org/styles/liberty',
      { diff: false }
    );
    expect(document.cookie).toContain('preferred_basemap=openFreeMapPositron');
    act(() => map.styleLoaded());
    expect(map.getSource('discovery-test')).toBeTruthy();
  });
  it('ignores overlay errors; requires three distinct basemap tile failures', () => {
    render(<MapLibreMap />);
    const map = instances.at(-1)!;
    map.sources.base = {};
    act(() => map.styleLoaded());
    act(() =>
      map.fire('error', {
        sourceId: 'discovery-hexes',
        error: new Error('overlay'),
      })
    );
    expect(map.setStyle).toHaveBeenCalledTimes(1);
    act(() => {
      for (let i = 0; i < 3; i++)
        map.fire('error', {
          sourceId: 'base',
          tile: { tileID: { key: 1 } },
          error: new Error('tile'),
        });
    });
    expect(map.setStyle).toHaveBeenCalledTimes(1);
    act(() => {
      for (const key of [2, 3])
        map.fire('error', {
          sourceId: 'base',
          tile: { tileID: { key } },
          error: new Error('tile'),
        });
    });
    expect(map.setStyle).toHaveBeenCalledTimes(2);
  });
  it('times out once per provider, retains overlays on empty style, and retries', () => {
    vi.useFakeTimers();
    render(<MapLibreMap />);
    const map = instances.at(-1)!;
    act(() => vi.advanceTimersByTime(30000));
    expect(map.setStyle).toHaveBeenLastCalledWith(EMPTY_STYLE, { diff: false });
    expect(screen.getByText(/Basemaps are unavailable/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry basemap' }));
    expect(map.setStyle).toHaveBeenLastCalledWith(
      'https://tiles.openfreemap.org/styles/liberty',
      { diff: false }
    );
  });
  it.each(['maptoolkitLight', 'maptoolkitStreet', 'esriWorldImagery'])(
    'migrates retired preference %s to OpenFreeMap',
    (preference) => {
      document.cookie = `preferred_basemap=${preference}; path=/`;
      render(<MapLibreMap />);
      expect(instances.at(-1)!.setStyle).toHaveBeenLastCalledWith(
        'https://tiles.openfreemap.org/styles/liberty',
        { diff: false }
      );
      fireEvent.click(screen.getByRole('button', { name: 'Basemap' }));
      expect(
        screen.getByRole('radio', { name: 'OpenFreeMap Liberty' })
      ).toBeChecked();
    }
  );
  it('opens compact radio choices and dismisses with Escape, blur, or outside press', () => {
    render(<MapLibreMap />);
    const button = screen.getByRole('button', { name: 'Basemap' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    fireEvent.click(button);
    const radio = screen.getByRole('radio', { name: 'OpenFreeMap Liberty' });
    radio.focus();
    fireEvent.keyDown(radio, { key: 'Escape' });
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    fireEvent.click(button);
    fireEvent.blur(button, { relatedTarget: document.body });
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });
  it('cleans up every StrictMode instance', () => {
    const view = render(
      <StrictMode>
        <MapLibreMap />
      </StrictMode>
    );
    view.unmount();
    expect(instances).toHaveLength(2);
    for (const map of instances) expect(map.remove).toHaveBeenCalledOnce();
  });
});
