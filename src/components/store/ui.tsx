"use client";
import { useEffect, useState } from "react";
import { productBrandLabel } from "../../lib/collections";
import { formatMoney } from "../../lib/cart";
import { safeImage } from "../../lib/html";
import type {
  CartLike,
  Contact,
  Fulfillment,
  Product,
} from "../../types/store";
import { useStoreActions } from "./actions";
export { StoreActionsProvider, useStoreActions } from "./actions";
const paths: Record<string, string> = {
  oven: "M3 4h18v17H3V4Zm0 5h18M7 13h10v5H7v-5ZM7 6.5h.01M11 6.5h.01M17 6.5h.01",
  bag: "M6 7h12l1 14H5L6 7Z M9 8V6a3 3 0 0 1 6 0v2",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  close: "m6 6 12 12M6 18 18 6",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  mail: "M3 5h18v14H3V5Zm0 1 9 7 9-7",
  check: "m5 12 4 4L19 6",
  upload: "M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6",
  chevron: "m9 5 7 7-7 7",
  lock: "M6 10h12v11H6V10Zm3 0V6a3 3 0 0 1 6 0v4",
  search: "M21 21l-6-6M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
  clock: "M12 7v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  menu: "M4 7h16M4 12h16M4 17h16",
  instagram:
    "M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Zm8 9a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm1-6h.01",
  flower: "M12 3v18M3 12h18M5.6 5.6l12.8 12.8M5.6 18.4 18.4 5.6",
};

