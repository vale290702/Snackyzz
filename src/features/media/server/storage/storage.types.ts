/**
 * A one-time token the browser uploads an object with.
 */
export type SignedUpload = {
  signedUrl: string;
  token: string;
};
