"use client";
import { Icon, useStoreActions } from "../../components/store/ui";
import type { SalesPoint } from "../../types/store";
export function Sales({
  salesPoints,
  selectedCity = "Todos",
}: {
  salesPoints: SalesPoint[];
  selectedCity?: string;
}) {
  const cities = ["Todos", ...new Set(salesPoints.map((p) => p.city))];
  const visible =
    selectedCity === "Todos"
      ? salesPoints
      : salesPoints.filter((p) => p.city === selectedCity);
  const actions = useStoreActions();
  return (
    <main id="main" className="page-width inner-page sales-page" tabIndex={-1}>
      <div className="page-heading">
        <h1>Tu antojo, más cerca.</h1>
        <p>Busca un punto de venta y encuentra tu próxima cookie.</p>
      </div>
      {salesPoints.length ? (
        <>
          <div className="filter-row" aria-label="Filtrar por ciudad">
            {cities.map((city) => (
              <button
                key={city}
                data-city={city}
                className={`filter-button ${selectedCity === city ? "is-active" : ""}`}
                aria-pressed={selectedCity === city}
                onClick={() => actions.selectCity(city)}
              >
                {city}
              </button>
            ))}
          </div>
          <div className="location-list">
            {visible.map((point) => (
              <article className="location-card" key={point.id}>
                <Icon name="pin" />
                <div>
                  <span>{point.city}</span>
                  <h2>{point.name}</h2>
                  <p>{point.address}</p>
                  <p>{point.hours}</p>
                </div>
                <a
                  className="text-link"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(point.address + " " + point.city)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Cómo llegar <Icon name="arrow" />
                </a>
              </article>
            ))}
          </div>
        </>
      ) : (
        <section className="locations-empty">
          <div className="location-art" aria-hidden="true">
            <Icon name="pin" />
          </div>
          <h2>
            Pronto estaremos
            <br />
            más cerca de ti.
          </h2>
          <p>
            Estamos preparando nuestra lista de puntos de venta. Mientras tanto,
            puedes explorar las cookies o escribirnos para consultar dónde
            encontrarlas.
          </p>
          <div className="button-row">
            <a href="#shop" className="button button-dark">
              Ver las cookies <Icon name="arrow" />
            </a>
            <a href="mailto:Snackyzz.cookies@gmail.com" className="text-link">
              Escríbenos <Icon name="mail" />
            </a>
          </div>
        </section>
      )}
    </main>
  );
}
