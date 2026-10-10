"use client";
import { useEffect, useRef, type FormEvent } from "react";
import { Icon, Wordmark } from "../../components/store/ui";
import { productBrand, productBrandLabel } from "../../lib/collections";
import { formatMoney } from "../../lib/cart";
import { safeImage } from "../../lib/html";
import type { AdminController } from "./useAdmin";
import type { Order, Product, SalesPoint, Settings } from "./types";
export { useAdmin } from "./useAdmin";
const date = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("es-CR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "";
const emailLabels: Record<string, string> = {
  not_sent: "Se enviará al confirmar",
  pending: "Correo en espera",
  sending: "Enviando correo",
  sent: "Correo enviado",
  failed: "No se pudo enviar el correo",
  unknown: "Envío por verificar con el proveedor",
};
const days = [
  ["mon", "Lunes"],
  ["tue", "Martes"],
  ["wed", "Miércoles"],
  ["thu", "Jueves"],
  ["fri", "Viernes"],
  ["sat", "Sábado"],
  ["sun", "Domingo"],
];
function AdminNav({ controller: c }: { controller: AdminController }) {
  const s = c.state;
  return (
    <header className="admin-shell-header">
      <span className="brand" aria-label="Snackyzz">
        <Wordmark />
      </span>
      {s.authenticated ? (
        <>
          <nav className="admin-tabs" aria-label="Secciones de administración">
            {[
              ["orders", "Órdenes"],
              ["products", "Productos"],
              ["settings", "Configuración"],
            ].map(([value, label]) => (
              <button
                key={value}
                data-admin-view={value}
                className={s.view === value ? "is-active" : ""}
                aria-pressed={s.view === value}
                onClick={() =>
                  c.patch({ view: value, selected: null, editingProduct: null })
                }
              >
                {label}
              </button>
            ))}
          </nav>
          <button
            className="button button-outline admin-logout"
            data-admin-logout
            onClick={() => void c.logout()}
          >
            Cerrar sesión
          </button>
        </>
      ) : (
        <span>Administración</span>
      )}
    </header>
  );
}
function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <p className="checkout-message" role="alert">
      {message}
    </p>
  ) : null;
}
export function Admin({ controller: c }: { controller: AdminController }) {
  const s = c.state;
  if (s.loading && !s.authenticated)
    return (
      <>
        <AdminNav controller={c} />
        <main
          id="main"
          className="page-width centered-page inner-page"
          tabIndex={-1}
        >
          <span className="spinner" />
          <p>Cargando administración…</p>
        </main>
      </>
    );
  if (!s.authenticated)
    return (
      <>
        <AdminNav controller={c} />
        <main id="main" className="page-width admin-login-page" tabIndex={-1}>
          <div className="admin-welcome">
            <h1>
              Detrás de
              <br />
              cada <em>antojo.</em>
            </h1>
            <p>
              El espacio para revisar pedidos
              <br />y dar el siguiente paso.
            </p>
          </div>
          <form
            key={s.formRevision}
            id="admin-login-form"
            className="login-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void c.login(String(f.get("email")), String(f.get("password")));
            }}
          >
            <Icon name="lock" />
            <h2>Hola, equipo Snackyzz.</h2>
            <p>Ingresa para gestionar tus órdenes.</p>
            <div className="field">
              <label htmlFor="admin-email">Correo de administración</label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="username"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="admin-password">
                Contraseña de administración
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={s.busy}
              />
            </div>
            <ErrorMessage message={s.error} />
            <button className="button button-dark wide" disabled={s.busy}>
              {s.busy ? "Ingresando…" : "Entrar al panel"} <Icon name="arrow" />
            </button>
          </form>
        </main>
      </>
    );
  if (s.view === "products") return <Products controller={c} />;
  if (s.view === "settings") return <SettingsPanel controller={c} />;
  const pending = s.orders.filter((o) => o.status === "pending").length;
  const confirmed = s.orders.filter((o) => o.status === "confirmed").length;
  const visible = s.orders.filter(
    (o) =>
      (s.filter === "all" || o.status === s.filter) &&
      [o.id, o.name, o.email].some((v) =>
        String(v).toLocaleLowerCase().includes(s.search.toLocaleLowerCase()),
      ),
  );
  const selected = s.orders.find((o) => o.id === s.selected);
  return (
    <>
      <AdminNav controller={c} />
      <main
        id="main"
        className="page-width inner-page admin-page"
        tabIndex={-1}
      >
        <div className="section-heading">
          <div>
            <h1>Órdenes.</h1>
            <p>Cada antojo, en su lugar.</p>
          </div>
          <div className="button-row">
            <Refresh controller={c} />
          </div>
        </div>
        <div className="admin-summary">
          <div>
            <strong>{pending}</strong>
            <span>Pendientes de revisión</span>
          </div>
          <div>
            <strong>{confirmed}</strong>
            <span>Órdenes confirmadas</span>
          </div>
          <div>
            <strong>
              {formatMoney(
                s.orders
                  .filter((o) => o.status === "confirmed")
                  .reduce((sum, o) => sum + o.total, 0),
              )}
            </strong>
            <span>Total confirmado</span>
          </div>
        </div>
        <ErrorMessage message={s.error} />
        <div className="admin-toolbar">
          <div className="filter-row" aria-label="Estado de la orden">
            {[
              ["pending", "Pendientes"],
              ["confirmed", "Confirmadas"],
              ["all", "Todas"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={`filter-button ${s.filter === value ? "is-active" : ""}`}
                data-order-filter={value}
                aria-pressed={s.filter === value}
                onClick={() => c.patch({ filter: value, selected: null })}
              >
                {`${label}${value === "pending" ? " " : ""}`}
                {value === "pending" && <span>{pending}</span>}
              </button>
            ))}
          </div>
          <label className="search-field">
            <Icon name="search" />
            <span className="sr-only">Buscar órdenes</span>
            <input
              type="search"
              id="order-search"
              placeholder="Nombre, correo o número"
              value={s.search}
              onChange={(e) => c.patch({ search: e.target.value })}
            />
          </label>
        </div>
        <div className={`admin-layout ${selected ? "has-selection" : ""}`}>
          <section className="orders-list" aria-label="Lista de órdenes">
            {visible.length ? (
              <>
                <div className="order-list-heading">
                  <span>Pedido / cliente</span>
                  <span>Total</span>
                  <span>Estado</span>
                </div>
                {visible.map((o) => (
                  <button
                    key={o.id}
                    className={`order-row ${selected?.id === o.id ? "is-selected" : ""}`}
                    data-order={o.id}
                    aria-label={`Revisar pedido ${o.id} de ${o.name}`}
                    onClick={() => c.patch({ selected: o.id })}
                  >
                    <div>
                      <strong>{o.name}</strong>
                      <span>{`${o.id} · ${date(o.createdAt)}`}</span>
                      <small>{o.email}</small>
                    </div>
                    <strong>{formatMoney(o.total)}</strong>
                    <span
                      className={`status ${o.status === "confirmed" ? "confirmed" : "pending"}`}
                    >
                      {o.status === "confirmed" ? "Confirmado" : "Pendiente"}
                    </span>
                    <Icon name="chevron" />
                  </button>
                ))}
              </>
            ) : (
              <div className="admin-empty">
                <Icon name="bag" />
                <h2>{s.search ? "Sin resultados." : "Todo al día."}</h2>
                <p>
                  {s.search
                    ? "Prueba otro nombre, correo o número de pedido."
                    : "Las órdenes aparecerán aquí cuando los clientes completen su pedido."}
                </p>
              </div>
            )}
          </section>
          {selected && <OrderDetail order={selected} controller={c} />}
        </div>
      </main>
    </>
  );
}
function Refresh({ controller: c }: { controller: AdminController }) {
  return (
    <button
      className="text-button"
      data-admin-refresh
      disabled={c.state.loading}
      onClick={() => void c.load()}
    >
      {c.state.loading ? "Actualizando…" : "Actualizar"}
    </button>
  );
}
function Products({ controller: c }: { controller: AdminController }) {
  const s = c.state;
  const products = s.products;
  const visible = products.filter(
    (p) =>
      (s.productFilter === "all" ||
        (s.productFilter === "active" ? p.active : !p.active)) &&
      (!s.productBrandFilter ||
        s.productBrandFilter === "all" ||
        productBrand(p) === s.productBrandFilter),
  );
  const editing =
    s.editingProduct === "new"
      ? undefined
      : products.find((p) => p.id === s.editingProduct);
  const showForm = s.editingProduct === "new" || editing;
  return (
    <>
      <AdminNav controller={c} />
      <main
        id="main"
        className="page-width inner-page admin-page"
        tabIndex={-1}
      >
        <div className="section-heading">
          <div>
            <h1>Productos.</h1>
            <p>El catálogo que ven tus clientes.</p>
          </div>
          <div className="button-row">
            <button
              className="button button-dark"
              data-new-product
              onClick={() => c.patch({ editingProduct: "new" })}
            >
              Nuevo producto <Icon name="plus" />
            </button>
          </div>
        </div>
        <ErrorMessage message={s.error} />
        <div className="admin-toolbar">
          <div className="product-filters">
            <div
              className="filter-row"
              role="group"
              aria-label="Marca del producto"
            >
              {[
                ["all", "Todas las marcas"],
                ["snackyzz", "Snackyzz"],
                ["baking-stereo", "Baking Stereo"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  id={`brand-filter-${value}`}
                  className={`filter-button ${(s.productBrandFilter || "all") === value ? "is-active" : ""}`}
                  data-product-brand-filter={value}
                  aria-pressed={(s.productBrandFilter || "all") === value}
                  onClick={() =>
                    c.patch({ productBrandFilter: value, editingProduct: null })
                  }
                >
                  {label}
                </button>
              ))}
            </div>
            <div
              className="filter-row"
              role="group"
              aria-label="Estado del producto"
            >
              {[
                ["all", "Todos"],
                ["active", "Activos"],
                ["archived", "Archivados"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={`filter-button ${s.productFilter === value ? "is-active" : ""}`}
                  data-product-filter={value}
                  aria-pressed={s.productFilter === value}
                  onClick={() => c.patch({ productFilter: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <Refresh controller={c} />
        </div>
        <div
          className={`product-admin-layout ${showForm ? "has-selection" : ""}`}
        >
          <section className="admin-product-list" aria-label="Productos">
            {visible.length ? (
              visible.map((p) => (
                <article key={p.id} className="admin-product-row">
                  <img src={safeImage(p.image)} alt="" />
                  <div>
                    <strong>{p.name}</strong>
                    <span>{`${p.tag} · ${formatMoney(p.price)}`}</span>
                    <small>
                      {`${productBrandLabel(p)} · Posición ${p.position}`}
                    </small>
                  </div>
                  <span
                    className={`status ${p.active ? "confirmed" : "pending"}`}
                  >
                    {p.active ? "Activo" : "Archivado"}
                  </span>
                  <div className="product-row-actions">
                    <button
                      className="text-button"
                      data-edit-product={p.id}
                      onClick={() => c.patch({ editingProduct: p.id })}
                    >
                      Editar
                    </button>
                    {p.active ? (
                      <button
                        className="text-button danger"
                        data-archive-product={p.id}
                        onClick={() => void c.productAction(p.id, "archive")}
                      >
                        Archivar
                      </button>
                    ) : (
                      <button
                        className="text-button"
                        data-restore-product={p.id}
                        onClick={() => void c.productAction(p.id, "restore")}
                      >
                        Restaurar
                      </button>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="admin-empty">
                <Icon name="bag" />
                <h2>
                  {products.length ? "Sin coincidencias." : "Sin productos."}
                </h2>
                <p>
                  {products.length
                    ? "Prueba otra marca o estado para ver más productos."
                    : "Crea un producto para comenzar."}
                </p>
              </div>
            )}
          </section>
          {showForm && (
            <ProductForm
              key={`${s.editingProduct}-${s.formRevision}`}
              product={editing}
              controller={c}
            />
          )}
        </div>
      </main>
    </>
  );
}
function ProductForm({
  product,
  controller: c,
}: {
  product?: Product;
  controller: AdminController;
}) {
  const item = product ?? {
    id: "",
    name: "",
    price: "",
    description: "",
    tag: "",
    image: "",
    accent: "#ED781A",
    position: 1,
    active: true,
    brand: "snackyzz",
  };
  return (
    <form
      id="product-form"
      className="product-editor"
      onSubmit={(e) => {
        e.preventDefault();
        void c.saveProduct(new FormData(e.currentTarget));
      }}
    >
      <div className="cart-title">
        <h2>{product ? "Editar producto" : "Nuevo producto"}</h2>
        <button
          type="button"
          className="icon-button"
          data-close-product
          aria-label="Cerrar editor"
          onClick={() => c.patch({ editingProduct: null })}
        >
          <Icon name="close" />
        </button>
      </div>
      <input type="hidden" name="id" value={item.id} />
      <input type="hidden" name="existingImage" value={item.image} />
      <div className="field">
        <label htmlFor="product-brand">Sección del catálogo</label>
        <select
          id="product-brand"
          name="brand"
          defaultValue={item.brand || "snackyzz"}
        >
          <option value="snackyzz">Snackyzz · Cookies selladas</option>
          <option value="baking-stereo">
            Snackyzz X Baking Stereo · Recién horneadas
          </option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="product-name">Nombre</label>
        <input
          id="product-name"
          name="name"
          required
          maxLength={80}
          defaultValue={item.name}
        />
      </div>
      <div className="product-form-grid">
        <div className="field">
          <label htmlFor="product-price">Precio (₡)</label>
          <input
            id="product-price"
            name="price"
            type="number"
            required
            min="1"
            max="1000000"
            step="1"
            defaultValue={item.price}
          />
        </div>
        <div className="field">
          <label htmlFor="product-position">Posición</label>
          <input
            id="product-position"
            name="position"
            type="number"
            required
            min="0"
            max="999"
            step="1"
            defaultValue={item.position}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="product-tag">Etiqueta corta</label>
        <input
          id="product-tag"
          name="tag"
          required
          maxLength={40}
          defaultValue={item.tag}
        />
      </div>
      <div className="field">
        <label htmlFor="product-description">Descripción</label>
        <textarea
          id="product-description"
          name="description"
          required
          maxLength={500}
          rows={4}
          defaultValue={item.description}
        />
      </div>
      <div className="product-form-grid">
        <div className="field">
          <label htmlFor="product-accent">Color</label>
          <input
            id="product-accent"
            name="accent"
            type="color"
            defaultValue={item.accent}
          />
        </div>
        <div className="field">
          <label htmlFor="product-image">
            Imagen {product ? "(opcional)" : ""}
          </label>
          <input
            id="product-image"
            name="image"
            type="file"
            accept="image/jpeg,image/png"
            required={!product}
          />
        </div>
      </div>
      <small>JPG o PNG · Máximo 5 MB.</small>
      <div className="button-row">
        <button className="button button-dark wide" disabled={c.state.busy}>
          {c.state.busy ? "Guardando…" : "Guardar producto"}
        </button>
      </div>
    </form>
  );
}
function SettingsPanel({ controller: c }: { controller: AdminController }) {
  const s = c.state;
  const settings = s.settings ?? {};
  const editing =
    s.editingLocation === "new"
      ? undefined
      : s.locations.find((p) => p.id === s.editingLocation);
  return (
    <>
      <AdminNav controller={c} />
      <main
        id="main"
        className="page-width inner-page admin-page"
        tabIndex={-1}
      >
        <div className="section-heading">
          <div>
            <h1>Configuración.</h1>
            <p>Datos que ven tus clientes.</p>
          </div>
        </div>
        <ErrorMessage message={s.error} />
        {s.emailConfigured ? (
          <p className="email-config-ok">
            <Icon name="check" /> El envío de correos está configurado.
          </p>
        ) : (
          <div className="notice email-config-warning">
            <strong>
              Los correos de confirmación aún no están configurados.
            </strong>
            <p>
              Agrega RESEND_API_KEY y FROM_EMAIL como secretos de la función en
              Supabase. Estas credenciales no se guardan en este formulario.
            </p>
          </div>
        )}
        <div className="settings-grid">
          <SettingsForm
            key={s.formRevision}
            settings={settings}
            controller={c}
          />
          <section className="locations-admin">
            <div className="cart-title">
              <div>
                <h2>Puntos de retiro</h2>
                <p>Ubicaciones disponibles para clientes.</p>
              </div>
              <button
                className="button button-outline"
                data-new-location
                onClick={() => c.patch({ editingLocation: "new" })}
              >
                Nuevo punto
              </button>
            </div>
            {s.locations.length ? (
              s.locations.map((p) => (
                <article key={p.id} className="admin-location-row">
                  <div>
                    <strong>{p.name}</strong>
                    <span>{`${p.address} · ${p.city}`}</span>
                    <small>{p.hours || "Sin horario"}</small>
                  </div>
                  <span
                    className={`status ${p.active ? "confirmed" : "pending"}`}
                  >
                    {p.active ? "Activo" : "Archivado"}
                  </span>
                  <div className="product-row-actions">
                    <button
                      className="text-button"
                      data-edit-location={p.id}
                      onClick={() => c.patch({ editingLocation: p.id })}
                    >
                      Editar
                    </button>
                    <button
                      className={`text-button ${p.active ? "danger" : ""}`}
                      data-location-action={p.active ? "archive" : "restore"}
                      data-location-id={p.id}
                      onClick={() =>
                        void c.storeAction(
                          {
                            action: `${p.active ? "archive" : "restore"}-location`,
                            id: p.id,
                          },
                          p.active ? "Punto archivado." : "Punto restaurado.",
                        )
                      }
                    >
                      {p.active ? "Archivar" : "Restaurar"}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="admin-empty">
                <h3>Sin puntos de retiro.</h3>
                <p>Crea una ubicación para ofrecer retiro.</p>
              </div>
            )}
            {s.editingLocation && (
              <LocationForm
                key={`${s.editingLocation}-${s.formRevision}`}
                point={editing}
                controller={c}
              />
            )}
          </section>
        </div>
      </main>
    </>
  );
}
function SettingsForm({
  settings: s,
  controller: c,
}: {
  settings: Settings;
  controller: AdminController;
}) {
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const value = (key: string) => String(f.get(key) ?? "");
    const demoCatalog = f.has("demoCatalog");
    if (
      !demoCatalog &&
      (!value("sinpeNumber").trim() || !value("sinpeRecipient").trim())
    ) {
      e.currentTarget
        .querySelector<HTMLInputElement>(
          !value("sinpeNumber").trim()
            ? "#setting-sinpe"
            : "#setting-recipient",
        )
        ?.reportValidity();
      return;
    }
    const schedule = Object.fromEntries(
      days.map(([day]) => [
        day,
        {
          enabled: f.has(`delivery_${day}_enabled`),
          start: value(`delivery_${day}_start`),
          end: value(`delivery_${day}_end`),
        },
      ]),
    );
    void c.storeAction(
      {
        action: "save-settings",
        demoCatalog,
        sinpeNumber: value("sinpeNumber"),
        sinpeRecipient: value("sinpeRecipient"),
        whatsapp: value("whatsapp"),
        publicEmail: value("publicEmail"),
        instagram: value("instagram"),
        uberDeliveryEnabled: f.has("uberDeliveryEnabled"),
        uberDisclaimer: value("uberDisclaimer"),
        deliveryLeadHours: Number(f.get("deliveryLeadHours")),
        deliverySlotHours: Number(f.get("deliverySlotHours")),
        deliverySchedule: schedule,
      },
      "Configuración guardada.",
    );
  }
  return (
    <form
      id="store-settings-form"
      className="product-editor settings-editor"
      onSubmit={submit}
    >
      <h2>Datos de la tienda</h2>
      <label className="check-field">
        <input
          type="checkbox"
          name="demoCatalog"
          defaultChecked={s.demo_catalog !== false}
          onChange={(event) => {
            const form = event.currentTarget.form;
            for (const name of ["sinpeNumber", "sinpeRecipient"]) {
              const input = form?.elements.namedItem(
                name,
              ) as HTMLInputElement | null;
              if (input) input.required = !event.currentTarget.checked;
            }
          }}
        />
        Modo de prueba
      </label>
      <p className="form-help">
        Actívalo para registrar pedidos de prueba sin transferencias reales.
        Para recibir pagos reales, completa ambos datos SINPE y desactívalo.
      </p>
      <div className="product-form-grid">
        <div className="field">
          <label htmlFor="setting-sinpe">Número SINPE</label>
          <input
            id="setting-sinpe"
            name="sinpeNumber"
            required={s.demo_catalog === false}
            maxLength={30}
            defaultValue={s.sinpe_number || ""}
          />
        </div>
        <div className="field">
          <label htmlFor="setting-recipient">Destinatario SINPE</label>
          <input
            id="setting-recipient"
            name="sinpeRecipient"
            required={s.demo_catalog === false}
            maxLength={100}
            defaultValue={s.sinpe_recipient || ""}
          />
        </div>
      </div>
      <div className="product-form-grid">
        <div className="field">
          <label htmlFor="setting-whatsapp">WhatsApp con código de país</label>
          <input
            id="setting-whatsapp"
            name="whatsapp"
            maxLength={30}
            placeholder="+506 8888 8888"
            defaultValue={s.whatsapp || ""}
          />
        </div>
        <div className="field">
          <label htmlFor="setting-email">Correo público</label>
          <input
            id="setting-email"
            name="publicEmail"
            type="email"
            maxLength={254}
            defaultValue={s.public_email || ""}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="setting-instagram">Instagram</label>
        <input
          id="setting-instagram"
          name="instagram"
          maxLength={80}
          defaultValue={s.instagram || ""}
        />
      </div>
      <label className="check-field">
        <input
          type="checkbox"
          name="uberDeliveryEnabled"
          defaultChecked={s.uber_delivery_enabled !== false}
        />{" "}
        Ofrecer envío con mensajero
      </label>
      <div className="field">
        <label htmlFor="delivery-lead">Anticipación mínima (horas)</label>
        <input
          id="delivery-lead"
          name="deliveryLeadHours"
          type="number"
          min="0"
          max="168"
          required
          defaultValue={s.delivery_lead_hours ?? 6}
        />
      </div>
      <input
        type="hidden"
        name="deliverySlotHours"
        value={s.delivery_slot_hours ?? 3}
      />
      <fieldset className="delivery-schedule">
        <legend>Horario disponible para entregas</legend>
        {days.map(([key, label]) => {
          const item = s.delivery_schedule?.[key] ?? {
            enabled: key !== "sun",
            start: "09:00",
            end: key === "sat" || key === "sun" ? "15:00" : "18:00",
          };
          return (
            <div className="schedule-row" key={key}>
              <label>
                <input
                  type="checkbox"
                  name={`delivery_${key}_enabled`}
                  defaultChecked={item.enabled}
                />{" "}
                {label}
              </label>
              <input
                type="time"
                name={`delivery_${key}_start`}
                aria-label={`Inicio ${label}`}
                required
                defaultValue={item.start}
              />
              <span>a</span>
              <input
                type="time"
                name={`delivery_${key}_end`}
                aria-label={`Fin ${label}`}
                required
                defaultValue={item.end}
              />
            </div>
          );
        })}
      </fieldset>
      <div className="field">
        <label htmlFor="setting-disclaimer">Aviso de entrega</label>
        <textarea
          id="setting-disclaimer"
          name="uberDisclaimer"
          required
          minLength={10}
          maxLength={300}
          rows={3}
          defaultValue={s.uber_disclaimer || ""}
        />
      </div>
      <button className="button button-dark wide" disabled={c.state.busy}>
        Guardar configuración
      </button>
    </form>
  );
}
function LocationForm({
  point,
  controller: c,
}: {
  point?: SalesPoint;
  controller: AdminController;
}) {
  const p = point ?? {
    id: "",
    name: "",
    city: "",
    address: "",
    hours: "",
    map_url: "",
    position: 1,
  };
  return (
    <form
      id="location-form"
      className="product-editor location-editor"
      onSubmit={(e) => {
        e.preventDefault();
        const fields = Object.fromEntries(new FormData(e.currentTarget));
        void c.storeAction(
          {
            action: "save-location",
            ...fields,
            position: Number(fields.position),
          },
          "Punto de retiro guardado.",
        );
      }}
    >
      <div className="cart-title">
        <h2>{point ? "Editar punto" : "Nuevo punto"}</h2>
        <button
          type="button"
          className="icon-button"
          data-close-location
          aria-label="Cerrar editor"
          onClick={() => c.patch({ editingLocation: null })}
        >
          <Icon name="close" />
        </button>
      </div>
      <input type="hidden" name="id" value={p.id} />
      <div className="product-form-grid">
        <div className="field">
          <label htmlFor="location-name">Nombre</label>
          <input
            id="location-name"
            name="name"
            required
            minLength={2}
            maxLength={100}
            defaultValue={p.name}
          />
        </div>
        <div className="field">
          <label htmlFor="location-city">Ciudad</label>
          <input
            id="location-city"
            name="city"
            required
            minLength={2}
            maxLength={100}
            defaultValue={p.city}
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="location-address">Dirección</label>
        <textarea
          id="location-address"
          name="address"
          required
          minLength={5}
          maxLength={300}
          rows={3}
          defaultValue={p.address}
        />
      </div>
      <div className="field">
        <label htmlFor="location-hours">Horario</label>
        <input
          id="location-hours"
          name="hours"
          maxLength={200}
          defaultValue={p.hours}
        />
      </div>
      <div className="field">
        <label htmlFor="location-map">
          Enlace de Google Maps <span>(opcional)</span>
        </label>
        <input
          id="location-map"
          name="mapUrl"
          type="url"
          maxLength={500}
          defaultValue={p.map_url}
        />
      </div>
      <div className="field">
        <label htmlFor="location-position">Posición</label>
        <input
          id="location-position"
          name="position"
          type="number"
          required
          min="0"
          max="999"
          defaultValue={p.position}
        />
      </div>
      <button className="button button-dark wide" disabled={c.state.busy}>
        Guardar punto
      </button>
    </form>
  );
}
function OrderDetail({
  order: o,
  controller: c,
}: {
  order: Order;
  controller: AdminController;
}) {
  const retry = ["failed", "sending"].includes(o.emailStatus);
  const busy = c.state.busy;
  const detail = useRef<HTMLElement>(null);
  useEffect(() => {
    detail.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
  }, [o.id]);
  return (
    <aside
      ref={detail}
      className="order-detail"
      aria-label="Detalle de la orden"
    >
      <div className="cart-title">
        <h2>Revisar pedido</h2>
        <button
          className="icon-button"
          data-close-order
          aria-label="Cerrar detalle"
          onClick={() => c.patch({ selected: null })}
        >
          <Icon name="close" />
        </button>
      </div>
      <p className="order-id">{o.id}</p>
      <h3>{o.name}</h3>
      <p>
        {o.email}
        {o.phone && (
          <>
            <br />
            {o.phone}
          </>
        )}
      </p>
      {o.fulfillmentType && (
        <div className="fulfillment-summary">
          <span>Entrega:</span>{" "}
          <strong>
            {o.fulfillmentType === "uber"
              ? "Envío con mensajero"
              : `Retiro en ${o.fulfillmentLabel || "punto de venta"}`}
          </strong>
          <p>{o.fulfillmentAddress || ""}</p>
          {o.deliveryDate && (
            <p>
              <strong>Programado:</strong> {o.deliveryDate} ·{" "}
              {String(o.deliverySlotStart || "").slice(0, 5)}–
              {String(o.deliverySlotEnd || "").slice(0, 5)}
            </p>
          )}
        </div>
      )}
      <div className="order-items">
        {o.items.map((item, index) => (
          <div key={index}>
            <span>{`${item.quantity} × ${item.name}`}</span>
            <strong>{formatMoney(item.price * item.quantity)}</strong>
          </div>
        ))}
      </div>
      <div className="cart-total">
        <span>Total</span>
        <strong>{formatMoney(o.total)}</strong>
      </div>
      <h3>Comprobante SINPE</h3>
      <a
        href={o.receiptUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="receipt-link"
      >
        <img src={o.receiptUrl} alt={`Comprobante SINPE del pedido ${o.id}`} />
        <span>
          Abrir comprobante completo <Icon name="arrow" />
        </span>
      </a>
      <p className={`email-status ${retry ? "is-error" : ""}`}>
        <Icon name="mail" /> {emailLabels[o.emailStatus] || o.emailStatus}
      </p>
      {o.status === "pending" ? (
        <>
          <p className="admin-confirm-note">
            Confirma únicamente después de verificar el pago. Se enviará un
            correo al cliente.
          </p>
          <button
            className="button button-dark wide"
            data-confirm-order={o.id}
            disabled={busy}
            onClick={() => void c.action(o.id, "confirm")}
          >
            {busy ? "Confirmando…" : "Confirmar pedido"} <Icon name="check" />
          </button>
        </>
      ) : (
        <>
          <p className="confirmed-note">
            <Icon name="check" /> Confirmado {date(o.confirmedAt)}
          </p>
          {retry && (
            <>
              <button
                className="button button-outline wide"
                data-retry-email={o.id}
                disabled={busy}
                onClick={() => void c.action(o.id, "retry-email")}
              >
                {busy ? "Reintentando…" : "Reintentar correo"}{" "}
                <Icon name="mail" />
              </button>
              <p className="admin-confirm-note">
                Si el envío continúa activo, podrás reintentarlo cuando venza el
                bloqueo de seguridad.
              </p>
            </>
          )}
        </>
      )}
    </aside>
  );
}
