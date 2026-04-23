export async function createApp() {
  process.env.SESSION_SECRET ??= "test-session-secret-test-session-secret-test-session-secret-1234";
  process.env.DATABASE_URL ??= "postgresql://marpex:marpex@localhost:5432/marpex_crm";
  process.env.API_PORT ??= "3005";

  const { buildApp } = await import("../../../06_IMPLEMENTATION/apps/api/src/app.ts");
  const app = await buildApp();
  await app.ready();
  return app;
}

export async function loginAs(app: Awaited<ReturnType<typeof createApp>>, email: string, password: string, remoteAddress = "127.0.0.50") {
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    payload: { email, password },
    remoteAddress,
  });

  const rawCookie = response.headers["set-cookie"];
  const cookie = Array.isArray(rawCookie) ? rawCookie[0] : rawCookie;

  return {
    response,
    cookie: cookie?.split(";")[0] ?? "",
  };
}