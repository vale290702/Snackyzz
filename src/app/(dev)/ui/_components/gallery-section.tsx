import type { ReactNode } from "react";

type GallerySectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function GallerySection({ title, description, children }: GallerySectionProps) {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1 border-b border-border pb-4">
        <h2 className="font-display text-3xl font-bold">{title}</h2>
        <p className="max-w-prose text-muted-foreground">{description}</p>
      </header>
      {children}
    </section>
  );
}
