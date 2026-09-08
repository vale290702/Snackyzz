import { icon } from "../components/ui.js";
import { escapeHtml as e } from "../lib/html.js";
export function renderSales({ salesPoints, selectedCity = "Todos" }) {
  const cities = ["Todos", ...new Set(salesPoints.map((p) => p.city))];
  const visible =
    selectedCity === "Todos"
      ? salesPoints
      : salesPoints.filter((p) => p.city === selectedCity);
  return `<main id="main" class="page-width inner-page sales-page" tabindex="-1"><div class="page-heading"><h1>Tu antojo, más cerca.</h1><p>Busca un punto de venta y encuentra tu próxima cookie.</p></div>${salesPoints.length ? `<div class="filter-row" aria-label="Filtrar por ciudad">${cities.map((city) => `<button data-city="${e(city)}" class="filter-button ${selectedCity === city ? "is-active" : ""}" aria-pressed="${selectedCity === city}">${e(city)}</button>`).join("")}</div><div class="location-list">${visible.map((point) => `<article class="location-card">${icon("pin")}<div><span>${e(point.city)}</span><h2>${e(point.name)}</h2><p>${e(point.address)}</p><p>${e(point.hours)}</p></div><a class="text-link" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(point.address + " " + point.city)}" target="_blank" rel="noopener noreferrer">Cómo llegar ${icon("arrow")}</a></article>`).join("")}</div>` : `<section class="locations-empty"><div class="location-art" aria-hidden="true">${icon("pin")}</div><h2>Pronto estaremos<br>más cerca de ti.</h2><p>Estamos preparando nuestra lista de puntos de venta. Mientras tanto, puedes explorar las cookies o escribirnos para consultar dónde encontrarlas.</p><div class="button-row"><a href="#shop" class="button button-dark">Ver las cookies ${icon("arrow")}</a><a href="mailto:Snackyzz.cookies@gmail.com" class="text-link">Escríbenos ${icon("mail")}</a></div></section>`}</main>`;
}
