import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  fetchBookmarkedResources,
  fetchFeaturedResourcePreview,
  fetchGazetteerSearch,
  fetchHomeBlogPosts,
  fetchNominatimSearch,
  fetchResourceDetails,
  fetchResourceJson,
  fetchSuggestions,
  getApiBasePath,
  getVisitToken,
} from '../../services/api';

const theme = vi.hoisted(() => ({
  api: {
    base_url: 'http://localhost:3000/api/v1',
    public_api_key: ' public-key ',
    client_name: 'test-viewer',
    default_query_params: ['', 'scope=maps', 'scope=maps', 'scope=data'],
  },
}));
vi.mock('../../config/institution', () => ({
  getActiveThemeConfig: () => theme,
}));
vi.unmock('../../services/api');

const fetchMock = vi.fn<typeof fetch>();
const response = (body: unknown) =>
  ({ ok: true, json: async () => body }) as Response;

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue(response({ data: [] }));
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('VITE_ENFORCE_HTTPS', 'false');
  vi.stubEnv('VITE_TURNSTILE_ENABLED', 'false');
  theme.api.base_url = 'http://localhost:3000/api/v1';
  sessionStorage.clear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('API request boundaries', () => {
  it('reuses a visit token and sends analytics only to the same origin', async () => {
    const token = getVisitToken();
    expect(token).toBeTruthy();
    expect(getVisitToken()).toBe(token);
    await fetchResourceJson('same-origin');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      credentials: 'same-origin',
      headers: {
        Authorization: 'Bearer public-key',
        'X-Visit-Token': token,
        'X-BTAA-Client-Name': 'test-viewer-web',
      },
    });
    expect(
      new URL(String(fetchMock.mock.calls[0][0])).searchParams.getAll('scope')
    ).toEqual(['maps', 'data']);

    theme.api.base_url = 'https://api.example.org/v1';
    await fetchResourceJson('cross-origin');
    const options = fetchMock.mock.calls[1][1];
    expect(options?.credentials).toBe('omit');
    expect(options?.headers).not.toHaveProperty('X-Visit-Token');
    expect(options?.headers).not.toHaveProperty('X-BTAA-Client-Name');
  });

  it('keeps API requests usable when browser storage is blocked', async () => {
    vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new Error('Storage blocked');
    });
    expect(getVisitToken()).toBeUndefined();
    await expect(fetchResourceJson('blocked-storage')).resolves.toEqual({
      data: [],
    });
  });

  it('supports visit tokens without randomUUID', () => {
    vi.stubGlobal('crypto', {});
    expect(getVisitToken()).toMatch(/^visit-\d+-/);
  });

  it('adds server analytics without using browser storage', async () => {
    vi.stubGlobal('window', undefined);
    expect(getVisitToken()).toBeUndefined();
    await fetchResourceJson('server');
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({
      'X-BTAA-Client-Name': 'test-viewer-ssr',
      'X-BTAA-Client-Channel': 'ssr',
    });
  });

  it('honors HTTPS enforcement and the environment API fallback', async () => {
    theme.api.base_url = '';
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.example.org/v1');
    vi.stubEnv('VITE_ENFORCE_HTTPS', 'true');
    expect(getApiBasePath()).toBe('http://api.example.org/v1');
    await fetchResourceJson('https');
    expect(new URL(String(fetchMock.mock.calls[0][0])).origin).toBe(
      'https://api.example.org'
    );
  });

  it('deduplicates in-flight requests and permits a subsequent refresh', async () => {
    let resolve!: (value: Response) => void;
    fetchMock.mockReturnValueOnce(
      new Promise((done) => {
        resolve = done;
      })
    );
    const first = fetchResourceJson('shared');
    const second = fetchResourceJson('shared');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolve(response({ data: { id: 'shared' } }));
    expect(await first).toEqual(await second);
    await fetchResourceJson('shared');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([
    [
      'plain upstream failure',
      'HTTP error 503 Unavailable: plain upstream failure',
    ],
    ['', 'HTTP error 503 Unavailable'],
    ['[]', 'HTTP error 503 Unavailable: []'],
    ['{"errors":[{"title":"Unavailable","code":"busy"}]}', 'Unavailable'],
  ])('preserves HTTP error context for %s', async (body, message) => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Unavailable',
      text: async () => body,
    } as Response);
    await expect(fetchResourceJson('error')).rejects.toMatchObject({
      name: 'ApiError',
      status: 503,
      message,
    });
  });

  it.each([
    fetchResourceDetails,
    fetchResourceJson,
    fetchFeaturedResourcePreview,
  ])('%s wraps network failures and preserves API errors', async (request) => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await expect(request('offline')).rejects.toThrow(
      /Failed to fetch .*offline/
    );
    const apiError = new ApiError('Not found', 404);
    fetchMock.mockRejectedValueOnce(apiError);
    await expect(request('missing')).rejects.toBe(apiError);
  });

  it('preserves non-enumerable thumbnails for router serialization', async () => {
    const ui = Object.defineProperty({}, 'thumbnail_url', {
      value: 'https://example.org/thumb.png',
      configurable: true,
    });
    fetchMock.mockResolvedValue(
      response({ data: [{ id: 'map', meta: { ui } }] })
    );
    const result = await fetchBookmarkedResources(['map']);
    expect(
      JSON.parse(JSON.stringify(result)).data[0].meta.ui.thumbnail_url
    ).toBe('https://example.org/thumb.png');
  });
});

