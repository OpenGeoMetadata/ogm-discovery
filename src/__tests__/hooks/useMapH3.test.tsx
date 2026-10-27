import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../services/api', () => ({
  fetchMapH3: vi.fn(),
  getApiBasePath: () => '/api/v1',
}));
import { fetchMapH3, type MapH3Response } from '../../services/api';
import { requestHexes, useMapH3 } from '../../hooks/useMapH3';
const response = (count: number): MapH3Response => ({
  hexes: [{ h3: 'cell', count }],
  resolution: 3,
  globalCount: count,
});
describe('H3 request lifecycle', () => {
  beforeEach(() => vi.mocked(fetchMapH3).mockReset());
  it('deduplicates simultaneous requests and dateline cells without summing counts', async () => {
    vi.mocked(fetchMapH3).mockResolvedValue(response(5));
    const a = requestHexes('water', ['170,-10,180,10', '-180,-10,-170,10'], 3);
    const b = requestHexes('water', ['170,-10,180,10', '-180,-10,-170,10'], 3);
    expect(a).toBe(b);
    expect((await a).hexes).toEqual([{ h3: 'cell', count: 5 }]);
    expect(fetchMapH3).toHaveBeenCalledTimes(2);
  });
  it('ignores old responses after a query change', async () => {
    let finishOld!: (res: MapH3Response) => void;
    vi.mocked(fetchMapH3)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishOld = resolve;
          })
      )
      .mockResolvedValueOnce(response(9));
    const hook = renderHook(({ q }) => useMapH3(q, '-100,30,-90,40', 3), {
      initialProps: { q: 'old' },
    });
    hook.rerender({ q: 'new' });
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    await act(async () => finishOld(response(2)));
    expect(hook.result.current.hexes[0].count).toBe(9);
  });
});
