export const config = {
  apiUrl: (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
    .trim()
    .replace(/\/+$/, ""),
  demo: process.env.NEXT_PUBLIC_DEMO_MODE !== "false",
  timeout: 15000,
};

export const API_PROXY_PREFIX = "/api/service";

export function apiRequestUrl(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new Error("API requests require a service-relative path.");
  }
  return process.env.NODE_ENV === "production"
    ? `${API_PROXY_PREFIX}${path}`
    : `${config.apiUrl}${path}`;
}
