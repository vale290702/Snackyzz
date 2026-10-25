import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";

import { CapabilityKind, CapabilitySource, defineCapability, type CapabilityContext } from ".";
import { err, ok } from "../result";

type Context = CapabilityContext<
  { fetch: () => number },
  "sample.read" | "sample.write",
  { id: string }
>;

function context(source: Context["source"] = CapabilitySource.AdminWeb): Context {
  return {
    client: { fetch: () => 42 },
    admin: { id: "fixture" },
    source,
    permissions: new Set(["sample.read"]),
  };
}

describe("defineCapability", () => {
  it("denies permission before parsing or executing", async () => {
    const parse = vi.fn((value: string) => value);
    const execute = vi.fn(() => ok(1));
    const capability = defineCapability({
      name: "sample.write",
      kind: CapabilityKind.Mutation,
      permission: "sample.write",
      input: z.string().transform(parse),
      execute,
    });

    expect(await capability.run(context(), "valid")).toEqual(err("forbidden"));
    expect(parse).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it("rejects invalid input without executing or returning input details", async () => {
    const execute = vi.fn(() => ok(1));
    const capability = defineCapability({
      name: "sample.read",
      kind: CapabilityKind.Query,
      permission: "sample.read",
      input: z.number(),
      execute,
    });

    expect(await capability.run(context(), "private-input")).toEqual(err("invalid_input"));
    expect(execute).not.toHaveBeenCalled();
  });

  it.each([CapabilitySource.AdminWeb, CapabilitySource.Messaging])(
    "passes parsed input and typed context from %s",
    async (source) => {
      const capabilityContext = context(source);
      const execute = vi.fn((received: Context, input: number) => {
        expectTypeOf(received.client.fetch()).toEqualTypeOf<number>();
        expect(received).toBe(capabilityContext);
        return ok(input + received.client.fetch());
      });
      const capability = defineCapability({
        name: "sample.read",
        kind: CapabilityKind.Query,
        permission: "sample.read",
        input: z.string().transform(Number),
        execute,
      });

      expect(await capability.run(capabilityContext, "8")).toEqual(ok(50));
      expect(execute).toHaveBeenCalledWith(capabilityContext, 8);
    },
  );

  it("preserves expected failures and lets bugs reach the action boundary", async () => {
    const execute = vi.fn(() => err("sample_failure"));
    const capability = defineCapability({
      name: "sample.read",
      kind: CapabilityKind.Query,
      permission: "sample.read",
      input: z.string(),
      execute,
    });

    expect(await capability.run(context(), "input")).toEqual(err("sample_failure"));
    const bug = new Error("bug");
    execute.mockImplementation(() => {
      throw bug;
    });
    await expect(capability.run(context(), "input")).rejects.toBe(bug);
  });
});
