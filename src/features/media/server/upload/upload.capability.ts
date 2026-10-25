import "server-only";

import { CapabilityKind, defineCapability } from "@/shared/lib/capability";
import { Results, SharedError } from "@/shared/lib/result";

import { issueUpload } from "./create-upload.service";
import { registerUpload } from "./register-upload.service";
import type { UploadContext } from "./upload.types";
import {
  createUploadInputSchema,
  registerUploadInputSchema,
  UPLOAD_POLICIES,
  UploadPermission,
  type UploadPermissionValue,
  type UploadPurpose,
} from "../../domain/upload-policy";

/**
 * A capability serves only the purposes its permission guards, whichever transport calls it.
 * @param permission The capability's permission.
 * @param purpose The requested purpose.
 * @returns Whether the permission guards the purpose.
 */
function guardsPurpose(permission: UploadPermissionValue, purpose: UploadPurpose): boolean {
  return UPLOAD_POLICIES[purpose].permission === permission;
}

function defineCreateUpload(permission: UploadPermissionValue) {
  return defineCapability({
    name: "media.createUpload",
    kind: CapabilityKind.Mutation,
    permission,
    input: createUploadInputSchema,
    execute: (context: UploadContext, input) => {
      if (!guardsPurpose(permission, input.purpose)) {
        return Results.err(SharedError.Forbidden);
      }

      return issueUpload(input, context.admin.id, context.log);
    },
  });
}

function defineRegisterUpload(permission: UploadPermissionValue) {
  return defineCapability({
    name: "media.registerUpload",
    kind: CapabilityKind.Mutation,
    permission,
    input: registerUploadInputSchema,
    execute: (context: UploadContext, input) => {
      if (!guardsPurpose(permission, input.purpose)) {
        return Results.err(SharedError.Forbidden);
      }

      return registerUpload(input, context.admin.id, context.log);
    },
  });
}

/**
 * Staff upload URLs, keyed by the permission that guards the purpose.
 */
export const createUploadCapabilities = {
  [UploadPermission.RefundProofs]: defineCreateUpload(UploadPermission.RefundProofs),
  [UploadPermission.Catalog]: defineCreateUpload(UploadPermission.Catalog),
};

/**
 * Staff registrations, keyed by the permission that guards the purpose. Registration
 * re-checks the permission, since it may have been revoked after the URL was issued.
 */
export const registerUploadCapabilities = {
  [UploadPermission.RefundProofs]: defineRegisterUpload(UploadPermission.RefundProofs),
  [UploadPermission.Catalog]: defineRegisterUpload(UploadPermission.Catalog),
};
