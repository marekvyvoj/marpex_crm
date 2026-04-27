import "./setup.ts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { api, buildApiUrl, resolveApiBase } from "../../06_IMPLEMENTATION/apps/web/src/lib/api.ts";

describe("web api client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns JSON body for successful responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ ok: true }),
    }));

    await expect(api("/health")).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith("/api/health", expect.objectContaining({ credentials: "include" }));
  });

  it("normalizes API base values with or without /api suffix", () => {
    expect(resolveApiBase("/api")).toBe("/api");
    expect(resolveApiBase("https://marpexcrm-production.up.railway.app")).toBe("https://marpexcrm-production.up.railway.app/api");
    expect(resolveApiBase("https://marpexcrm-production.up.railway.app/api")).toBe("https://marpexcrm-production.up.railway.app/api");
    expect(buildApiUrl("/auth/login", "https://marpexcrm-production.up.railway.app/api")).toBe("https://marpexcrm-production.up.railway.app/api/auth/login");
  });

  it("returns undefined for 204 responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.resolve(undefined),
    }));

    await expect(api("/auth/logout", { method: "POST" })).resolves.toBeUndefined();
  });

  it("redirects to login on unauthorized non-auth responses", async () => {
    const locationMock = { href: "http://localhost/dashboard" } as Location;
    vi.spyOn(window, "location", "get").mockReturnValue(locationMock);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "Unauthorized" }),
    }));

    await expect(api("/customers")).rejects.toThrow("Unauthorized");
    expect(locationMock.href).toBe("/login");
  });

  it("propagates API error messages without redirecting auth endpoints", async () => {
    const locationMock = { href: "http://localhost/login" } as Location;
    vi.spyOn(window, "location", "get").mockReturnValue(locationMock);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: "Bad credentials" }),
    }));

    await expect(api("/auth/login", { method: "POST" })).rejects.toThrow("Bad credentials");
    expect(locationMock.href).toBe("http://localhost/login");
  });
});