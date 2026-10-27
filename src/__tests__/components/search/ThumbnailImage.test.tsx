import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserRouter } from 'react-router';
import { ThumbnailImage } from '../../../components/search/ThumbnailImage';
import { SearchResults } from '../../../components/SearchResults';
import { GalleryView } from '../../../components/search/GalleryView';
import { SimilarItemsCarousel } from '../../../components/resource/SimilarItemsCarousel';
import { getApiBasePath } from '../../../services/api';

vi.mock('../../../context/BookmarkContext', () => ({
  useBookmarks: () => ({ isBookmarked: () => false }),
}));
vi.mock('../../../components/BookmarkButton', () => ({
  BookmarkButton: () => null,
}));
vi.mock('../../../context/DebugContext', () => ({
  useDebug: () => ({ showDetails: false }),
}));
vi.mock('../../../context/MapContext', () => ({ useMap: () => ({}) }));
vi.mock('../../../components/search/StaticResultMap', () => ({
  StaticResultMap: () => null,
}));

const ready = () =>
  new Response('image', { headers: { 'Content-Type': 'image/png' } });
const placeholder = (
  headers: Record<string, string> = {},
  text = 'Thumbnail unavailable'
) =>
  new Response(
    `<svg xmlns="http://www.w3.org/2000/svg"><text>${text}</text></svg>`,
    {
      headers: { 'Content-Type': 'image/svg+xml', ...headers },
    }
  );
const fallback = <svg data-testid="resource-icon" aria-hidden="true" />;
const flush = () =>
  act(async () => {
    await Promise.resolve();
  });
const resolver =
  'https://api.example.edu/api/v1/resources/map/thumbnail?variant=icon-gradient';

