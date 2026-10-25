import { describe, expect, it, vi } from "vitest";

import { SigningScope } from "./signing.constants";
import { MediaSigning } from "./signing.helper";

vi.mock("@/shared/config/env.server", () => ({
  serverEnv: { MEDIA_SIGNING_SECRET: "test-secret-with-at-least-32-characters" },
}));

describe("MediaSigning", () => {
  it("signs deterministically", () => {
    expect(MediaSigning.sign(SigningScope.RateKey, "192.0.2.4")).toBe(
      MediaSigning.sign(SigningScope.RateKey, "192.0.2.4"),
    );
  });

  it("gives each scope its own signature for the same message", () => {
    expect(MediaSigning.sign(SigningScope.RateKey, "payload")).not.toBe(
      MediaSigning.sign(SigningScope.UploadReceipt, "payload"),
    );
  });
});
