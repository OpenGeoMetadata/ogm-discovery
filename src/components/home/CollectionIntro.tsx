import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../hooks/useI18n';
import { resolveThemeAssetUrl } from '../../utils/themeUrls';
import { primaryCtaClass, secondaryCtaClass } from '../../styles/cta';

/** An asset-led collection entry point, configured entirely by the active theme. */
export function CollectionIntro() {
  const { theme } = useTheme();
  const { text } = useI18n();
  const intro = theme.homepage?.collection_intro;
  if (!intro) return null;

  return (
    <section className="collection-intro" aria-labelledby="collection-title">
      <div
        className={`collection-intro-grid${intro.image ? '' : ' collection-intro-grid-text'}`}
      >
        <div className="collection-intro-copy">
          <p className="collection-eyebrow">{text(intro.eyebrow)}</p>
          <h1 id="collection-title">{text(theme.institution.hero_text)}</h1>
          <p className="collection-description">
            {text(theme.institution.hero_description)}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            {theme.homepage?.hero_actions?.map((action, index) => {
              const className =
                index === 0 ? primaryCtaClass : secondaryCtaClass;
              const content = (
                <>
                  {text(action.label)}
                  <ArrowRight size={17} aria-hidden />
                </>
              );
              return action.external ? (
                <a
                  key={action.href}
                  href={action.href}
                  className={className}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {content}
                </a>
              ) : (
                <Link key={action.href} to={action.href} className={className}>
                  {content}
                </Link>
              );
            })}
          </div>
          <dl className="collection-facts">
            {intro.facts.map((fact) => (
              <div key={text(fact.label)}>
                <dt>{text(fact.label)}</dt>
                <dd>{text(fact.value)}</dd>
              </div>
            ))}
          </dl>
        </div>
        {intro.image && (
          <figure className="collection-image">
            <Link to={intro.image.href}>
              <img
                src={resolveThemeAssetUrl(intro.image.src)}
                alt={text(intro.image.alt)}
              />
              <figcaption>
                <span>{text(intro.image.caption)}</span>
                <ArrowUpRight size={20} aria-hidden />
              </figcaption>
            </Link>
          </figure>
        )}
      </div>
      <div className="collection-pathways">
        {intro.pathways.map((pathway) => (
          <Link
            key={pathway.href}
            to={pathway.href}
            className="collection-pathway"
          >
            <span className="collection-eyebrow">{text(pathway.label)}</span>
            <h2>
              {text(pathway.title)}
              <ArrowRight size={20} aria-hidden />
            </h2>
            <p>{text(pathway.description)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
