import { Icon } from "../../components/store/ui";
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
          src="/assets/brand/baking-stereo-ivory-hero.jpeg"
          alt=""
          width={1600}
          height={900}
          fetchPriority="high"
        />
      </h1>
      <p className="baking-credit">
        A COLLABORATION WITH <span>SNACKYZZ</span>
      </p>
      <button className="baking-explore" onClick={explore}>
        Explorar cookies <Icon name="arrow" />
      </button>
    </header>
  );
}
