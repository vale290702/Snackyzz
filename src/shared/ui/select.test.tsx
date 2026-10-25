import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Label } from "./label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

function renderSelect(onValueChange = vi.fn()) {
  render(
    <>
      <Label htmlFor="fulfillment">Fulfillment</Label>
      <Select onValueChange={onValueChange}>
        <SelectTrigger id="fulfillment">
          <SelectValue placeholder="Choose one" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pickup">Pickup</SelectItem>
          <SelectItem value="delivery">Delivery</SelectItem>
          <SelectItem value="locker" disabled>
            Locker
          </SelectItem>
        </SelectContent>
      </Select>
    </>,
  );

  return onValueChange;
}

describe("Select", () => {
  it("is a combobox named by its label", () => {
    renderSelect();

    expect(screen.getByRole("combobox", { name: "Fulfillment" })).toHaveTextContent("Choose one");
  });

  it("opens with the keyboard, moves with arrows and selects with Enter", async () => {
    const user = userEvent.setup();
    const onValueChange = renderSelect();
    const trigger = screen.getByRole("combobox", { name: "Fulfillment" });

    trigger.focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Pickup" })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: "Delivery" })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("delivery");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveTextContent("Delivery");
    expect(trigger).toHaveFocus();
  });

  it("skips disabled items and closes on Escape without changing the value", async () => {
    const user = userEvent.setup();
    const onValueChange = renderSelect();
    const trigger = screen.getByRole("combobox", { name: "Fulfillment" });

    trigger.focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(screen.getByRole("option", { name: "Delivery" })).toHaveFocus();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onValueChange).not.toHaveBeenCalled();
    expect(trigger).toHaveTextContent("Choose one");
  });
});
