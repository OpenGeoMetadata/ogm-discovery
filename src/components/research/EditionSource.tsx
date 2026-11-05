import { useState } from 'react';
import { Link } from 'react-router';
import { useI18n } from '../../hooks/useI18n';
import type { IndexFeature } from '../../services/research';
import { reference } from '../../services/research';
import { useRecord } from './hooks';

export function EditionSource({ feature }: { feature: IndexFeature }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const { data, error } = useRecord(open ? feature.properties.recId : '');
  const pdf = data?.meta?.ui?.downloads?.find(
    (asset) => asset.type === 'pdf' || asset.format === 'pdf'
  );
  const citation = data?.meta?.ui?.citation;
  const sourceUrl = data && reference(data, 'http://schema.org/url');
  const metadataUrl =
    data && reference(data, 'http://www.opengis.net/cat/csw/csdgm');
  return (
    <details
      className="research-source"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>{t('research.inspectSource')}</summary>
      <dl className="research-source-dates">
        <div>
          <dt>{t('research.indexPublicationYear')}</dt>
          <dd>{feature.properties.datePub || t('research.unknown')}</dd>
        </div>
        <div>
          <dt>{t('research.survey')}</dt>
          <dd>{feature.properties.dateSurvey || t('research.unknown')}</dd>
        </div>
        <div>
          <dt>{t('research.printingYear')}</dt>
          <dd>{feature.properties.dateReprnt || t('research.unknown')}</dd>
        </div>
        <div>
          <dt>{t('research.scale')}</dt>
          <dd>{feature.properties.scale || t('research.unknown')}</dd>
        </div>
      </dl>
      <p className="research-muted">{t('research.dateEvidenceHelp')}</p>
      {open && !data && !error && <p role="status">{t('research.loading')}</p>}
      {error && <p role="alert">{t('research.assetsError')}</p>}
      {data?.attributes.ogm.dct_description_sm?.map((description, i) => (
        <p key={i}>{description}</p>
      ))}
      <div className="research-source-links">
        {pdf && /^https?:\/\//.test(pdf.url) && (
          <a href={pdf.url} target="_blank" rel="noopener noreferrer">
            {t('research.openCollar')}
          </a>
        )}
        {sourceUrl && (
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
            {t('research.sourceRecord')}
          </a>
        )}
        {metadataUrl && (
          <a href={metadataUrl} target="_blank" rel="noopener noreferrer">
            {t('research.sourceMetadata')}
          </a>
        )}
        <Link to={`/resources/${feature.properties.recId}`}>
          {t('research.record')}
        </Link>
      </div>
      {citation && (
        <>
          <p className="research-citation">{citation}</p>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(citation);
                setCopyMessage('research.citationCopied');
              } catch {
                setCopyMessage('research.citationCopyFallback');
              }
            }}
          >
            {t('research.copyCitation')}
          </button>
        </>
      )}
      {copyMessage && <p role="status">{t(copyMessage)}</p>}
    </details>
  );
}
