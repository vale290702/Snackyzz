"use client";

import { useEffect, useRef } from "react";

/**
 * Brings the editor to the owner whenever it opens on a record: on phones it renders below a long
 * list, so without this the form opens out of sight.
 * @param recordKey The record being edited (or the new-record marker); a change moves focus again.
 * @returns The ref for the editor's title.
 */
export function useEditorPanel(recordKey: string | null) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const title = titleRef.current;
    if (!title) {
      return;
    }

    const { top, bottom } = title.getBoundingClientRect();
    const isInView = top >= 0 && bottom <= window.innerHeight;
    if (!isInView) {
      title.scrollIntoView({ block: "start" });
    }

    title.focus({ preventScroll: true });
  }, [recordKey]);

  return { titleRef };
}
