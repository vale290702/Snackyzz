import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useEditorPanel } from "./use-editor-panel.hook";

function titleAt(top: number) {
  const title = document.createElement("h2");
  title.tabIndex = -1;
  title.scrollIntoView = vi.fn();
  title.getBoundingClientRect = () => DOMRect.fromRect({ y: top, height: 30, width: 200 });
  document.body.append(title);

  return title;
}

function renderPanel(title: HTMLHeadingElement, recordKey = "new") {
  return renderHook(
    ({ key }) => {
      const panel = useEditorPanel(key);
      // The hook's ref is attached by the component; attach it by hand before the effect runs.
      panel.titleRef.current ??= title;

      return panel;
    },
    { initialProps: { key: recordKey } },
  );
}

afterEach(() => {
  document.body.replaceChildren();
});

describe("useEditorPanel", () => {
  it("scrolls an editor opened out of sight to its title and focuses it", () => {
    const title = titleAt(window.innerHeight + 4000);

    renderPanel(title);

    expect(title.scrollIntoView).toHaveBeenCalledWith({ block: "start" });
    expect(document.activeElement).toBe(title);
  });

  it("only moves focus when the title is already in view", () => {
    const title = titleAt(40);

    renderPanel(title);

    expect(title.scrollIntoView).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(title);
  });

  it("brings the editor back when it switches to another record", () => {
    const title = titleAt(window.innerHeight + 4000);
    const { rerender } = renderPanel(title);
    title.blur();

    rerender({ key: "product-2" });

    expect(title.scrollIntoView).toHaveBeenCalledTimes(2);
    expect(document.activeElement).toBe(title);
  });
});
