import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import messages from "@/i18n/messages/es-CR";

import { SignInForm } from "./sign-in-form.component";
import { useSignInForm } from "../../hooks/sign-in/use-sign-in-form.hook";

vi.mock("../../hooks/sign-in/use-sign-in-form.hook", () => ({ useSignInForm: vi.fn() }));

type SignInFormState = ReturnType<typeof useSignInForm>;

function renderForm(state: Partial<SignInFormState>) {
  vi.mocked(useSignInForm).mockReturnValue({
    formAction: vi.fn(),
    isPending: false,
    state: { status: "idle", values: {} },
    values: {},
    fieldErrors: {},
    formError: null,
    ...state,
  });

  render(
    <NextIntlClientProvider locale="es-CR" messages={messages}>
      <SignInForm />
    </NextIntlClientProvider>,
  );
}

describe("SignInForm", () => {
  beforeEach(() => {
    vi.mocked(useSignInForm).mockReset();
  });

  it("renders a labelled form with no errors", () => {
    renderForm({});

    expect(screen.getByRole("form", { name: messages.access.signIn.title })).toBeInTheDocument();
    expect(screen.getByLabelText(messages.access.signIn.email.label)).not.toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("translates field codes and links them to their inputs", () => {
    renderForm({
      values: { email: "staff@" },
      fieldErrors: { email: "email_invalid", password: "password_required" },
    });

    const email = screen.getByLabelText(messages.access.signIn.email.label);
    expect(email).toHaveValue("staff@");
    expect(email).toHaveAttribute("aria-invalid", "true");
    expect(email).toHaveAccessibleDescription(messages.errors.access.email_invalid);
    expect(
      screen.getByLabelText(messages.access.signIn.password.label),
    ).toHaveAccessibleDescription(messages.errors.access.password_required);
  });

  it("shows the translated form error as an alert", () => {
    renderForm({ formError: "unexpected" });

    expect(screen.getByRole("alert")).toHaveTextContent(messages.errors.shared.unexpected);
  });
});
