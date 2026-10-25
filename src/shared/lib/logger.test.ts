import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createLogger, logger, mask } from "./logger";

beforeEach(() => {
  // Why: bypass Vitest's buffered console to observe JSON lines at the stdout boundary.
  vi.stubGlobal("console", { log: (line: string) => process.stdout.write(line + "\n") });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("logger", () => {
  it("writes JSON lines to stdout with context and named steps", () => {
    const write = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    const log = createLogger({ action: "sample.run", correlationId: "test-id" });

    log.step("loaded", { count: 2 });
    logger.info("ready");

    expect(JSON.parse(String(write.mock.calls[0]?.[0]))).toMatchObject({
      level: "info",
      msg: "loaded",
      action: "sample.run",
      correlationId: "test-id",
      count: 2,
    });
    expect(String(write.mock.calls[0]?.[0])).toMatch(/\n$/);
    expect(JSON.parse(String(write.mock.calls[1]?.[0]))).toMatchObject({
      level: "info",
      msg: "ready",
    });
  });

  it("masks contact details and redacts sensitive fields and URLs", () => {
    const write = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    logger.error("failed", {
      token: "private-token",
      secret: "private-secret",
      proofUrl: "https://example.test/proof",
      email: mask.email("ana@example.test"),
      phone: mask.phone("+506 8888-1234"),
      detail: "ana@example.test https://example.test/private",
    });

    const output = String(write.mock.calls[0]?.[0]);
    expect(output).not.toContain("private-token");
    expect(output).not.toContain("private-secret");
    expect(output).not.toContain("https://");
    expect(output).not.toContain("ana@example.test");
    expect(output).toContain("a***@example.test");
    expect(output).toContain("****1234");
  });
});

it("keeps UUIDs intact and prevents data from replacing bound context", () => {
  const write = vi.spyOn(process.stdout, "write").mockReturnValue(true);
  const correlationId = "66d355c1-1234-4124-9f54-c6bda0c7fc12";
  createLogger({ correlationId }).step("done", { correlationId: "override", level: "fake" });

  expect(JSON.parse(String(write.mock.calls[0]?.[0]))).toMatchObject({
    correlationId,
    level: "info",
  });
});

it("masks numeric phone fields and short raw contact fields", () => {
  const write = vi.spyOn(process.stdout, "write").mockReturnValue(true);
  logger.info("contact", { phone: 88881234, backupPhone: "1234", email: "invalid" });

  expect(JSON.parse(String(write.mock.calls[0]?.[0]))).toMatchObject({
    phone: "****1234",
    backupPhone: "****",
    email: "***",
  });
});
