import { act, renderHook } from "@testing-library/react";
import type { ChangeEvent } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useCatalogImageUpload } from "./use-catalog-image-upload.hook";
import { CatalogImagePurpose } from "../../domain/images";
import {
  createCatalogImageUploadAction,
  registerCatalogImageUploadAction,
} from "../../server/images/images.actions";

vi.mock("../../server/images/images.actions", () => ({
  createCatalogImageUploadAction: vi.fn(),
  registerCatalogImageUploadAction: vi.fn(),
}));

const FILE_ID = "00000000-0000-7000-8000-0000000000f1";
const OBJECT_PATH = "product_image/2026/10/photo.webp";
const SIGNED_URL = "https://storage.test/upload/photo.webp?token=t";
const PREVIEW_URL = "blob:preview";

const photo = new File([new Uint8Array([1, 2, 3])], "photo.webp", { type: "image/webp" });
const fetchMock = vi.fn();

function pick(file: File): ChangeEvent<HTMLInputElement> {
  return { target: { files: [file] } } as unknown as ChangeEvent<HTMLInputElement>;
}

function renderUpload() {
  return renderHook(() =>
    useCatalogImageUpload(CatalogImagePurpose.ProductImage, { fileId: null, previewUrl: null }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  URL.createObjectURL = vi.fn(() => PREVIEW_URL);
  URL.revokeObjectURL = vi.fn();
  vi.mocked(createCatalogImageUploadAction).mockResolvedValue({
    ok: true,
    value: { objectPath: OBJECT_PATH, signedUrl: SIGNED_URL, token: "t" },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useCatalogImageUpload", () => {
  it("starts from the record's image", () => {
    const { result } = renderHook(() =>
      useCatalogImageUpload(CatalogImagePurpose.BrandLogo, {
        fileId: FILE_ID,
        previewUrl: "https://storage.test/logo.png",
      }),
    );

    expect(result.current).toMatchObject({
      fileId: FILE_ID,
      previewUrl: "https://storage.test/logo.png",
      isUploading: false,
      error: null,
    });
  });

  it("uploads the bytes to the signed URL, registers them and previews the file", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    vi.mocked(registerCatalogImageUploadAction).mockResolvedValue({
      ok: true,
      value: { id: FILE_ID } as never,
    });
    const { result } = renderUpload();

    await act(async () => result.current.selectFile(pick(photo)));

    expect(createCatalogImageUploadAction).toHaveBeenCalledWith({
      purpose: CatalogImagePurpose.ProductImage,
      mimeType: "image/webp",
      sizeBytes: 3,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      SIGNED_URL,
      expect.objectContaining({ method: "PUT", body: photo }),
    );
    expect(registerCatalogImageUploadAction).toHaveBeenCalledWith({
      purpose: CatalogImagePurpose.ProductImage,
      objectPath: OBJECT_PATH,
    });
    expect(result.current).toMatchObject({ fileId: FILE_ID, previewUrl: PREVIEW_URL, error: null });
  });

  it("keeps the media code when the upload is refused", async () => {
    vi.mocked(createCatalogImageUploadAction).mockResolvedValue({
      ok: false,
      error: "rate_limited",
    });
    const { result } = renderUpload();

    await act(async () => result.current.selectFile(pick(photo)));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ fileId: null, error: "rate_limited" });
  });

  it("reports storage as unavailable when the bytes can't be sent", async () => {
    fetchMock.mockRejectedValue(new TypeError("network"));
    const { result } = renderUpload();

    await act(async () => result.current.selectFile(pick(photo)));

    expect(registerCatalogImageUploadAction).not.toHaveBeenCalled();
    expect(result.current.error).toBe("storage_unavailable");
  });

  it("removes the image and releases its preview", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    vi.mocked(registerCatalogImageUploadAction).mockResolvedValue({
      ok: true,
      value: { id: FILE_ID } as never,
    });
    const { result } = renderUpload();

    await act(async () => result.current.selectFile(pick(photo)));
    act(() => result.current.remove());

    expect(result.current).toMatchObject({ fileId: null, previewUrl: null });
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(PREVIEW_URL);
  });
});
