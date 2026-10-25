/**
 * Expected failures of the media feature; copy lives in `errors.media`.
 * Codes never carry storage paths or provider messages.
 */
export const MediaError = {
  UnsupportedPurpose: "unsupported_purpose",
  InvalidFileType: "invalid_file_type",
  FileTooLarge: "file_too_large",
  InvalidDimensions: "invalid_dimensions",
  InvalidImage: "invalid_image",
  InvalidUpload: "invalid_upload",
  RateLimited: "rate_limited",
  StorageUnavailable: "storage_unavailable",
  FileNotFound: "file_not_found",
} as const;

/**
 * An expected media failure.
 */
export type MediaErrorCode = (typeof MediaError)[keyof typeof MediaError];
