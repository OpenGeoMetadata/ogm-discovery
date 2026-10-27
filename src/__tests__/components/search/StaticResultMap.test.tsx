import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { StaticResultMap } from '../../../components/search/StaticResultMap';
import type { GeoDocument } from '../../../types/api';
afterEach(() => vi.unstubAllGlobals());
it('shows the unavailable state immediately for missing records instead of retrying', async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(new Response(null, { status: 404 }));
  vi.stubGlobal('fetch', fetcher);
  vi.stubGlobal('IntersectionObserver', undefined);
  const result = { id: 'missing', meta: {} } as GeoDocument;
  const { container } = render(<StaticResultMap result={result} />);
  await waitFor(() => expect(container.querySelector('img')).toBeNull());
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0][0]).toBe(
    '/api/v1/static-maps/missing/geometry/native?size=thumbnail'
  );
  expect(screen.getByText(/could not be loaded/i)).toBeInTheDocument();
});
