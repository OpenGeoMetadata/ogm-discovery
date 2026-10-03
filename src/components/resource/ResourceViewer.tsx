import { createElement, useEffect, useRef, useState } from 'react';
import type { OgmViewer } from 'ogm-viewer';
import openStreetMapStyleUrl from '../../config/openStreetMapStyle.json?url';
import { useI18n } from '../../hooks/useI18n';
import {
  toOgmViewerRecord,
  type ViewerDocument,
} from '../../utils/ogmViewerRecord';

interface ResourceViewerProps {
  data: ViewerDocument;
  pageValue: string;
  totalResults?: number;
  searchUrl?: string;
  currentPage?: number;
}

// oEmbed is not a preview type in OGM Viewer. Keep third-party embeds isolated.
function OembedPreview({ endpoint }: { endpoint: string }) {
  const { t } = useI18n();
  const [html, setHtml] = useState<string>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(endpoint, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`oEmbed: ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (typeof data.html !== 'string')
          throw new Error('Missing oEmbed HTML');
        if (!controller.signal.aborted) setHtml(data.html);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [endpoint]);
  if (failed) return <p role="alert">{t('resource.previewLoadError')}</p>;
  if (!html) return <p role="status">{t('common.loading')}</p>;
  return (
    <iframe
      title={t('resource.previewLabel')}
      className="viewer h-[600px] w-full border-0"
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      allow="fullscreen"
      allowFullScreen
      srcDoc={html}
    />
  );
}

function OgmPreview({ data }: { data: ViewerDocument }) {
  const ref = useRef<OgmViewer | null>(null);
  const { t, locale } = useI18n();
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading'
  );

  useEffect(() => {
    let cancelled = false;
    const element = ref.current;
    setStatus('loading');
    async function load() {
      try {
        const [, { OgmRecord }] = await Promise.all([
          import('ogm-viewer'),
          import('ogm-viewer/lib'),
        ]);
        await customElements.whenDefined('ogm-viewer');
        if (cancelled || !element) return;
        await element.loadRecord(new OgmRecord(toOgmViewerRecord(data)));
        if (!cancelled) setStatus('ready');
      } catch (error) {
        if (!cancelled) {
          console.error('OGM Viewer could not load the record:', error);
          setStatus('error');
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [data]);

  return (
    <div className="relative">
      {status !== 'ready' && (
        <p role={status === 'error' ? 'alert' : 'status'}>
          {t(
            status === 'error' ? 'resource.previewLoadError' : 'common.loading'
          )}
        </p>
      )}
      {createElement('ogm-viewer', {
        ref,
        class: 'viewer block h-[600px] w-full',
        theme: 'light',
        'light-basemap': openStreetMapStyleUrl,
        'dark-basemap': openStreetMapStyleUrl,
        role: 'region',
        'hide-title': true,
        lang: locale,
        'aria-label': t('resource.previewLabel'),
      })}
    </div>
  );
}

export function ResourceViewer({ data }: ResourceViewerProps) {
  const viewer = data.meta?.ui?.viewer;
  if (viewer?.protocol === 'oembed' && viewer.endpoint) {
    return <OembedPreview key={viewer.endpoint} endpoint={viewer.endpoint} />;
  }
  return <OgmPreview key={data.attributes.ogm.id || data.id} data={data} />;
}
