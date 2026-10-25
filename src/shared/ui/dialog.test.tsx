import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Button } from "./button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

function renderDialog() {
  return render(
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open</Button>
      </DialogTrigger>
      <DialogContent closeLabel="Close dialog">
        <DialogHeader>
          <DialogTitle>Cancel order</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Keep</Button>
          </DialogClose>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>,
  );
}

describe("Dialog", () => {
  it("opens as a labelled modal dialog and moves focus inside", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Open" }));

    const dialog = screen.getByRole("dialog", { name: "Cancel order" });
    expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it("traps focus: Tab and Shift+Tab cycle through the dialog's controls only", async () => {
    const user = userEvent.setup();
    renderDialog();
    await user.click(screen.getByRole("button", { name: "Open" }));
    const dialog = screen.getByRole("dialog");

    const visited: Array<string | null> = [];
    for (let step = 0; step < 6; step += 1) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
      visited.push(document.activeElement?.textContent ?? null);
    }
    expect(new Set(visited)).toEqual(new Set(["Keep", "Confirm", "Close dialog"]));

    await user.tab({ shift: true });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    renderDialog();
    const trigger = screen.getByRole("button", { name: "Open" });
    await user.click(trigger);

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("renders the close button only when given a label", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>No close button</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    await user.click(screen.getByRole("button", { name: "Open" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
