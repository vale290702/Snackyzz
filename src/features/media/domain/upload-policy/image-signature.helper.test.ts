import { describe, expect, it } from "vitest";

import { ImageSignature } from "./image-signature.helper";
import { ImageMime } from "./upload-policy.constants";

const ascii = (text: string) => [...text].map((character) => character.charCodeAt(0));

describe("ImageSignature", () => {
  it.each([
    ["JPEG", [0xff, 0xd8, 0xff, 0xe0], ImageMime.Jpeg],
    ["PNG", [0x89, ...ascii("PNG"), 0x0d, 0x0a, 0x1a, 0x0a], ImageMime.Png],
    ["WebP", [...ascii("RIFF"), 20, 0, 0, 0, ...ascii("WEBPVP8 ")], ImageMime.Webp],
    ["WAV in a RIFF container", [...ascii("RIFF"), 20, 0, 0, 0, ...ascii("WAVE")], null],
    ["SVG", ascii("<svg>"), null],
    ["a truncated JPEG", [0xff, 0xd8], null],
    ["an empty file", [], null],
  ])("detects %s from its leading bytes", (_name, bytes, expected) => {
    expect(ImageSignature.detect(new Uint8Array(bytes))).toBe(expected);
  });
});
