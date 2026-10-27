import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Map as GLMap } from 'maplibre-gl';
import type { GeoDocumentDetails } from '../../../types/api';
vi.mock('maplibre-gl', () => import('../../helpers/maplibre'));
const { factory } = vi.hoisted(() => ({ factory: vi.fn() }));
vi.mock('ogm-viewer/lib', () => ({
  OgmRecord: class {},
  resourcesFor: () => [],
  previewersForResources: factory,
  MapLibreTheme: class {
    getStyle() {
      return {};
    }
  },
}));
import { Map } from '../../helpers/maplibre';
import { MapLibreContext } from '../../../context/MapLibreContext';
import { FeaturedItemPreviewLayer } from '../../../components/home/FeaturedItemPreviewLayer';
const detail = {
  id: 'one',
  attributes: { ogm: { id: 'one' } },
} as GeoDocumentDetails;
describe('Featured preview lifecycle', () => {
  beforeEach(() => factory.mockReset());
  it('waits for a loaded style and does not restart the preview on every idle', async () => {
    const native = new Map({ container: document.createElement('div') });
    native.loaded = false;
    const previewer = {
      renderer: 'map',
      kind: 'wms',
      layerIds: [],
      attach: vi.fn(),
      preview: vi.fn().mockResolvedValue(undefined),
      clearPreview: vi.fn().mockResolvedValue(undefined),
    };
    factory.mockResolvedValue([previewer]);
    const view = render(
      <MapLibreContext.Provider value={native as unknown as GLMap}>
        <FeaturedItemPreviewLayer
          activeIndex={0}
          featuredDetails={[detail]}
          featuredInitiated
        />
      </MapLibreContext.Provider>
    );
    expect(factory).not.toHaveBeenCalled();
    native.loaded = true;
    await act(async () => native.fire('idle'));
    await waitFor(() => expect(previewer.preview).toHaveBeenCalledTimes(1));
    await act(async () => native.fire('idle'));
    expect(previewer.preview).toHaveBeenCalledTimes(1);
    await act(async () => {
      native.fire('discovery:stylechanging');
      native.setStyle();
      native.styleLoaded();
    });
    await waitFor(() => expect(previewer.preview).toHaveBeenCalledTimes(2));
    view.unmount();
  });
  it('does not attach a late protocol response after navigation', async () => {
    const native = new Map({ container: document.createElement('div') });
    let release!: () => void;
    let attached!: GLMap;
    const ready = new Promise<void>((resolve) => {
      release = resolve;
    });
    const previewer = {
      renderer: 'map',
      kind: 'wms',
      layerIds: ['imagery'],
      attach: (map: GLMap) => {
        attached = map;
      },
      clearPreview: vi.fn().mockResolvedValue(undefined),
      preview: async () => {
        await ready;
        attached.addSource('imagery', {
          type: 'raster',
          tiles: ['https://example.com/{z}/{x}/{y}'],
        });
        attached.addLayer({ id: 'imagery', type: 'raster', source: 'imagery' });
      },
    };
    factory.mockResolvedValue([previewer]);
    const view = render(
      <MapLibreContext.Provider value={native as unknown as GLMap}>
        <FeaturedItemPreviewLayer
          activeIndex={0}
          featuredDetails={[detail]}
          featuredInitiated
        />
      </MapLibreContext.Provider>
    );
    await waitFor(() => expect(attached).toBeTruthy());
    // A style replacement must revoke pending work immediately, before style.load.
    await act(async () => {
      native.fire('discovery:stylechanging');
      native.setStyle();
    });
    await act(async () => release());
    view.unmount();
    expect(native.getSource('imagery')).toBeUndefined();
    expect(native.getLayer('imagery')).toBeUndefined();
  });
});
