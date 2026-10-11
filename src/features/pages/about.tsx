import { Icon } from "../../components/store/ui";
export function About() {
  return (
    <main id="main" className="page-width inner-page about-page" tabIndex={-1}>
      <div className="page-heading">
        <h1>La vida, a bocados.</h1>
        <p>
          Snackyzz es ese pequeño break que se convierte en tu parte favorita
          del día.
        </p>
      </div>
      <section className="about-layout">
        <img
          src="/assets/hero-cookies.webp"
          alt="Cookies Snackyzz"
          width="640"
          height="640"
        />
        <div>
          <h2>
            Un antojo.
            <br />Y muchas ganas
            <br />
            de repetir.
          </h2>
          <p>
            Elige tu cookie, arma tu pedido y déjanos acompañar tu próxima
            pausa.
          </p>
          <a href="#shop" className="button button-orange">
            Encuentra tu favorita <Icon name="arrow" />
          </a>
        </div>
      </section>
      <section className="faq">
        <h2>Antes del primer bocado.</h2>
        <details>
          <summary>¿Cómo hago mi pedido?</summary>
          <p>
            Elige tus cookies, agrégalas al carrito y pulsa Comprar. Completa
            tus datos y adjunta una imagen de tu comprobante SINPE para
            registrar el pedido.
          </p>
        </details>
        <details>
          <summary>¿Cuándo se confirma mi pedido?</summary>
          <p>
            Tu pedido queda pendiente de revisión. Una vez que revisemos el
            comprobante SINPE y confirmemos el pago, recibirás un correo con la
            confirmación.
          </p>
        </details>
        <details>
          <summary>¿Tienes preguntas sobre ingredientes o entrega?</summary>
          <p>
            Escríbenos a{" "}
            <a href="mailto:Snackyzz.cookies@gmail.com">
              Snackyzz.cookies@gmail.com
            </a>{" "}
            antes de comprar. Te ayudaremos a resolver tus dudas.
          </p>
        </details>
      </section>
    </main>
  );
}
