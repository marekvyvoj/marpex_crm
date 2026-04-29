function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function resolveNormalizedApiBase(rawBase: string) {
  const normalizedBase = trimTrailingSlash(rawBase || "/api");

  if (!normalizedBase || normalizedBase === "/api") {
    return "/api";
  }

  return normalizedBase.endsWith("/api") ? normalizedBase : `${normalizedBase}/api`;
}

function shouldUseSameOriginProxy(apiBase: string, browserOrigin?: string) {
  if (!browserOrigin || apiBase === "/api") {
    return false;
  }

  try {
    const apiUrl = new URL(apiBase, browserOrigin);
    return apiUrl.origin !== browserOrigin;
  } catch {
    return false;
  }
}

export function resolveApiBase(
  rawBase = import.meta.env.VITE_API_URL || "/api",
  browserOrigin = typeof window === "undefined" ? undefined : window.location.origin,
) {
  const apiBase = resolveNormalizedApiBase(rawBase);
  return shouldUseSameOriginProxy(apiBase, browserOrigin) ? "/api" : apiBase;
}

export function buildApiUrl(path: string, apiBase = resolveApiBase()) {
  return `${apiBase}${path}`;
}

export async function api<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = buildApiUrl(path);
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (res.status === 401 && !path.startsWith("/auth/")) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
