import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CampusMapBackground } from './CampusMapBackground';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('CampusMapBackground', () => {
  it('retries only queued renders using a stable URL and releases the image', async () => {
    vi.useFakeTimers();
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, { status: 503, headers: { 'Retry-After': '2' } })
      )
      .mockResolvedValueOnce(new Response(new Blob(['png'])));
    vi.stubGlobal('fetch', fetcher);
    vi.stubGlobal('IntersectionObserver', undefined);
    URL.createObjectURL = vi.fn(() => 'blob:campus');
    URL.revokeObjectURL = vi.fn();
    const { container, unmount } = render(
      <CampusMapBackground url="https://example.org/native" />
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      'https://example.org/native',
      'https://example.org/native',
    ]);
    const image = container.querySelector('img')!;
    expect(image.src).toBe('blob:campus');
    fireEvent.load(image);
    expect(image.className).toContain('opacity-100');
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:campus');
    expect(fetcher.mock.calls[0][1].signal.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('does not retry missing images', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 404 }));
    vi.stubGlobal('fetch', fetcher);
    vi.stubGlobal('IntersectionObserver', undefined);
    render(<CampusMapBackground url="https://example.org/missing" />);
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('defers offscreen requests until the image approaches the viewport', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 404 }));
    vi.stubGlobal('fetch', fetcher);
    let enter: IntersectionObserverCallback;
    const disconnect = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          enter = callback;
        }
        observe() {}
        disconnect = disconnect;
      }
    );
    const { unmount } = render(
      <CampusMapBackground url="https://example.org/offscreen" />
    );
    expect(fetcher).not.toHaveBeenCalled();
    await act(async () => {
      enter!(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });
});
