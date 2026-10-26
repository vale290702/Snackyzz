"use client";

import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ChangeEvent } from "react";

import { useErrorMessage } from "@/i18n/use-error-message.hook";
import { Button } from "@/shared/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/shared/ui/field";

import type { useCatalogImageUpload } from "../../hooks/manager/use-catalog-image-upload.hook";

const ACCEPTED_IMAGES = "image/jpeg,image/png,image/webp";

/**
 * Props for an image field.
 */
type ImageFieldProps = {
  id: string;
  label: string;
  hint: string;
  image: ReturnType<typeof useCatalogImageUpload>;
};

/**
 * An image picker that uploads right away, with its preview and status.
 * @param props The field's id, label and hint, and the upload state from the form's hook.
 * @returns The field.
 */
export function ImageField({ id, label, hint, image }: ImageFieldProps) {
  const translate = useTranslations("catalog.manager.image");
  const errorMessage = useErrorMessage("media");
  const error = errorMessage(image.error);
  const onChange = (event: ChangeEvent<HTMLInputElement>) => image.selectFile(event);

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id} className="text-xs font-semibold">
        {label}
      </FieldLabel>
      {image.previewUrl && (
        <div className="flex items-center gap-4">
          <Image
            src={image.previewUrl}
            alt=""
            width={72}
            height={72}
            unoptimized
            className="size-18 rounded-control border border-border object-cover"
          />
          <Button type="button" variant="ghost" size="sm" onClick={image.remove}>
            <X aria-hidden />
            {translate("remove")}
          </Button>
        </div>
      )}
      <div className="relative flex h-13 items-center justify-center gap-2 rounded-control border border-dashed border-border bg-background text-sm font-medium focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-orange-deep">
        <ImagePlus aria-hidden className="size-4" />
        <span id={`${id}-hint`}>{image.isUploading ? translate("uploading") : hint}</span>
        <input
          id={id}
          type="file"
          accept={ACCEPTED_IMAGES}
          disabled={image.isUploading}
          onChange={onChange}
          aria-describedby={error ? `${id}-hint ${id}-error` : `${id}-hint`}
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-wait"
        />
      </div>
      <FieldDescription aria-live="polite" className="sr-only">
        {image.isUploading ? translate("uploading") : null}
      </FieldDescription>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </Field>
  );
}
