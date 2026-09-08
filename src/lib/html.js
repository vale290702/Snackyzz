export function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
}
export function safeImage(value) {
  return /^\/assets\/[\w./-]+$/.test(value ?? "")
    ? value
    : "/assets/choco-cloud.webp";
}
