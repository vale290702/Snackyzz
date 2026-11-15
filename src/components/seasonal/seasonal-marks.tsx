import type { SeasonalTheme } from "../../../supabase/functions/_shared/seasonal-theme";
const motifNames: Record<Exclude<SeasonalTheme, "original">, string> = {
  valentines: "heart",
  easter: "egg",
  halloween: "pumpkin",
  thanksgiving: "leaf",
  christmas: "tree",
  "new-year": "firework",
};
function Star() {
  return (
    <path d="M60 27c0 22 11 33 33 33-22 0-33 11-33 33 0-22-11-33-33-33 22 0 33-11 33-33Z" />
  );
}
export function SeasonalMark({
  theme,
  variant = 0,
}: {
  theme: Exclude<SeasonalTheme, "original">;
  variant?: number;
}) {
  const accent = variant % 3 === 1;
  const spark = variant % 3 === 2;
  const motif = spark ? "star" : accent ? "detail" : motifNames[theme];
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      data-motif={motif}
    >
      {spark ? (
        <Star />
      ) : (
        <>
          {theme === "valentines" &&
            (accent ? (
              <>
                <path d="M21 62c13-18 26-18 39 0s26 18 39 0M21 62c13 18 26 18 39 0s26-18 39 0" />
                <circle
                  cx="60"
                  cy="62"
                  r="4"
                  fill="currentColor"
                  stroke="none"
                />
              </>
            ) : (
              <>
                <path d="M60 98 24 63C-3 36 35 5 60 35 85 5 123 36 96 63Z" />
                <path d="M60 84 34 59C17 42 39 23 60 48" opacity=".4" />
              </>
            ))}
          {theme === "easter" &&
            (accent ? (
              <>
                <path d="M60 104V28M60 70C37 70 28 55 31 38c20 1 29 12 29 32Zm0-21c23 0 32-15 29-32-20 1-29 12-29 32Z" />
              </>
            ) : (
              <>
                <path d="M60 14c-18 0-35 34-35 58a35 35 0 0 0 70 0c0-24-17-58-35-58Z" />
                <path d="M28 61q32-16 64 0M26 80q34 16 68 0" />
                {[43, 60, 77].map((x) => (
                  <circle
                    key={x}
                    cx={x}
                    cy="70"
                    r="2"
                    fill="currentColor"
                    stroke="none"
                  />
                ))}
              </>
            ))}
          {theme === "halloween" &&
            (accent ? (
              <path d="M60 48 51 37l-1 16C34 38 21 34 10 38c8 9 10 17 8 26 15-5 24 1 28 15 7-6 12-5 14 5 2-10 7-11 14-5 4-14 13-20 28-15-2-9 0-17 8-26-11-4-24 0-40 15l-1-16Z" />
            ) : (
              <>
                <path d="M60 31c-2-11 3-18 11-23M60 35C15 14 7 97 45 103c10 4 20 4 30 0 38-6 30-89-15-68Z" />
                <path
                  d="M60 35c-20 12-25 49-9 68m9-68c20 12 25 49 9 68M60 35v69"
                  opacity=".6"
                />
              </>
            ))}
          {theme === "thanksgiving" &&
            (accent ? (
              <>
                <path d="M60 106V18M60 37C43 37 32 28 30 17c17-1 28 5 30 20Zm0 25C41 62 28 53 25 40c20-1 32 6 35 22Zm0 25c-19 0-32-9-35-22 20-1 32 6 35 22Zm0-38c19 0 32-9 35-22-20-1-32 6-35 22Zm0 25c19 0 32-9 35-22-20-1-32 6-35 22Z" />
              </>
            ) : (
              <>
                <path d="m60 12 10 24 21-8-7 23 24 7-24 15 7 18-22-3-9 22-9-22-22 3 7-18-24-15 24-7-7-23 21 8Z" />
                <path d="M60 36v71M60 75 39 58m21 17 21-17" opacity=".65" />
              </>
            ))}
          {theme === "christmas" &&
            (accent ? (
              <>
                <path d="M60 8v22M53 30h14v9H53z" />
                <circle cx="60" cy="70" r="31" />
                <path d="M31 59q29 17 58 0M31 81q29-17 58 0" opacity=".55" />
              </>
            ) : (
              <>
                <path
                  d="m60 12 3 7 8 1-6 6 1 8-6-4-6 4 1-8-6-6 8-1Z"
                  fill="var(--season-gold)"
                  stroke="none"
                />
                <path
                  d="m60 34 18 23H68l24 25H78l25 25H17l25-25H28l24-25H42Z"
                  fill="var(--season-wash)"
                />
                <path d="M55 107v8h10v-8" />
                <circle
                  cx="58"
                  cy="69"
                  r="2"
                  fill="var(--season-accent)"
                  stroke="none"
                />
                <circle
                  cx="73"
                  cy="92"
                  r="2"
                  fill="var(--season-gold)"
                  stroke="none"
                />
                <circle
                  cx="42"
                  cy="94"
                  r="2"
                  fill="var(--season-accent)"
                  stroke="none"
                />
              </>
            ))}
          {theme === "new-year" &&
            (accent ? (
              <>
                <circle cx="60" cy="60" r="27" />
                <circle cx="60" cy="60" r="34" opacity=".35" />
                <path d="M60 39v21l14 9" />
                <path d="M60 13v5m47 42h-5M60 107v-5M13 60h5" />
              </>
            ) : (
              <>
                {Array.from({ length: 8 }, (_, i) => (
                  <g key={i} transform={`rotate(${i * 45} 60 60)`}>
                    <path d="M60 20v16" />
                    <circle
                      cx="60"
                      cy="12"
                      r="2"
                      fill="currentColor"
                      stroke="none"
                    />
                  </g>
                ))}
                <path
                  d="m60 46 3 11 11 3-11 3-3 11-3-11-11-3 11-3Z"
                  fill="var(--season-gold)"
                  stroke="none"
                />
              </>
            ))}
        </>
      )}
    </svg>
  );
}
