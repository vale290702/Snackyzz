import { describe, expect, it, vi } from "vitest";

import { SigningScope } from "./signing.constants";
import { MediaSigning } from "./signing.helper";

vi.mock("@/shared/config/env.server", () => ({
  serverEnv: { MEDIA_SIGNING_SECRET: "test-secret-with-at-least-32-characters" },
}));

describe("MediaSigning", () => {
  it("verifies its own signatures", () => {
    const signature = MediaSigning.sign(SigningScope.UploadReceipt, "payload");

    expect(MediaSigning.verify(SigningScope.UploadReceipt, "payload", signature)).toBe(true);
  });

  it("rejects a signature made for another scope or message", () => {
    const signature = MediaSigning.sign(SigningScope.RateKey, "payload");

    expect(MediaSigning.verify(SigningScope.UploadReceipt, "payload", signature)).toBe(false);
    expect(MediaSigning.verify(SigningScope.RateKey, "other", signature)).toBe(false);
  });

  it("rejects malformed signatures", () => {
    expect(MediaSigning.verify(SigningScope.RateKey, "payload", "not-a-signature")).toBe(false);
  });
});
