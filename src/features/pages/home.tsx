import {
  SeasonalDecor,
  SeasonalFeature,
  useSeasonalCampaign,
} from "../../components/seasonal/seasonal";
import { Icon, ProductCard } from "../../components/store/ui";
import { productBrand } from "../../lib/collections";
import type { CatalogPageProps } from "../../types/store";
export function Home({ products, cart }: CatalogPageProps) {
  const { theme, campaign } = useSeasonalCampaign();
  return (
    <main id="main" tabIndex={-1}>
      <section className="hero page-width">
        <div className="hero-copy">
          <h1>
            <span className="campaign-headline">{campaign.headline}</span>{" "}
            <em>{campaign.emphasis}</em>
          </h1>
          <p className="campaign-description">{campaign.description}</p>
          <a href="#shop" className="button button-orange">
            {campaign.cta} <Icon name="arrow" />
          </a>
          <div className="hero-footnote">
            <Icon name="flower" /> {campaign.footnote}
          </div>
        </div>
        <div className="hero-visual">
          <SeasonalDecor />
          <img
            src={campaign.image}
            alt={campaign.imageAlt}
            width="1024"
            height="1024"
            fetchPriority="high"
          />
          <div className="cookie-seal">
            <span>MUY DIFÍCIL</span>
            <strong>
              solo
              <br />
              una.
            </strong>
            <span>COMER SOLO UNA</span>
          </div>
          {theme === "original" && (
            <span className="hero-caption">
              PEQUEÑOS MOMENTOS. GRANDES ANTOJOS.
            </span>
          )}
        </div>
      </section>
      <SeasonalDecor placement="divider" />
      <div className="brand-ribbon" aria-hidden="true">
        <span>{campaign.ribbon[0]}</span>
        <Icon name="flower" />
        <span>{campaign.ribbon[1]}</span>
        <Icon name="flower" />
        <span>{campaign.ribbon[0]}</span>
        <Icon name="flower" />
        <span>{campaign.ribbon[1]}</span>
      </div>
      <section className="products-section page-width">
        <div className="section-heading">
          <div>
            <h2>{campaign.productsTitle}</h2>
            <p>{campaign.productsDescription}</p>
          </div>
          <a href="#shop" className="text-link">
            Ver todas las cookies <Icon name="arrow" />
          </a>
        </div>
        <div className="product-grid">
          {products
            .filter((p) => productBrand(p) === "snackyzz")
            .map((p) => (
              <ProductCard key={p.id} product={p} cart={cart} />
            ))}
        </div>
      </section>
      <section className="break-section page-width">
        <div className="break-symbol" aria-hidden="true">
          <SeasonalFeature />
        </div>
        <div>
          <h2>
            {campaign.breakTitle}
            <br />
            <em>{campaign.breakEmphasis}</em>
          </h2>
          <p>{campaign.breakDescription}</p>
          <a href="#shop" className="text-link">
            {campaign.breakCta} <Icon name="arrow" />
          </a>
        </div>
      </section>
      <SeasonalDecor placement="divider" />
      <section className="location-teaser page-width">
        <div>
          <h2>Tu antojo, más cerca.</h2>
          <p>Encuentra los puntos de venta de Snackyzz.</p>
        </div>
        <a href="#sales" className="button button-outline">
          Dónde encontrarnos <Icon name="pin" />
        </a>
      </section>
    </main>
  );
}
