import { Link, Navigate } from 'react-router';
import { Helmet } from 'react-helmet-async';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../hooks/useI18n';
import { CollectionPathways } from '../components/layout/CollectionPathways';
import { Footer } from '../components/layout/Footer';
import { resolveThemeAssetUrl } from '../utils/themeUrls';
import { ImageryPathway } from '../components/research/ImageryPathway';
import { ElevationPathway } from '../components/research/ElevationPathway';
import { EditionsPathway } from '../components/research/EditionsPathway';
import '../styles/research.css';

export default function ResearchPage() {
  const { theme } = useTheme();
  const { t, text } = useI18n();
  const config = theme.research;
  if (!config) return <Navigate to="/" replace />;
  return (
    <div className={`research-page research-${config.kind}`}>
      <Helmet>
        <title>
          {text(config.title)} · {text(theme.institution.name)}
        </title>
      </Helmet>
      <a
        href="#research-main"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById('research-main')?.focus();
        }}
        className="research-skip"
      >
        {t('research.skip')}
      </a>
      <header className="research-header">
        <Link to="/" className="research-brand">
          <img src={resolveThemeAssetUrl(theme.institution.logo_url)} alt="" />
          <span>{text(theme.institution.name)}</span>
        </Link>
        <nav aria-label={t('research.navigation')}>
          <Link to="/search">{t('research.catalog')}</Link>
          <a
            href="#footer"
            onClick={(event) => {
              event.preventDefault();
              document
                .getElementById('footer')
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            {t('research.switch')}
          </a>
        </nav>
      </header>
      <CollectionPathways />
      <main tabIndex={-1} id="research-main" className="research-main">
        <div className="research-title">
          <div>
            <p className="research-eyebrow">{t('research.prototype')}</p>
            <h1>{text(config.title)}</h1>
            <p>{text(config.description)}</p>
          </div>
          <span className="research-link-note">{t('research.linkHelp')}</span>
        </div>
        {config.kind === 'imagery' && <ImageryPathway config={config} />}
        {config.kind === 'elevation' && <ElevationPathway config={config} />}
        {config.kind === 'editions' && <EditionsPathway config={config} />}
      </main>
      <Footer id="footer" />
    </div>
  );
}
