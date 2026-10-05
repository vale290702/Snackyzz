import { ProductCard, Cart, DemoNotice, Icon } from "../../components/store/ui";
import { collections, productBrand } from "../../lib/collections";
import type { CatalogPageProps } from "../../types/store";
export function Shop({
  products,
  cart,
  demoCatalog,
  collection = "snackyzz",
}: CatalogPageProps & { collection?: "snackyzz" | "baking-stereo" }) {
  const fresh = collection === "baking-stereo";
  const info = collections[collection];
  const visible = products.filter(
    (product) => productBrand(product) === collection,
  );
  return (
    <main
      id="main"
      className={`page-width inner-page collection-page ${fresh ? "collection-fresh" : "collection-sealed"}`}
      tabIndex={-1}
    >
      <div className="page-heading collection-heading">
        <h1>
          {fresh ? (
            <>
              <span className="collab-snackyzz">Snackyzz</span>{" "}
              <span className="collab-cross">X</span>
              <br />
              Baking Stereo
            </>
          ) : (
            info.title
          )}
        </h1>
        <p>{info.description}</p>
      </div>
      <div className="shop-layout">
        <section aria-label={info.title}>
          <div className="shop-toolbar">
            <span>
              {`${visible.length} ${visible.length === 1 ? "producto" : "productos"}`}
            </span>
            <span>
              {fresh ? "Recién horneadas" : "Snackyzz · Cookies selladas"}
            </span>
          </div>
          {visible.length ? (
            <>
              <div className="product-grid shop-products">
                {visible.map((p) => (
                  <ProductCard key={p.id} product={p} cart={cart} />
                ))}
              </div>
              <DemoNotice demo={demoCatalog} />
            </>
          ) : (
            <div className="collection-empty">
              <Icon name={fresh ? "oven" : "bag"} />
              <h2>
                {fresh ? "Pronto saldrán del horno." : "Más antojos en camino."}
              </h2>
              <p>
                {fresh
                  ? "Aquí encontrarás los productos de Baking Stereo cuando estén disponibles."
                  : "Aquí encontrarás las cookies Snackyzz cuando estén disponibles."}
              </p>
              <a
                href={`#${fresh ? "shop" : "baking-stereo"}`}
                className="text-link"
              >
                {fresh
                  ? "Explorar las cookies Snackyzz"
                  : "Conocer Baking Stereo"}{" "}
                <Icon name="arrow" />
              </a>
            </div>
          )}
          <div className="collection-switch">
            <p>Dos marcas. Un mismo carrito.</p>
            <a
              href={`#${fresh ? "shop" : "baking-stereo"}`}
              className="text-link"
            >
              {fresh
                ? "Ver las cookies Snackyzz"
                : "Ver Snackyzz X Baking Stereo"}{" "}
              <Icon name="arrow" />
            </a>
          </div>
        </section>
        <div className="cart-column">
          <Cart cart={cart} />
        </div>
      </div>
    </main>
  );
}
