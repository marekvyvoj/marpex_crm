const API_BASE = import.meta.env.VITE_API_URL || "/api";

export async function api<T = unknown>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = API_BASE === "/api" ? `${API_BASE}${path}` : `${API_BASE}/api${path}`;
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