export function Icon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.arrow} />
    </svg>
  );
}
export function Wordmark() {
  return (
    <span className="wordmark">
      snackyzz<span className="brand-dot">.</span>
    </span>
  );
}
export function Nav({
  activePage,
  cartCount,
  resetKey,
}: {
  activePage: string;
  cartCount: number;
  resetKey?: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    setMenuOpen(false);
  }, [activePage, cartCount, resetKey]);
  const links = [
    ["home", "Inicio"],
    ["shop", "Snackyzz"],
    ["baking-stereo", "Snackyzz X Baking Stereo"],
    ["sales", "Dónde encontrarnos"],
  ];
  return (
    <>
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
      <div className="announcement">
        Un pequeño break. Un gran antojo. <span>Eso es Snackyzz.</span>
      </div>
      <header className="site-header">
        <div className="nav-shell">
          <a href="#" className="brand" aria-label="Snackyzz, inicio">
            <Wordmark />
          </a>
          <nav className="nav" aria-label="Navegación principal">
            {links.map(([id, label]) => (
              <a
                key={id}
                href={`#${id === "home" ? "" : id}`}
                className={`nav-link ${activePage === id ? "is-active" : ""}`}
                aria-current={activePage === id ? "page" : undefined}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="nav-actions">
            <a
              href="#shop"
              className="cart-button"
              aria-label={`Ver carrito, ${cartCount} productos`}
            >
              <Icon name="bag" />
              <span>Mi carrito</span>
              <b data-cart-count="">{cartCount}</b>
            </a>
            <button
              className="menu-button icon-button"
              data-menu=""
              aria-label="Abrir menú"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Icon name="menu" />
            </button>
          </div>
        </div>
        <nav
          className="mobile-nav"
          aria-label="Navegación móvil"
          hidden={!menuOpen}
        >
          {links.map(([id, label]) => (
            <a
              key={id}
              href={`#${id === "home" ? "" : id}`}
              aria-current={activePage === id ? "page" : undefined}
            >
              {label}
            </a>
          ))}
        </nav>
      </header>
    </>
  );
}
export function Footer({ contact = {} }: { contact?: Contact }) {
  const instagram = contact.instagram || "Snackyzz.cookies";
  const email = contact.email || "Snackyzz.cookies@gmail.com";
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div>
          <a href="#" className="brand">
            <Wordmark />
          </a>
          <p>
            La vida se disfruta
            <br />
            un bocado a la vez.
          </p>
        </div>
        <div className="footer-links">
          <h2>¿Se te antoja?</h2>
          <a href="#shop">Snackyzz</a>
          <a href="#baking-stereo">Snackyzz X Baking Stereo</a>
          <a href="#sales">Dónde encontrarnos</a>
          <a href="#about">Sobre Snackyzz</a>
        </div>
        <div className="footer-contact">
          <h2>Sigamos en contacto</h2>
          <p className="social-handle">
            <Icon name="instagram" />
            {` @${instagram}`}
          </p>
          <a href={`mailto:${email}`}>
            <Icon name="mail" />
            {` ${email}`}
          </a>
          <p>Escríbenos. Nos encantará leerte.</p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          {`© ${new Date().getFullYear()} Snackyzz. Todos los derechos reservados.`}
        </span>
        <a href="#admin">
          Administración <Icon name="arrow" />
        </a>
      </div>
    </footer>
  );
}
export function QuantityControl({
  product,
  quantity,
}: {
  product: Product;
  quantity: number;
}) {
  const actions = useStoreActions();
  return (
    <div className="stepper" aria-label={`Cantidad de ${product.name}`}>
      <button
        data-qty="-1"
        data-product={product.id}
        aria-label={`Quitar una ${product.name}`}
        disabled={quantity === 0}
        onClick={() => actions.changeQuantity(product.id, -1)}
      >
        <Icon name="minus" />
      </button>
      <output aria-label="Cantidad">{quantity}</output>
      <button
        data-qty="1"
        data-product={product.id}
        aria-label={`Agregar una ${product.name}`}
        disabled={quantity >= 99}
        onClick={() => actions.changeQuantity(product.id, 1)}
      >
        <Icon name="plus" />
      </button>
    </div>
  );
}
export function ProductCard({
  product,
  cart,
}: {
  product: Product;
  cart: CartLike;
}) {
  const qty = cart.getQuantity(product.id);
  const actions = useStoreActions();
  return (
    <article className="product-card">
      <button
        className={`product-photo ${product.accent}`}
        data-detail={product.id}
        aria-label={`Ver detalles de ${product.name}`}
        onClick={() => actions.openProduct(product.id)}
      >
        <img
          src={safeImage(product.image)}
          alt={`${product.name}, imagen de referencia`}
          width="640"
          height="640"
          loading="lazy"
        />
        <span className="product-tag">{product.tag}</span>
        <span className="photo-action">
          Ver cookie <Icon name="arrow" />
        </span>
      </button>
      <div className="product-heading">
        <h3>
          <button
            data-detail={product.id}
            onClick={() => actions.openProduct(product.id)}
          >
            {product.name}
          </button>
        </h3>
        <span>{formatMoney(product.price)}</span>
      </div>
      <p className="product-brand">{productBrandLabel(product)}</p>
      <p>{product.description}</p>
      <div className="product-purchase">
        {qty ? (
          <QuantityControl product={product} quantity={qty} />
        ) : (
          <button
            className="add-button"
            data-qty="1"
            data-product={product.id}
            onClick={() => actions.changeQuantity(product.id, 1)}
          >
            Agregar al carrito <Icon name="plus" />
          </button>
        )}
      </div>
    </article>
  );
}
export function Cart({
  cart,
  checkout = false,
  fulfillment,
}: {
  cart: CartLike;
  checkout?: boolean;
  fulfillment?: Fulfillment;
}) {
  const lines = cart.getLines();
  const actions = useStoreActions();
  return (
    <aside className="cart-panel" aria-label="Resumen del carrito">
      <div className="cart-title">
        <h2>{checkout ? "Tu pedido" : "Tu antojo"}</h2>
        <span>
          {`${cart.getCount()} ${cart.getCount() === 1 ? "producto" : "productos"}`}
        </span>
      </div>
      {lines.length ? (
        <>
          <div className="cart-lines">
            {lines.map(({ product, quantity, total }) => (
              <div className="cart-line" key={product.id}>
                <img
                  src={safeImage(product.image)}
                  alt=""
                  width="64"
                  height="64"
                />
                <div className="cart-line-info">
                  <h3>{product.name}</h3>
                  <small className="cart-brand">
                    {productBrandLabel(product)}
                  </small>
                  {checkout ? (
                    <span>{`${quantity} × ${formatMoney(product.price)}`}</span>
                  ) : (
                    <QuantityControl product={product} quantity={quantity} />
                  )}
                </div>
                <strong>{formatMoney(total)}</strong>
              </div>
            ))}
          </div>
          {checkout && fulfillment ? (
            <div className="fulfillment-summary">
              <span>Entrega:</span>{" "}
              <strong>
                {fulfillment.type === "uber" ? "Envío con mensajero" : "Retiro"}
              </strong>
            </div>
          ) : null}
          <div className="cart-total">
            <span>Total de productos</span>
            <strong>{cart.getFormattedTotal()}</strong>
          </div>
          {checkout ? null : (
            <>
              <a href="#checkout" className="button button-dark wide">
                Comprar <Icon name="arrow" />
              </a>
              <p className="cart-note">
                Pago por SINPE · Confirmación por correo
              </p>
              <button
                className="text-button clear-cart"
                data-clear=""
                onClick={actions.clearCart}
              >
                Vaciar carrito
              </button>
            </>
          )}
        </>
      ) : (
        <>
          <div className="empty-cart">
            <Icon name="bag" />
            <h3>Aquí cabe algo rico.</h3>
            <p>
              Agrega tus cookies favoritas
              <br />y arma tu próximo antojo.
            </p>
          </div>
          <button className="button button-dark wide" disabled>
            Comprar <Icon name="arrow" />
          </button>
        </>
      )}
    </aside>
  );
}
export function DemoNotice({ demo }: { demo: boolean }) {
  return demo ? (
    <p className="demo-notice">
      Catálogo de muestra · Sabores, precios e imágenes de referencia.
    </p>
  ) : null;
}
