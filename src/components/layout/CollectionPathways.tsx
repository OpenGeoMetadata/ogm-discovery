import { Link, useLocation } from 'react-router';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../hooks/useI18n';
import '../../styles/collection-pathways.css';

/** Two peer entry points, available wherever a configured collection is explored. */
export function CollectionPathways() {
  const { theme } = useTheme();
  const { t, text } = useI18n();
  const { pathname } = useLocation();
  if (!theme.research) return null;
  const researching = pathname === '/research';
  return (
    <nav className="collection-mode-nav" aria-label={t('research.pathways')}>
      <div className="collection-mode-links">
        <Link to="/" aria-current={!researching ? 'true' : undefined}>
          <strong>{t('research.discoveryMode')}</strong>
          <span>{t('research.discoveryDescription')}</span>
        </Link>
        <Link to="/research" aria-current={researching ? 'true' : undefined}>
          <strong>{t('research.researchMode')}</strong>
          <span>{text(theme.research.title)}</span>
        </Link>
      </div>
    </nav>
  );
}
