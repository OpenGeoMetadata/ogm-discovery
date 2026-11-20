import { expect, it } from 'vitest';
import { getThemeConfig } from '../../config/institution';

it('queries the OGM catalog for Madison-provided geobtaa records', () => {
  const { api } = getThemeConfig('uwmadison');
  expect(api.base_url).toBe('https://ogm.geo4lib.app/api/v1/');
  expect(api.default_query_params).toEqual([
    'include_filters[ogm_repo][]=geobtaa',
    'include_filters[schema_provider_s][]=University of Wisconsin-Madison',
  ]);
});
