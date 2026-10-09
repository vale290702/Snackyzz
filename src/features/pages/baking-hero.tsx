import { Icon } from "../../components/store/ui";
function Sparkle({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" aria-hidden="true">
      <path
        d="M20 0C23 14 26 17 40 20C26 23 23 26 20 40C17 26 14 23 0 20C14 17 17 14 20 0Z"
        fill="currentColor"
      />
    </svg>
  );
}
export function BakingHero() {
  function explore() {
    const collection = document.getElementById("baking-collection");
    collection?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
    collection?.focus({ preventScroll: true });
  }
  return (
    <header className="baking-hero">
      <h1 className="baking-wordmark">
        <span className="sr-only">Snackyzz X Baking Stereo</span>
        <img
          src="/assets/brand/baking-stereo-white.jpeg"
          alt=""
          width={1280}
          height={1280}
          fetchPriority="high"
        />
      </h1>
      <Sparkle className="baking-sparkle baking-sparkle-left" />
      <Sparkle className="baking-sparkle baking-sparkle-right" />
      <p className="baking-credit">
        A COLLABORATION WITH <span>SNACKYZZ</span>
      </p>
      <button className="baking-explore" onClick={explore}>
        Explorar cookies <Icon name="arrow" />
      </button>
    </header>
  );
}
