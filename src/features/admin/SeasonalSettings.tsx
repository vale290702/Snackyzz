"use client";
import { seasonalCampaigns } from "../../components/seasonal/seasonal-campaigns";
import { useState, type FormEvent } from "react";
import {
  seasonalThemes,
  normalizeSeasonalTheme,
  type SeasonalTheme,
} from "../../../supabase/functions/_shared/seasonal-theme";
import {
  SeasonalSurface,
  SeasonalDecor,
} from "../../components/seasonal/seasonal";
import type { AdminController } from "./useAdmin";
export function SeasonalSettings({
  controller: c,
}: {
  controller: AdminController;
}) {
  const published = normalizeSeasonalTheme(c.state.settings?.seasonal_theme);
  const [selected, setSelected] = useState<SeasonalTheme>(published);
  const [error, setError] = useState("");
  async function apply(event: FormEvent) {
    event.preventDefault();
    setError("");
    const saved = await c.storeAction(
      { action: "save-theme", theme: selected },
      "Tema de temporada actualizado.",
    );
    if (!saved)
      setError(
        "No se pudo aplicar el tema. Conservamos tu selección para que lo intentes de nuevo.",
      );
  }
  return (
    <section className="season-admin" aria-labelledby="season-admin-title">
      <h2 id="season-admin-title">Tema de temporada</h2>
      <p>
        Viste Snackyzz para cada celebración. El inicio lleva más decoración;
        las demás páginas, detalles ligeros. Baking Stereo conserva su
        identidad.
      </p>
      <form onSubmit={apply}>
        <div className="field">
          <label htmlFor="season-theme">Temporada</label>
          <select
            id="season-theme"
            value={selected}
            disabled={c.state.busy}
            onChange={(event) => {
              setSelected(normalizeSeasonalTheme(event.target.value));
              setError("");
            }}
          >
            {Object.entries(seasonalThemes).map(([id, theme]) => (
              <option value={id} key={id}>
                {theme.name}
              </option>
            ))}
          </select>
        </div>
        <SeasonalSurface theme={selected}>
          <div className="season-admin-preview">
            <img
              src={seasonalCampaigns[selected].image}
              alt={seasonalCampaigns[selected].imageAlt}
              width="120"
              height="140"
            />
            <div>
              <strong>{seasonalThemes[selected].name}</strong>
              <p>{seasonalThemes[selected].description}</p>
            </div>
            <SeasonalDecor placement="sample" />
          </div>
        </SeasonalSurface>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="order-decision-actions">
          <a
            className="button button-outline"
            href={`/?themePreview=${selected}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Vista previa <span className="sr-only">(abre en otra pestaña)</span>
          </a>
          <button
            className="button button-dark"
            disabled={c.state.busy || selected === published}
          >
            {c.state.busy ? "Aplicando…" : "Aplicar tema"}
          </button>
        </div>
        <small className="season-admin-status" role="status">
          Tema publicado: {seasonalThemes[published].name}. Cambiar la selección
          no modifica la tienda hasta aplicar.
        </small>
      </form>
    </section>
  );
}
