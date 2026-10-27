import type { Map as GLMap } from 'maplibre-gl';
import type { FeaturedMapCameraConfig } from '../../../config/featured';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('maplibre-gl', () => import('../../helpers/maplibre'));
import { Map } from '../../helpers/maplibre';
import { MapLibreContext } from '../../../context/MapLibreContext';
import { FeaturedMapController } from '../../../components/home/FeaturedMapController';
import type { GeoDocumentDetails } from '../../../types/api';
const detail = {
  id: 'one',
  attributes: { ogm: { dcat_bbox: 'ENVELOPE(-10,10,50,30)' } },
} as GeoDocumentDetails;
let map: Map;
const setup = (camera?: FeaturedMapCameraConfig, record = detail) =>
  render(
    <MapLibreContext.Provider value={map as unknown as GLMap}>
      <FeaturedMapController
        activeIndex={0}
        featuredDetails={[record]}
        featuredCamera={camera}
        featuredInitiated
        programmaticFlyRef={{ current: false }}
      />
    </MapLibreContext.Provider>
  );
describe('Featured camera', () => {
  beforeEach(() => {
    map = new Map({ container: document.createElement('div') });
  });
  it('converts configured center and zoom once', () => {
    setup({ mode: 'flyTo', center: [40, -90], zoom: 6 });
    expect(map.flyTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: [-90, 40], zoom: 5 })
    );
  });
  it('fits the footprint with existing padding', () => {
    setup();
    expect(map.fitBounds).toHaveBeenCalledWith(
      [
        [-10, 30],
        [10, 50],
      ],
      expect.objectContaining({ maxZoom: 9 })
    );
  });
  it('uses home when the footprint is missing', () => {
    setup(undefined, {
      ...detail,
      attributes: { ogm: {} },
    } as GeoDocumentDetails);
    expect(map.flyTo).toHaveBeenCalledWith(
      expect.objectContaining({ center: [-80, 44], zoom: 2 })
    );
  });
  it('applies offset and configured minimum zoom', () => {
    setup({ mode: 'flyTo', minZoom: 7, verticalOffsetPx: 80 });
    expect(map.flyTo).toHaveBeenCalledWith(
      expect.objectContaining({ zoom: 6, offset: [0, -80] })
    );
  });
});
