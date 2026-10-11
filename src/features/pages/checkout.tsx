"use client";
import { Icon, Cart, useStoreActions } from "../../components/store/ui";
import { deliveryDates, deliverySlots } from "../../lib/delivery";
import type { CheckoutProps, SuccessProps } from "../../types/store";

function whatsappUrl(number: string | undefined, orderId: string) {
  const digits = String(number || "").replace(/\D/g, "");
  if (!digits) return "";
  const message = `Hola Snackyzz, quisiera coordinar la entrega de mi pedido ${orderId}.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
export function Checkout({
  cart,
  payment,
  contact = {},
  delivery = {},
  salesPoints = [],
  fulfillment,
  demoCatalog,
  catalogReady,
  draft,
  receipt,
  receiptPreview,
  checkoutError,
  submitting,
  validatingReceipt,
}: CheckoutProps) {
  const actions = useStoreActions();
  if (!cart.getCount())
    return (
      <main
        id="main"
        className="page-width inner-page centered-page"
        tabIndex={-1}
      >
        <Icon name="bag" />
        <h1>Falta lo más rico.</h1>
        <p>Agrega tus cookies favoritas al carrito para continuar.</p>
        <a href="#shop" className="button button-orange">
          Elegir mis cookies <Icon name="arrow" />
        </a>
      </main>
    );
  const locations = salesPoints.filter((point) => point.active !== false);
  const method = fulfillment?.type || (locations.length ? "pickup" : "uber");
  const selected = locations.find(
    (point) => point.id === fulfillment?.pickupLocationId,
  );
  const dates = deliveryDates(delivery.schedule);
  const slots = fulfillment?.deliveryDate
    ? deliverySlots({
        date: fulfillment.deliveryDate,
        schedule: delivery.schedule,
        slotHours: delivery.slotHours,
        leadHours: delivery.leadHours,
      })
    : [];
  return (
    <main id="main" className="page-width inner-page" tabIndex={-1}>
      <a href="#shop" className="back-link">
        ← Volver a las cookies
      </a>
      <div className="page-heading">
        <h1>Casi puedes saborearlo.</h1>
        <p>
          Completa tus datos, elige cómo recibirlo y adjunta tu comprobante.
        </p>
      </div>
      <ol className="checkout-steps" aria-label="Pasos de tu pedido">
        <li className="is-complete">
          <Icon name="check" /> Tu carrito
        </li>
        <li aria-current="step">
          <span>2</span> Datos y SINPE
        </li>
        <li>
          <span>3</span> Pedido recibido
        </li>
      </ol>
      <div className="checkout-layout">
        <form
          id="checkout-form"
          className="checkout-form"
          onSubmit={actions.submitCheckout}
        >
          <fieldset disabled={submitting}>
            <legend className="sr-only">Datos del pedido</legend>
            <section className="form-section">
              <h2>¿Para quién es el antojo?</h2>
              <div className="field">
                <label htmlFor="customer-name">Nombre completo</label>
                <input
                  id="customer-name"
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={100}
                  value={draft.name}
                  onChange={(event) =>
                    actions.checkoutChange("name", event.target.value)
                  }
                  placeholder="Tu nombre y apellido"
                />
              </div>
              <div className="field">
                <label htmlFor="customer-email">Correo electrónico</label>
                <input
                  id="customer-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={draft.email}
                  onChange={(event) =>
                    actions.checkoutChange("email", event.target.value)
                  }
                  placeholder="tucorreo@ejemplo.com"
                  aria-describedby="email-help"
                />
                <small id="email-help">
                  Aquí recibirás la confirmación después de revisar tu pago.
                </small>
              </div>
              <div className="field">
                <label htmlFor="customer-phone">
                  Teléfono <span>(opcional)</span>
                </label>
                <input
                  id="customer-phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  maxLength={30}
                  value={draft.phone}
                  onChange={(event) =>
                    actions.checkoutChange("phone", event.target.value)
                  }
                  placeholder="8888 8888"
                />
              </div>
            </section>
            <section className="form-section fulfillment-section">
              <h2>¿Cómo recibes tu pedido?</h2>
              <div className="fulfillment-options">
                <label
                  className={`choice-card ${method === "pickup" ? "is-selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="fulfillmentType"
                    value="pickup"
                    checked={method === "pickup"}
                    disabled={!locations.length}
                    onChange={(event) =>
                      actions.checkoutChange(
                        "fulfillmentType",
                        event.target.value,
                      )
                    }
                  />
                  <strong>Retiro</strong>
                  <span>Recoge en un punto de Snackyzz.</span>
                </label>
                {delivery.uberEnabled === false ? null : (
                  <label
                    className={`choice-card ${method === "uber" ? "is-selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="fulfillmentType"
                      value="uber"
                      checked={method === "uber"}
                      onChange={(event) =>
                        actions.checkoutChange(
                          "fulfillmentType",
                          event.target.value,
                        )
                      }
                    />
                    <strong>Enviar con mensajero</strong>
                    <span>
                      Recíbelo en la dirección y horario que indiques.
                    </span>
                  </label>
                )}
              </div>
              {method === "pickup" ? (
                <>
                  <div className="field">
                    <label htmlFor="pickup-location">Punto de retiro</label>
                    <select
                      id="pickup-location"
                      name="pickupLocationId"
                      required
                      value={fulfillment?.pickupLocationId || ""}
                      onChange={(event) =>
                        actions.checkoutChange(
                          "pickupLocationId",
                          event.target.value,
                        )
                      }
                    >
                      {locations.length ? (
                        <>
                          <option value="">Selecciona una ubicación</option>
                          {locations.map((point) => (
                            <option key={point.id} value={point.id}>
                              {point.name} — {point.city}
                            </option>
                          ))}
                        </>
                      ) : (
                        <option value="">No hay puntos disponibles</option>
                      )}
                    </select>
                  </div>
                  {selected ? (
                    <div className="location-choice">
                      <strong>{selected.name}</strong>
                      <p>
                        {selected.address}, {selected.city}
                      </p>
                      {selected.hours ? <span>{selected.hours}</span> : null}
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="field">
                    <label htmlFor="delivery-address">
                      Dirección de entrega
                    </label>
                    <textarea
                      id="delivery-address"
                      name="deliveryAddress"
                      required
                      minLength={8}
                      maxLength={300}
                      rows={3}
                      placeholder="Provincia, cantón, distrito y señas exactas"
                      value={fulfillment?.deliveryAddress || ""}
                      onChange={(event) =>
                        actions.checkoutChange(
                          "deliveryAddress",
                          event.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="product-form-grid">
                    <div className="field">
                      <label htmlFor="delivery-date">Fecha de entrega</label>
                      <select
                        id="delivery-date"
                        name="deliveryDate"
                        required
                        value={fulfillment?.deliveryDate || ""}
                        onChange={(event) =>
                          actions.checkoutChange(
                            "deliveryDate",
                            event.target.value,
                          )
                        }
                      >
                        <option value="">Selecciona una fecha</option>
                        {dates.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="delivery-slot">Horario de entrega</label>
                      <select
                        id="delivery-slot"
                        name="deliverySlotStart"
                        required
                        disabled={!fulfillment?.deliveryDate}
                        value={fulfillment?.deliverySlotStart || ""}
                        onChange={(event) =>
                          actions.checkoutChange(
                            "deliverySlotStart",
                            event.target.value,
                          )
                        }
                      >
                        <option value="">Selecciona un horario</option>
                        {slots.map((item) => (
                          <option key={item.value} value={item.value}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="uber-notice">
                    <Icon name="pin" />
                    <p>
                      {delivery.disclaimer ||
                        "El costo del servicio de mensajería corre por cuenta del cliente y se paga por separado."}
                    </p>
                  </div>
                </>
              )}
            </section>
            <section className="form-section">
              <h2>Un SINPE y listo.</h2>
              {payment.configured ? (
                <>
                  <p>
                    Realiza la transferencia por{" "}
                    <strong>{cart.getFormattedTotal()}</strong> y adjunta una
                    imagen legible del comprobante.
                  </p>
                  <div className="sinpe-account">
                    <div>
                      <span>SINPE Móvil</span>
                      <strong>{payment.number}</strong>
                      <p>{payment.recipient}</p>
                    </div>
                    <button
                      type="button"
                      className="text-button"
                      data-copy-sinpe=""
                      onClick={actions.copySinpe}
                    >
                      Copiar número
                    </button>
                  </div>
                </>
              ) : (
                <div className="notice">
                  <strong>
                    {demoCatalog
                      ? "Estás probando Snackyzz."
                      : "El pago aún no está disponible."}
                  </strong>
                  {!demoCatalog && <p>
                    El número SINPE todavía no está configurado. Escríbenos para consultar antes de hacer un pago.
                  </p>}
                </div>
              )}
              <label
                className={`upload-zone ${receipt ? "has-file" : ""}`}
                htmlFor="receipt"
              >
                <input
                  type="file"
                  id="receipt"
                  name="receipt"
                  accept="image/jpeg,image/png"
                  required={!receipt}
                  aria-describedby="receipt-help"
                  onChange={(event) =>
                    actions.receiptChange(
                      event.target.files?.[0] || null,
                      event.target,
                    )
                  }
                />
                {receipt ? (
                  <>
                    <img
                      className="receipt-preview"
                      src={receiptPreview}
                      alt="Vista previa de tu comprobante"
                    />
                    <span>
                      <strong>{receipt.name}</strong>
                      <span>
                        Cambiar imagen <Icon name="upload" />
                      </span>
                    </span>
                  </>
                ) : (
                  <>
                    <Icon name="upload" />
                    <strong>Sube tu comprobante SINPE</strong>
                    <span>Selecciona una imagen desde tu dispositivo</span>
                  </>
                )}
              </label>
              <small id="receipt-help">
                Obligatorio · JPG o PNG · Máximo 5 MB
              </small>
              <p className="privacy-note">
                El comprobante se usa para revisar tu pago y solo está
                disponible para la administración.
              </p>
            </section>
            <div
              className="checkout-message"
              id="checkout-error"
              role="alert"
              hidden={!checkoutError}
            >
              {checkoutError}
            </div>
            <button
              type="submit"
              className="button button-dark wide"
              disabled={
                submitting ||
                validatingReceipt ||
                !catalogReady ||
                (!payment.configured && !demoCatalog)
              }
            >
              {submitting
                ? "Registrando tu pedido…"
                : "Realizar pedido"}{" "}
              {submitting ? (
                <span className="spinner" aria-hidden="true" />
              ) : (
                <Icon name="arrow" />
              )}
            </button>
            <p className="checkout-disclaimer">
              Tu pedido quedará pendiente de revisar el SINPE. Te enviaremos un
              correo cuando sea confirmado.
            </p>
          </fieldset>
        </form>
        <div className="cart-column">
          <Cart cart={cart} checkout fulfillment={fulfillment} />
          <div className="delivery-note">
            <Icon name="mail" />
            <p>
              ¿Consultas sobre entrega o retiro?
              <br />
              <a
                href={`mailto:${contact.email || "Snackyzz.cookies@gmail.com"}`}
              >
                Escríbenos antes de comprar.
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export function Success({ lastOrder, contact = {} }: SuccessProps) {
  if (!lastOrder)
    return (
      <main
        id="main"
        className="page-width inner-page centered-page"
        tabIndex={-1}
      >
        <h1>Tu próximo antojo te espera.</h1>
        <p>No hay un pedido recién registrado en esta sesión.</p>
        <a href="#shop" className="button button-orange">
          Ver las cookies <Icon name="arrow" />
        </a>
      </main>
    );
  const whatsapp = whatsappUrl(contact.whatsapp, lastOrder.id);
  return (
    <main id="main" className="page-width success-page" tabIndex={-1}>
      <div className="success-mark">
        <Icon name="check" />
      </div>
      <h1>
        ¡Pedido realizado
        <br />
        con éxito!
      </h1>
      <p>Tu antojo ya está en nuestras manos.</p>
      <div className="success-receipt">
        <div>
          <span>Número de pedido</span>
          <strong>{lastOrder.id}</strong>
        </div>
        <div>
          <span>Estado</span>
          <span className="status pending">
            <Icon name="clock" /> Pendiente de revisión
          </span>
        </div>
        <p>
          Una vez revisado el SINPE, te mandaremos un correo con la confirmación
          de tu pedido a <strong>{lastOrder.email}</strong>.
        </p>
      </div>
      {whatsapp ? (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="button button-dark"
        >
          Contactar por WhatsApp <Icon name="arrow" />
        </a>
      ) : null}
      <a href="#shop" className="button button-orange">
        Volver a las cookies <Icon name="arrow" />
      </a>
      <a
        href={`mailto:${contact.email || "Snackyzz.cookies@gmail.com"}`}
        className="text-link"
      >
        ¿Necesitas ayuda? Escríbenos
      </a>
    </main>
  );
}
