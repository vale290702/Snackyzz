export function escapeHtml(value: unknown = "") {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string,string>)[char],
  );
}
export function safeImage(value: unknown) {
  const source = String(value ?? "");
  const hostedProduct =
    /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/product-images\/[A-Za-z0-9._~!$&'()*+,;=:@%/-]+$/i.test(
      source,
    );
  return /^\/assets\/[\w./-]+$/.test(source) || hostedProduct
    ? source
    : "/assets/choco-cloud.webp";
}
