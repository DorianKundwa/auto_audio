/**
 * API Routing & Endpoint Helpers
 * Automatically directs client requests directly to the FastAPI backend
 * to bypass Next.js 10MB proxy request body limits.
 */

export function getBackendUrl(): string {
  if (typeof window !== "undefined") {
    // Check if injected into window
    const win = window as unknown as { __BACKEND_URL__?: string };
    if (win.__BACKEND_URL__) {
      return win.__BACKEND_URL__.replace(/\/$/, "");
    }
  }

  // Check NEXT_PUBLIC_BACKEND_URL injected by launch.py or next.config.ts
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL.replace(/\/$/, "");
  }

  // Default local development URL
  return "http://127.0.0.1:8000";
}

export function apiUrl(path: string): string {
  const base = getBackendUrl();
  const cleanPath = path.startsWith("/") ? path : "/" + path;
  return `${base}${cleanPath}`;
}
