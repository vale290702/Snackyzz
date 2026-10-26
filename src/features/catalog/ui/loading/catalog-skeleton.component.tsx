import { useTranslations } from "next-intl";

/**
 * A shelf-shaped fallback while brand and product data is loading.
 * @returns A single announced loading state and decorative product placeholders.
 */
export function CatalogShelfSkeleton() {
  const translate = useTranslations("catalog.loading");

  return (
    <div role="status" aria-busy="true" className="mx-auto max-w-page px-5 py-12 md:px-8 lg:px-14">
      <span className="sr-only">{translate("catalog")}</span>
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        <div className="mb-6 h-14 w-2/3 rounded-control bg-cream-tint md:w-1/3" />
        <div className="mb-12 h-5 w-3/4 rounded-control bg-cream-tint md:w-1/2" />
        <div className="grid gap-8 md:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="grid gap-4">
              <div className="aspect-square rounded-surface bg-cream-tint" />
              <div className="h-7 w-3/4 rounded-control bg-cream-tint" />
              <div className="h-4 rounded-control bg-cream-tint" />
              <div className="h-12 rounded-control bg-cream-tint" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * A list-shaped fallback for the owner's catalog manager.
 * @returns Decorative filters and rows with one accessible loading announcement.
 */
export function CatalogManagerSkeleton() {
  const translate = useTranslations("catalog.loading");

  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{translate("catalog")}</span>
      <div aria-hidden="true" className="grid gap-8 motion-safe:animate-pulse">
        <div className="h-10 w-2/3 rounded-control bg-cream-tint md:w-1/3" />
        <div className="h-14 w-1/2 rounded-control bg-cream-tint" />
        <div className="h-10 w-3/4 rounded-control bg-cream-tint" />
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="flex gap-5 rounded-surface bg-paper p-5">
            <div className="size-20 shrink-0 rounded-control bg-cream-tint" />
            <div className="grid flex-1 gap-3 py-2">
              <div className="h-5 w-2/3 rounded-control bg-cream-tint" />
              <div className="h-4 w-1/2 rounded-control bg-cream-tint" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
