export function isVisitToken(token: unknown): token is string {
  return typeof token === "string" && /^[a-f0-9]{64}$/.test(token);
}

export function isVisitId(id: string) {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id);
}

export function createVisitToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (value) => value.toString(16).padStart(2, "0")).join("");
}

export function readVisitToken(hash: string) {
  const token = new URLSearchParams(hash.replace(/^#/, "")).get("token");
  return isVisitToken(token) ? token : null;
}

export function handleVisitHashChange(hash: string, onPrivateLink: () => void) {
  // Section anchors belong to the editor and must not reload unsaved work.
  if (readVisitToken(hash)) onPrivateLink();
}

export function getSharedVisitPath(value: string, origin: string) {
  try {
    const url = new URL(value.trim());
    const match = url.pathname.match(/^\/photographers\/visit\/([^/]+)\/?$/);
    if (url.origin !== origin || !match || !isVisitId(match[1]) || !readVisitToken(url.hash)) return null;
    return `${url.pathname}${url.hash}`;
  } catch { return null; }
}
