import { expect, it } from 'vitest';
import { getThemeConfig } from '../../config/institution';

it('queries the OGM catalog for the Madison collection harvested from BTAA', () => {
  const { api } = getThemeConfig('uwmadison');
  expect(api.base_url).toBe('https://ogm.geo4lib.app/api/v1/');
  expect(api.default_query_params).toEqual([
    'include_filters[ogm_repo][]=btaa-api.uwmadison',
    'include_filters[schema_provider_s][]=University of Wisconsin-Madison',
  ]);
});
