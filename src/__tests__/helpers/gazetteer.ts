import type {
  GazetteerPlace,
  GazetteerPlaceAttributes,
  GazetteerResponse,
} from '../../types/api';

export function gazetteerResponse(
  data: GazetteerPlace[] = []
): GazetteerResponse {
  return {
    jsonapi: { version: '1.0', profile: [] },
    links: { self: '/api/v1/gazetteer' },
    meta: {
      totalCount: data.length,
      totalPages: 1,
      currentPage: 1,
      perPage: 10,
      query: '',
      offset: 0,
      gazetteer: 'test',
    },
    data,
  };
}

export function gazetteerPlace(
  attributes: Partial<GazetteerPlaceAttributes>
): GazetteerPlace {
  return {
    id: 'osm-1',
    type: 'gazetteer_place',
    attributes: {
      id: 1,
      wok_id: 1,
      parent_id: 0,
      name: 'Minneapolis',
      placetype: 'city',
      country: 'US',
      repo: 'test',
      latitude: 44.98,
      longitude: -93.27,
      min_latitude: 44.8,
      max_latitude: 45.1,
      min_longitude: -93.4,
      max_longitude: -93.1,
      is_current: 1,
      is_deprecated: 0,
      is_ceased: 0,
      is_superseded: 0,
      is_superseding: 0,
      superseded_by: null,
      supersedes: null,
      lastmodified: 0,
      created_at: '',
      updated_at: '',
      ...attributes,
    },
  };
}
