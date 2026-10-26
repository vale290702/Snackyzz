import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { useServerForm } from ".";

const schema = z.object({
  name: z.string().trim().min(1, { error: "required" }),
  price: z.coerce.number({ error: "price_invalid" }).int({ error: "price_invalid" }),
});

const values = { name: "Choco", price: "2500" };

describe("useServerForm", () => {
  it("sends parsed input to the action and reports success", async () => {
    const action = vi.fn().mockResolvedValue({ ok: true, value: "saved" });
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useServerForm({ schema, values, action, onSuccess }));

    await act(() => result.current.submit());

    expect(action).toHaveBeenCalledWith({ name: "Choco", price: 2500 });
    expect(onSuccess).toHaveBeenCalledWith("saved");
    expect(result.current.formError).toBeNull();
  });

  it("reports field codes without calling the action", async () => {
    const action = vi.fn();
    const { result } = renderHook(() =>
      useServerForm({ schema, values, action, fieldErrorCodes: ["required"] }),
    );

    act(() => {
      result.current.form.setValue("name", " ");
      result.current.form.setValue("price", "1.5");
    });
    await act(() => result.current.submit());

    expect(action).not.toHaveBeenCalled();
    expect(result.current.fieldErrors).toEqual({ name: "required", price: "invalid_input" });
  });

  it("keeps the action's error code, and an unexpected one when the call throws", async () => {
    const action = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, error: "slug_taken" })
      .mockRejectedValueOnce(new Error("offline"));
    const { result } = renderHook(() => useServerForm({ schema, values, action }));

    await act(() => result.current.submit());
    expect(result.current.formError).toBe("slug_taken");

    await act(() => result.current.submit());
    expect(result.current.formError).toBe("unexpected");
  });

  it("reports dirty changes, and clean on unmount", async () => {
    const onDirtyChange = vi.fn();
    const { result, unmount } = renderHook(() =>
      useServerForm({ schema, values, action: vi.fn(), onDirtyChange }),
    );

    act(() => result.current.form.setValue("name", "Choco Cloud", { shouldDirty: true }));
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(true));

    act(() => result.current.form.setValue("name", "Choco", { shouldDirty: true }));
    await waitFor(() => expect(onDirtyChange).toHaveBeenLastCalledWith(false));

    unmount();
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });

  it("takes refreshed server values but keeps fields the user changed", async () => {
    const { result, rerender } = renderHook(
      (current: typeof values) => useServerForm({ schema, values: current, action: vi.fn() }),
      { initialProps: values },
    );

    act(() => result.current.form.setValue("name", "Typed", { shouldDirty: true }));
    rerender({ name: "Server", price: "4100" });

    await waitFor(() => expect(result.current.form.getValues("price")).toBe("4100"));
    expect(result.current.form.getValues("name")).toBe("Typed");
  });
});
