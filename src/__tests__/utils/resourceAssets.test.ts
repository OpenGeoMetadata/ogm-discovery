import { describe, expect, it } from 'vitest';
import {
  getResultPrimaryImageUrl,
  getResultStaticMapUrl,
} from '../../utils/resourceAssets';
import type { GeoDocument } from '../../types/api';

function resultWithUi(ui: Record<string, string | undefined>) {
  return {
    id: 'resource-1',
    meta: { ui },
  } as Pick<GeoDocument, 'id' | 'meta'>;
}

describe('getResultPrimaryImageUrl', () => {
  it('uses the hot resource-class icon for cold generic gallery thumbnails', () => {
    const result = resultWithUi({
      thumbnail_url: '/api/v1/resources/resource-1/thumbnail',
      resource_class_icon_url:
        '/api/v1/static-maps/resource-1/resource-class-icon',
    });

    expect(getResultPrimaryImageUrl(result, 'gallery')).toMatch(
      /\/static-maps\/resource-1\/resource-class-icon$/
    );
  });

  it('uses the inline gallery fallback when no hot icon exists', () => {
    const result = resultWithUi({
      thumbnail_url: '/api/v1/resources/resource-1/thumbnail',
    });

    expect(getResultPrimaryImageUrl(result, 'gallery')).toBeUndefined();
  });

  it('uses the hot resource-class icon for bridge-backed gallery assets', () => {
    const result = resultWithUi({
      thumbnail_url:
        'https://geobtaa-assets-prod.s3.us-east-2.amazonaws.com/store/asset/example/thumb.jpg',
      resource_class_icon_url:
        '/api/v1/static-maps/resource-1/resource-class-icon',
    });

    expect(getResultPrimaryImageUrl(result, 'gallery')).toMatch(
      /\/static-maps\/resource-1\/resource-class-icon$/
    );
  });

  it('keeps generated thumbnail fallback for non-gallery contexts', () => {
    const result = resultWithUi({
      thumbnail_url: '/api/v1/resources/resource-1/thumbnail',
      resource_class_icon_url:
        '/api/v1/static-maps/resource-1/resource-class-icon',
    });

    expect(getResultPrimaryImageUrl(result, 'list')).toMatch(
      /\/thumbnails\/resource-1$/
    );
  });
});

describe('native resource geography', () => {
  it('bypasses stale immutable API map hashes', () => {
    expect(
      getResultStaticMapUrl(
        resultWithUi({
          static_map: '/api/v1/static-map-assets/' + 'a'.repeat(64),
        })
      )
    ).toMatch(/resource-1\/geometry\/native\?size=thumbnail$/);
  });
  it('keeps externally supplied maps', () => {
    expect(
      getResultStaticMapUrl(
        resultWithUi({ static_map: 'https://institution.edu/map.png' })
      )
    ).toBe('https://institution.edu/map.png');
  });
});
