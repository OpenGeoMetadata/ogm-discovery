import { useEffect, useState } from 'react';
import { useI18n } from '../../hooks/useI18n';
import {
  parseResearchPoint,
  pointText,
  type ResearchPoint,
} from './editionEvidence';

export function ResearchFocus({
  pinned,
  hover,
  onLocate,
  onClear,
  workspaceUrl,
}: {
  pinned: ResearchPoint | null;
  hover: ResearchPoint | null;
  onLocate: (point: ResearchPoint) => void;
  onClear: () => void;
  workspaceUrl: () => string;
}) {
  const { t } = useI18n();
  const [input, setInput] = useState(pinned ? pointText(pinned) : '');
  const [error, setError] = useState(false);
  const [share, setShare] = useState('');
  const pinnedText = pinned ? pointText(pinned) : '';
  useEffect(() => {
    setInput(pinnedText);
    setError(false);
  }, [pinnedText]);
  return (
    <section className="research-focus" aria-label={t('research.samePlace')}>
      <div>
        <p>{t('research.focusHelp')}</p>
        <output aria-live="off">
          {pinned ? t('research.pinnedLocation') : t('research.cursorLocation')}
          :{' '}
          {pinned || hover
            ? pointText((pinned || hover)!)
            : t('research.movePointer')}
        </output>
      </div>
      <details className="research-coordinate-control">
        <summary>{t('research.locateCoordinates')}</summary>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const point = parseResearchPoint(input);
            setError(!point);
            if (point) onLocate(point);
          }}
        >
          <label className="research-field">
            {t('research.pointCoordinates')}
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              aria-invalid={error}
              placeholder={t('research.pointExample')}
            />
          </label>
          <div className="research-actions">
            <button type="submit">{t('research.locatePoint')}</button>
            <button type="button" disabled={!pinned} onClick={onClear}>
              {t('research.clearPin')}
            </button>
          </div>
          {error && <p role="alert">{t('research.pointError')}</p>}
        </form>
      </details>
      <div className="research-share">
        <button type="button" onClick={() => setShare(workspaceUrl())}>
          {t('research.shareWorkspace')}
        </button>
        {share && (
          <label className="research-field">
            {t('research.shareLink')}
            <input
              readOnly
              value={share}
              onFocus={(event) => event.target.select()}
            />
            <a href={share}>{t('research.openSharedView')}</a>
          </label>
        )}
      </div>
    </section>
  );
}
