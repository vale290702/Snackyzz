"use client";

import { useEffect, useRef, useState, useTransition, type ChangeEvent } from "react";

import type { FileRef, MediaErrorCode } from "@/features/media";
import { Results, type SharedErrorCode } from "@/shared/lib/result";
import type { ActionResult } from "@/shared/lib/run-action";

import type { CatalogImagePurposeValue } from "../../domain/images";
import {
  createCatalogImageUploadAction,
  registerCatalogImageUploadAction,
} from "../../server/images/images.actions";

const STORAGE_UNAVAILABLE: MediaErrorCode = "storage_unavailable";

/**
 * An image a form will attach: the uploaded file and what to preview.
 */
type CatalogImage = {
  fileId: string | null;
  previewUrl: string | null;
};

/**
 * Uploads one image: ask for a signed URL, send the bytes straight to storage, then register.
 * @param purpose The catalog purpose the image is for.
 * @param file The picked file.
 * @returns The registered file, or the media code of the step that failed.
 */
async function uploadCatalogImage(
  purpose: CatalogImagePurposeValue,
  file: File,
): Promise<ActionResult<FileRef, MediaErrorCode>> {
  const ticket = await createCatalogImageUploadAction({
    purpose,
    mimeType: file.type,
    sizeBytes: file.size,
  });
  if (!ticket.ok) {
    return ticket;
  }

  const stored = await fetch(ticket.value.signedUrl, {
    method: "PUT",
    headers: { "content-type": file.type, "x-upsert": "false" },
    body: file,
  }).catch(() => null);
  if (!stored?.ok) {
    return Results.err(STORAGE_UNAVAILABLE);
  }

  return registerCatalogImageUploadAction({ purpose, objectPath: ticket.value.objectPath });
}

/**
 * State for a form's image field: uploads a picked file right away so the form submits only its id.
 * @param purpose The catalog purpose the image is for.
 * @param initial The image the record has now.
 * @returns The file id and preview, the upload state and error code, and the change handlers.
 */
export function useCatalogImageUpload(purpose: CatalogImagePurposeValue, initial: CatalogImage) {
  const [image, setImage] = useState<CatalogImage>(initial);
  const [error, setError] = useState<MediaErrorCode | SharedErrorCode | null>(null);
  const [isUploading, startUpload] = useTransition();
  const objectUrl = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrl.current) {
        URL.revokeObjectURL(objectUrl.current);
      }
    };
  }, []);

  function showPreview(file: File | null, fileId: string | null) {
    if (objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current);
    }

    objectUrl.current = file ? URL.createObjectURL(file) : null;
    setImage({ fileId, previewUrl: objectUrl.current });
  }

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    startUpload(async () => {
      setError(null);
      const uploaded = await uploadCatalogImage(purpose, file);
      if (!uploaded.ok) {
        setError(uploaded.error);
        return;
      }

      showPreview(file, uploaded.value.id);
    });
  }

  return {
    ...image,
    isUploading,
    error,
    selectFile,
    remove: () => showPreview(null, null),
  };
}
