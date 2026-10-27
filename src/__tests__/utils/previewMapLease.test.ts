import { describe, expect, it } from 'vitest';
import type { Map as GLMap } from 'maplibre-gl';
import { Map } from '../helpers/maplibre';
import { previewMapLease } from '../../utils/previewMapLease';
import { EMPTY_GEOJSON } from '../../utils/mapGeometry';
describe('Preview adapter lifetime', () => {
  it('prevents late protocol responses from touching a replacement record', () => {
    const native = new Map({ container: document.createElement('div') });
    const old = previewMapLease(native as unknown as GLMap);
    old.map.addSource('preview', { type: 'geojson', data: EMPTY_GEOJSON });
    old.map.addLayer({ id: 'preview', source: 'preview', type: 'fill' });
    old.dispose();
    expect(native.getSource('preview')).toBeUndefined();
    const next = previewMapLease(native as unknown as GLMap);
    next.map.addSource('preview', { type: 'geojson', data: EMPTY_GEOJSON });
    old.map.addLayer({ id: 'obsolete', source: 'preview', type: 'fill' });
    old.map.removeSource('preview');
    expect(native.getLayer('obsolete')).toBeUndefined();
    expect(native.getSource('preview')).toBeTruthy();
  });
});