describe('ThumbnailImage', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:ready');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it.each<Record<string, string>>([{}, { 'X-Placeholder': 'true' }])(
    'replaces successful unavailable SVGs with icons, including hidden CORS headers (%j)',
    async (headers) => {
      fetchMock.mockResolvedValue(placeholder(headers));
      const { container } = render(
        <ThumbnailImage
          resourceId="map"
          src={resolver}
          alt=""
          fallback={fallback}
        />
      );
      await flush();
      expect(screen.getByTestId('resource-icon')).toBeInTheDocument();
      expect(container.querySelector('img')).toBeNull();
      expect(URL.createObjectURL).not.toHaveBeenCalled();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(120000);
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        resolver,
        expect.objectContaining({ cache: 'no-store' })
      );
    }
  );

  it('replaces pending icons with completed thumbnails without refreshing', async () => {
    fetchMock
      .mockResolvedValueOnce(
        placeholder(
          { 'X-Placeholder': 'true', 'X-Thumbnail-Pending': 'true' },
          ''
        )
      )
      .mockResolvedValueOnce(ready());
    const { container, unmount } = render(
      <ThumbnailImage
        resourceId="map"
        src={resolver}
        alt=""
        fallback={fallback}
      />
    );
    await flush();
    expect(screen.getByTestId('resource-icon')).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(container.querySelector('img')).toHaveAttribute('src', 'blob:ready');
    expect(screen.queryByTestId('resource-icon')).not.toBeInTheDocument();
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:ready');
  });

  it('keeps immutable images on the normal image path and recovers failures through the configured API', async () => {
    vi.mocked(getApiBasePath).mockReturnValueOnce(
      'https://api.example.edu/api/v1'
    );
    fetchMock.mockResolvedValue(placeholder());
    const { container } = render(
      <ThumbnailImage
        resourceId="map:1"
        src="https://api.example.edu/api/v1/thumbnails/hash"
        alt=""
        fallback={fallback}
      />
    );
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.error(container.querySelector('img')!);
    await flush();
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.edu/api/v1/resources/map%3A1/thumbnail?variant=icon-gradient',
      expect.any(Object)
    );
    expect(screen.getByTestId('resource-icon')).toBeInTheDocument();
  });

  it('ignores stale responses after a card changes resources', async () => {
    let finishOld!: (response: Response) => void;
    fetchMock
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishOld = resolve;
          })
      )
      .mockResolvedValueOnce(ready());
    const { container, rerender } = render(
      <ThumbnailImage
        resourceId="old"
        src="/api/v1/resources/old/thumbnail"
        alt=""
        fallback={fallback}
      />
    );
    rerender(
      <ThumbnailImage
        resourceId="new"
        src="/api/v1/resources/new/thumbnail"
        alt=""
        fallback={fallback}
      />
    );
    await flush();
    await act(async () => finishOld(placeholder()));
    expect(container.querySelector('img')).toHaveAttribute('src', 'blob:ready');
  });

  it('bounds retries and cancels timers when unmounted', async () => {
    fetchMock.mockImplementation(async () =>
      placeholder(
        { 'X-Placeholder': 'true', 'X-Thumbnail-Pending': 'true' },
        ''
      )
    );
    const { unmount } = render(
      <ThumbnailImage
        resourceId="map"
        src={resolver}
        alt=""
        fallback={fallback}
      />
    );
    await flush();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(12);
    expect(screen.getByTestId('resource-icon')).toBeInTheDocument();
    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(12);
  });

  it('aborts in-flight work on unmount', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}));
    const { unmount } = render(
      <ThumbnailImage
        resourceId="map"
        src={resolver}
        alt=""
        fallback={fallback}
      />
    );
    const signal = fetchMock.mock.calls[0][1].signal;
    unmount();
    expect(signal.aborted).toBe(true);
  });
  it('uses the gallery icon when the generated icon endpoint returns an unavailable SVG', async () => {
    fetchMock.mockResolvedValue(placeholder());
    render(
      <BrowserRouter>
        <GalleryView
          results={[
            {
              id: 'restricted-map',
              type: 'resource',
              attributes: {
                ogm: {
                  id: 'restricted-map',
                  dct_title_s: 'Saidabad',
                  gbl_resourceClass_sm: ['Maps'],
                },
              },
              meta: {
                ui: {
                  resource_class_icon_url:
                    '/api/v1/static-maps/restricted-map/resource-class-icon',
                },
              },
            },
          ]}
          isLoading={false}
          totalResults={1}
          currentPage={1}
        />
      </BrowserRouter>
    );
    await flush();
    expect(
      screen.getByTestId('gallery-thumbnail-placeholder-0').querySelector('svg')
    ).not.toBeNull();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
  it('uses the resource icon for unavailable related-item thumbnails', async () => {
    fetchMock.mockResolvedValue(placeholder());
    const { container } = render(
      <BrowserRouter>
        <SimilarItemsCarousel
          similarItems={[
            {
              id: 'restricted-map',
              type: 'resource',
              attributes: {
                ogm: {
                  id: 'restricted-map',
                  dct_title_s: 'Saidabad',
                  gbl_resourceClass_sm: ['Maps'],
                },
              },
            },
          ]}
        />
      </BrowserRouter>
    );
    await flush();
    expect(container.querySelector('a img')).toBeNull();
    expect(container.querySelector('a svg')).not.toBeNull();
  });

  it('falls back after repeated network or non-image responses', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html>Gateway error</html>', {
        headers: { 'Content-Type': 'text/html' },
      })
    );
    const { container } = render(
      <ThumbnailImage
        resourceId="map"
        src={resolver}
        alt=""
        fallback={fallback}
      />
    );
    await flush();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(12);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByTestId('resource-icon')).toBeInTheDocument();
  });

  it.each(['default', 'compact'] as const)(
    'renders a resource icon in an actual %s result card for restricted placeholders',
    async (variant) => {
      fetchMock.mockResolvedValue(placeholder());
      const { container } = render(
        <BrowserRouter>
          <SearchResults
            results={[
              {
                id: 'restricted-map',
                type: 'resource',
                attributes: {
                  ogm: {
                    id: 'restricted-map',
                    dct_title_s: 'Saidabad',
                    gbl_resourceClass_sm: ['Maps'],
                    dct_accessRights_s: 'Restricted',
                  },
                },
              },
            ]}
            isLoading={false}
            totalResults={1}
            currentPage={1}
            variant={variant}
          />
        </BrowserRouter>
      );
      await flush();
      const thumbnail = container.querySelector('article .group\\/thumb')!;
      expect(thumbnail.querySelector('img')).toBeNull();
      expect(thumbnail.querySelector('svg')).not.toBeNull();
      expect(
        screen.getByRole('heading', { name: 'Saidabad' })
      ).toBeInTheDocument();
      expect(URL.createObjectURL).not.toHaveBeenCalled();
    }
  );
});
