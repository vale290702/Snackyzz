import { describe, expect, it } from "vitest";
import { z } from "zod";

import { FormFieldKind, FormInput } from ".";

const schema = z
  .object({
    email: z
      .string()
      .trim()
      .pipe(z.email({ error: "email_invalid" })),
    password: z.string().min(1, { error: "password_required" }),
    quantity: z.coerce.number().int().min(1),
  })
  .refine((input) => input.password !== input.email, { error: "password_matches_email" });

const codes = ["email_invalid", "password_required", "password_matches_email"] as const;

function formData(entries: Record<string, string>): FormData {
  const data = new FormData();
  for (const [field, value] of Object.entries(entries)) {
    data.set(field, value);
  }

  return data;
}

describe("FormInput.read", () => {
  it("parses the schema's fields and ignores extra entries", () => {
    const parsed = FormInput.read(
      schema,
      formData({ email: " ana@snackyzz.test ", password: "secret", quantity: "2", extra: "x" }),
      codes,
    );

    expect(parsed).toEqual({
      ok: true,
      input: { email: "ana@snackyzz.test", password: "secret", quantity: 2 },
    });
  });

  it("maps each invalid field to its first known code", () => {
    const parsed = FormInput.read(
      schema,
      formData({ email: "ana@", password: "", quantity: "1" }),
      codes,
    );

    expect(parsed).toEqual({
      ok: false,
      fieldErrors: { email: "email_invalid", password: "password_required" },
      formError: null,
    });
  });

  it("falls back to invalid_input for messages that are not listed codes", () => {
    const parsed = FormInput.read(
      schema,
      formData({ email: "ana@snackyzz.test", password: "secret", quantity: "0" }),
      codes,
    );

    expect(parsed).toMatchObject({ ok: false, fieldErrors: { quantity: "invalid_input" } });
  });

  it("treats a missing field as undefined", () => {
    const parsed = FormInput.read(schema, formData({ password: "secret", quantity: "1" }), codes);

    expect(parsed).toMatchObject({ ok: false, fieldErrors: { email: "invalid_input" } });
  });

  it("reports object-level issues as the form error", () => {
    const parsed = FormInput.read(
      schema,
      formData({ email: "ana@snackyzz.test", password: "ana@snackyzz.test", quantity: "1" }),
      codes,
    );

    expect(parsed).toEqual({ ok: false, fieldErrors: {}, formError: "password_matches_email" });
  });

  it("reads a checkbox as whether it was submitted", () => {
    const checkboxSchema = z.object({ isStockTracked: z.boolean() });
    const kinds = { isStockTracked: FormFieldKind.Checkbox };
    const checked = formData({ isStockTracked: "on" });

    expect(FormInput.read(checkboxSchema, checked, [], kinds)).toEqual({
      ok: true,
      input: { isStockTracked: true },
    });
    expect(FormInput.read(checkboxSchema, new FormData(), [], kinds)).toEqual({
      ok: true,
      input: { isStockTracked: false },
    });
  });

  it("reads a list field as every text entry, and as empty when none was submitted", () => {
    const listSchema = z.object({ categoryIds: z.array(z.string()) });
    const kinds = { categoryIds: FormFieldKind.List };
    const data = new FormData();
    data.append("categoryIds", "c1");
    data.append("categoryIds", "c2");
    data.append("categoryIds", new File(["x"], "ignored.png"));

    expect(FormInput.read(listSchema, data, [], kinds)).toEqual({
      ok: true,
      input: { categoryIds: ["c1", "c2"] },
    });
    expect(FormInput.read(listSchema, new FormData(), [], kinds)).toEqual({
      ok: true,
      input: { categoryIds: [] },
    });
  });

  it("accepts any submission for the empty schema", () => {
    expect(FormInput.read(FormInput.none, new FormData(), [])).toEqual({ ok: true, input: {} });
  });
});

describe("FormInput.values", () => {
  it("keeps only the listed text fields", () => {
    const data = formData({ email: "ana@", password: "secret" });
    data.set("avatar", new File(["x"], "avatar.png"));

    expect(FormInput.values(data, ["email", "avatar", "missing"])).toEqual({ email: "ana@" });
  });
});
