import { Icon, ProductCard, DemoNotice } from "../../components/store/ui";
import { productBrand } from "../../lib/collections";
import type { CatalogPageProps } from "../../types/store";
export function Home({ products, cart, demoCatalog }: CatalogPageProps) {
  return (
    <main id="main" tabIndex={-1}>
      <section className="hero page-width">
        <div className="hero-copy">
          <h1>
            Caer nunca
            <br />
            supo <em>tan bien.</em>
          </h1>
          <p>
            Para ese “algo dulce”, para compartir.
            <br />O para quedártelas todas. Tú decides.
          </p>
          <a href="#shop" className="button button-orange">
            Encuentra tu cookie <Icon name="arrow" />
          </a>
          <div className="hero-footnote">
            <Icon name="flower" /> Tu próximo break empieza aquí.
          </div>
        </div>
        <div className="hero-visual">
          <img
            src="/assets/hero-cookies.webp"
            alt="Cookies con trozos de chocolate sobre un fondo naranja. Fotografía ilustrativa."
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
          <span className="hero-caption">
            PEQUEÑOS MOMENTOS. GRANDES ANTOJOS.
          </span>
        </div>
      </section>
      <div className="brand-ribbon" aria-hidden="true">
        <span>UN BOCADO MÁS</span>
        <Icon name="flower" />
        <span>JUST ONE MORE</span>
        <Icon name="flower" />
        <span>UN BOCADO MÁS</span>
        <Icon name="flower" />
        <span>JUST ONE MORE</span>
      </div>
      <section className="products-section page-width">
        <div className="section-heading">
          <div>
            <h2>Elige tu debilidad.</h2>
            <p>Tres cookies. Ninguna decisión equivocada.</p>
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
        <DemoNotice demo={demoCatalog} />
      </section>
      <section className="break-section page-width">
        <div className="break-symbol" aria-hidden="true">
          s.
        </div>
        <div>
          <h2>
            El día pide
            <br />
            un <em>snacky break.</em>
          </h2>
          <p>
            Entre un pendiente y otro, siempre hay espacio para algo rico. Haz
            una pausa. Elige tu favorita. Disfruta el momento.
          </p>
          <a href="#shop" className="text-link">
            Arma tu pedido <Icon name="arrow" />
          </a>
        </div>
      </section>
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
