import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it, vi } from "vitest";

import messages from "@/i18n/messages/es-CR";

import { SignOutButton } from "./sign-out-button.component";
import { useSignOutButton } from "../../hooks/sign-out/use-sign-out-button.hook";

vi.mock("../../hooks/sign-out/use-sign-out-button.hook", () => ({ useSignOutButton: vi.fn() }));

describe("SignOutButton", () => {
  it("shows the translated failure as an alert", () => {
    vi.mocked(useSignOutButton).mockReturnValue({
      formAction: vi.fn(),
      isPending: false,
      state: { status: "failed", values: {}, error: "sign_out_failed" },
      values: {},
      fieldErrors: {},
      formError: "sign_out_failed",
    });

    render(
      <NextIntlClientProvider locale="es-CR" messages={messages}>
        <SignOutButton />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole("button", { name: messages.access.signOut.submit })).toBeEnabled();
    expect(screen.getByRole("alert")).toHaveTextContent(messages.errors.access.sign_out_failed);
  });
});
