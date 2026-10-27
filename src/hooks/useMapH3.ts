import { useEffect, useState } from 'react';
import {
  fetchMapH3,
  type MapH3Response,
  getApiBasePath,
} from '../services/api';

const EMPTY_HEXES: MapH3Response['hexes'] = [];
const inFlight = new Map<string, Promise<MapH3Response>>();
export function requestHexes(
  query: string,
  bboxes: string[],
  resolution: number,
  queryString?: string
) {
  const key = JSON.stringify([
    getApiBasePath(),
    query,
    bboxes,
    resolution,
    queryString,
  ]);
  const existing = inFlight.get(key);
  if (existing) return existing;
  const request = Promise.all(
    (bboxes.length ? bboxes : [undefined]).map((bbox) =>
      fetchMapH3(query, bbox, resolution, queryString)
    )
  ).then((parts) => ({
    ...parts[0],
    hexes: Array.from(
      new Map(parts.flatMap((p) => p.hexes).map((h) => [h.h3, h])).values()
    ),
  }));
  inFlight.set(key, request);
  void request.finally(() => inFlight.delete(key)).catch(() => {});
  return request;
}
export function useMapH3(
  query: string,
  bbox: string | null,
  resolution: number,
  queryString?: string,
  options?: { enabled?: boolean; bboxes?: string[] }
) {
  const [data, setData] = useState<MapH3Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const enabled = options?.enabled !== false;
  const bboxKey = JSON.stringify(options?.bboxes ?? (bbox ? [bbox] : []));
  const requestKey = JSON.stringify([
    getApiBasePath(),
    query,
    bboxKey,
    resolution,
    queryString,
  ]);
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    setError(null);
    requestHexes(query, JSON.parse(bboxKey), resolution, queryString)
      .then((res) => {
        if (mounted) setData(res);
      })
      .catch((e) => {
        if (mounted) {
          setData(null);
          setError(String(e));
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
          setSettledKey(requestKey);
        }
      });
    return () => {
      mounted = false;
    };
  }, [enabled, query, bboxKey, resolution, queryString, requestKey]);
  const hexes = data?.hexes ?? EMPTY_HEXES;
  return {
    hexes,
    globalCount: data?.globalCount ?? 0,
    hexCount: hexes.length,
    totalInView: hexes.reduce((n, h) => n + h.count, 0),
    loading: enabled && (loading || settledKey !== requestKey),
    error,
  };
}