describe('discovery endpoints', () => {
  it('does not request empty suggestions, places, or bookmarks', async () => {
    expect(await fetchSuggestions('  ')).toEqual([]);
    expect(await fetchBookmarkedResources([])).toMatchObject({
      data: [],
      meta: { totalCount: 0 },
    });
    expect(await fetchGazetteerSearch(' ', 5)).toMatchObject({
      data: [],
      meta: { perPage: 5 },
    });
    expect(await fetchNominatimSearch(' ', 100)).toMatchObject({
      data: [],
      meta: { perPage: 10 },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('encodes suggestions and degrades gracefully when unavailable', async () => {
    const suggestions = [
      {
        type: 'suggestion',
        id: '1',
        attributes: { text: 'Maps & lakes', score: 2 },
      },
    ];
    fetchMock.mockResolvedValueOnce(response({ data: suggestions }));
    expect(await fetchSuggestions('Maps & lakes')).toEqual(suggestions);
    expect(
      new URL(String(fetchMock.mock.calls[0][0])).searchParams.get('q')
    ).toBe('Maps & lakes');
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    expect(await fetchSuggestions('maps')).toEqual([]);
  });

  it('forwards gazetteer pagination and normalizes Nominatim queries and limits', async () => {
    await fetchGazetteerSearch('Madison', 5, 10);
    const wof = new URL(String(fetchMock.mock.calls[0][0]));
    expect(wof.pathname).toBe('/api/v1/gazetteers/wof/search');
    expect(wof.searchParams.get('offset')).toBe('10');
    expect(wof.searchParams.get('limit')).toBe('5');
    await fetchNominatimSearch('  New   York  ', 20);
    const nominatim = new URL(String(fetchMock.mock.calls[1][0]));
    expect(nominatim.pathname).toBe('/api/v1/gazetteers/nominatim/search');
    expect(nominatim.searchParams.get('q')).toBe('New York');
    expect(nominatim.searchParams.get('limit')).toBe('10');
  });

  it.each([fetchGazetteerSearch, fetchNominatimSearch])(
    'reports %s failures',
    async (request) => {
      fetchMock.mockRejectedValue(new Error('offline'));
      await expect(request('Madison')).rejects.toBeInstanceOf(ApiError);
    }
  );

  it('rejects malformed bookmark responses', async () => {
    fetchMock.mockResolvedValue(response({ data: {} }));
    await expect(fetchBookmarkedResources(['map'])).rejects.toThrow(
      'Invalid response format'
    );
    fetchMock.mockRejectedValueOnce(null);
    await expect(fetchBookmarkedResources(['map'])).rejects.toThrow(
      'Failed to fetch bookmarked resources'
    );
  });

  it('forwards pinned blog slugs and reports upstream failures', async () => {
    await fetchHomeBlogPosts({
      tag: 'maps',
      pinnedSlugs: ['first', '', 'second'],
    });
    const url = new URL(String(fetchMock.mock.calls[0][0]));
    expect(url.searchParams.get('tag')).toBe('maps');
    expect(url.searchParams.getAll('pinned_slugs')).toEqual([
      'first',
      'second',
    ]);
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    await expect(fetchHomeBlogPosts()).rejects.toThrow(
      'Home blog request failed: offline'
    );
  });
});

describe('opt-in JSONP transport', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    const append = document.head.appendChild.bind(document.head);
    vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      // Exercise DOM cleanup without loading or executing a remote script.
      if (node instanceof HTMLScriptElement) node.type = 'application/json';
      return append(node);
    });
  });

  function pendingScript() {
    const script = document.head.querySelector<HTMLScriptElement>(
      'script[src*="callback="]'
    )!;
    expect(script).not.toBeNull();
    const callback = new URL(script.src).searchParams.get('callback')!;
    const invoke = (
      window as unknown as Record<string, (data: unknown) => void>
    )[callback];
    return { script, callback, invoke };
  }

  it('deduplicates callbacks, cleans up the DOM, and expires successful cache entries', async () => {
    const first = fetchResourceJson('jsonp-success', undefined, {
      useJsonp: true,
    });
    const second = fetchResourceJson('jsonp-success', undefined, {
      useJsonp: true,
    });
    const { script, callback, invoke } = pendingScript();
    expect(
      document.head.querySelectorAll('script[src*="callback="]')
    ).toHaveLength(1);
    invoke({ data: { id: 'map' } });
    expect(await first).toEqual(await second);
    expect(script.isConnected).toBe(false);
    expect(window).not.toHaveProperty(callback);
    await vi.advanceTimersByTimeAsync(5000);
    const refreshed = fetchResourceJson('jsonp-success', undefined, {
      useJsonp: true,
    });
    pendingScript().invoke({ data: { id: 'refreshed' } });
    expect(await refreshed).toMatchObject({ data: { id: 'refreshed' } });
    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['response', 'script', 'timeout'])(
    'cleans up after a %s failure and allows retry',
    async (failure) => {
      const request = fetchResourceJson(`jsonp-${failure}`, undefined, {
        useJsonp: true,
      });
      const rejection = expect(request).rejects.toBeInstanceOf(ApiError);
      const { script, callback, invoke } = pendingScript();
      if (failure === 'response') invoke({ detail: 'Not found' });
      else if (failure === 'script') script.dispatchEvent(new Event('error'));
      else await vi.advanceTimersByTimeAsync(30000);
      await rejection;
      expect(script.isConnected).toBe(false);
      expect(window).not.toHaveProperty(callback);
      const retry = fetchResourceJson(`jsonp-${failure}`, undefined, {
        useJsonp: true,
      });
      pendingScript().invoke({ data: [] });
      expect(await retry).toEqual({ data: [] });
      await vi.advanceTimersByTimeAsync(5000);
    }
  );
});
