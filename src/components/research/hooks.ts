import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { fetchResourceDetails } from '../../services/api';
import { fetchIndex, type IndexFeature } from '../../services/research';
import type { GeoDocument } from '../../types/api';
export function useResearchParams() {
  const [params, setParams] = useSearchParams();
  function update(values: Record<string, string>) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        Object.entries(values).forEach(([k, v]) =>
          v ? next.set(k, v) : next.delete(k)
        );
        return next;
      },
      { replace: true }
    );
  }
  return { params, update };
}
export function useRecord(id: string) {
  const [state, setState] = useState<{
    id: string;
    data?: GeoDocument;
    error?: boolean;
  }>({ id });
  useEffect(() => {
    if (!id) return;
    let active = true;
    setState({ id });
    fetchResourceDetails(id)
      .then((data) => {
        if (active) setState({ id, data });
      })
      .catch(() => {
        if (active) setState({ id, error: true });
      });
    return () => {
      active = false;
    };
  }, [id]);
  return state.id === id ? state : { id };
}
export function useIndex(id: string) {
  const [state, setState] = useState<{
    id: string;
    features?: IndexFeature[];
    error?: boolean;
  }>({ id });
  useEffect(() => {
    const controller = new AbortController();
    setState({ id });
    fetchIndex(id, controller.signal)
      .then((features) => {
        if (!controller.signal.aborted) setState({ id, features });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ id, error: true });
      });
    return () => controller.abort();
  }, [id]);
  return state.id === id ? state : { id };
}
