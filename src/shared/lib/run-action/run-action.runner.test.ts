import { notFound, permanentRedirect, redirect } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runAction } from ".";
import { err, ok } from "../result";

beforeEach(() => {
  // Why: bypass Vitest's buffered console to observe JSON lines at the stdout boundary.
  vi.spyOn(globalThis.console, "log").mockImplementation((line: string) => {
    process.stdout.write(line + "\n");
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("runAction", () => {
  it("logs safe diagnostics for a plain database error and rounds duration", async () => {
    const write = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    vi.spyOn(performance, "now").mockReturnValueOnce(10).mockReturnValueOnce(11.234);
    const failure = {
      name: "PostgrestError",
      code: "23505",
      message: "private-input",
      details: "secret",
    };

    expect(
      await runAction("sample.database", () => {
        throw failure;
      }),
    ).toEqual(err("unexpected"));
    const records = write.mock.calls.map(([line]) => JSON.parse(String(line)));
    expect(records[1]).toMatchObject({ name: "PostgrestError", code: "23505" });
    expect(records.at(-1)).toMatchObject({ durationMs: 1, error: "unexpected" });
    expect(write.mock.calls.join("")).not.toContain("private-input");
    expect(write.mock.calls.join("")).not.toContain("secret");
  });

  it("returns results and correlates start, steps and finish with duration", async () => {
    const write = vi.spyOn(process.stdout, "write").mockReturnValue(true);

    expect(
      await runAction("sample.run", async (log) => {
        log.step("loaded", { count: 1 });
        return ok(42);
      }),
    ).toEqual(ok(42));

    const records = write.mock.calls.map(([line]) => JSON.parse(String(line)));
    expect(records.map((record) => record.msg)).toEqual(["start", "loaded", "finish"]);
    expect(new Set(records.map((record) => record.correlationId)).size).toBe(1);
    expect(records[0].correlationId).toEqual(expect.any(String));
    expect(records[2]).toMatchObject({ outcome: "ok", durationMs: expect.any(Number) });
    expect(records[2].durationMs).toBeGreaterThanOrEqual(0);

    expect(await runAction("sample.denied", () => err("forbidden"))).toEqual(err("forbidden"));
    const last = JSON.parse(String(write.mock.calls.at(-1)?.[0]));
    expect(last).toMatchObject({ outcome: "error", error: "forbidden" });
    expect(last.correlationId).not.toBe(records[0].correlationId);
  });

  it("converts bugs to unexpected and logs stack frames without raw error details", async () => {
    const write = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    const bug = new Error("secret-token ana@example.test");
    bug.stack = "Error: secret-token ana@example.test\n    at execute (/app/sample.ts:10:2)";

    expect(
      await runAction("sample.fail", async () => {
        throw bug;
      }),
    ).toEqual(err("unexpected"));
    const output = write.mock.calls.map(([line]) => String(line)).join("");
    expect(output).toContain("at execute (/app/sample.ts:10:2)");
    expect(output).not.toContain("secret-token");
    expect(output).not.toContain("ana@example.test");
    expect(JSON.parse(String(write.mock.calls.at(-1)?.[0]))).toMatchObject({
      msg: "finish",
      outcome: "unexpected",
      durationMs: expect.any(Number),
    });
  });

  it("handles non-Error throws without logging their payload", async () => {
    const write = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    expect(
      await runAction("sample.fail", () => {
        throw "private-token";
      }),
    ).toEqual(err("unexpected"));
    expect(write.mock.calls.join("")).not.toContain("private-token");
  });

  it.each([() => redirect("/"), () => permanentRedirect("/"), () => notFound()])(
    "rethrows actual Next signals unchanged",
    async (signal) => {
      const write = vi.spyOn(process.stdout, "write").mockReturnValue(true);
      let caught: unknown;
      try {
        signal();
      } catch (error) {
        caught = error;
      }

      await expect(
        runAction("sample.navigate", () => {
          throw caught;
        }),
      ).rejects.toBe(caught);
      const records = write.mock.calls.map(([line]) => JSON.parse(String(line)));
      expect(records.some((record) => record.level === "error")).toBe(false);
      expect(records.at(-1)).toMatchObject({ msg: "finish", outcome: "interrupted" });
    },
  );
});
