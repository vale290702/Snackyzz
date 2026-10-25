import { act, renderHook } from "@testing-library/react";
import { startTransition } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSignOutButton } from "./use-sign-out-button.hook";
import { signOutAction } from "../../server/sign-out/sign-out.actions";

vi.mock("../../server/sign-out/sign-out.actions", () => ({ signOutAction: vi.fn() }));

describe("useSignOutButton", () => {
  beforeEach(() => {
    vi.mocked(signOutAction).mockReset();
  });

  it("reports sign_out_failed when the session could not be ended", async () => {
    vi.mocked(signOutAction).mockResolvedValue({ ok: false, error: "sign_out_failed" });
    const { result } = renderHook(useSignOutButton);

    expect(result.current.formError).toBeNull();
    await act(async () => {
      startTransition(() => result.current.formAction(new FormData()));
    });

    expect(signOutAction).toHaveBeenCalledOnce();
    expect(result.current.formError).toBe("sign_out_failed");
  });

  it("is pending while the action runs", async () => {
    vi.mocked(signOutAction).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(useSignOutButton);

    await act(async () => {
      startTransition(() => result.current.formAction(new FormData()));
    });

    expect(result.current.isPending).toBe(true);
  });
});
