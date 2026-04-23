const baseUrl = process.env.MARPEX_BASE_URL ?? "http://127.0.0.1:3005";
const email = process.env.MARPEX_EMAIL ?? "manager@marpex.sk";
const password = process.env.MARPEX_PASSWORD ?? "manager123";
const concurrency = Number(process.env.MARPEX_CONCURRENCY ?? 10);
const durationMs = Number(process.env.MARPEX_DURATION_MS ?? 10_000);

async function login() {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed with status ${response.status}`);
  }

  const cookie = response.headers.get("set-cookie");
  if (!cookie) {
    throw new Error("Session cookie was not returned by login endpoint.");
  }

  return cookie;
}

async function worker(cookie, stopAt, stats) {
  while (Date.now() < stopAt) {
    const startedAt = performance.now();

    try {
      const response = await fetch(`${baseUrl}/api/dashboard`, {
        headers: { cookie },
      });

      const duration = performance.now() - startedAt;
      stats.latencies.push(duration);

      if (!response.ok) {
        stats.errors += 1;
        continue;
      }

      stats.requests += 1;
    } catch {
      stats.errors += 1;
    }
  }
}

function percentile(values, ratio) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.floor(sorted.length * ratio));
  return sorted[index];
}

async function main() {
  const cookie = await login();
  const stopAt = Date.now() + durationMs;
  const stats = { requests: 0, errors: 0, latencies: [] };

  await Promise.all(Array.from({ length: concurrency }, () => worker(cookie, stopAt, stats)));

  const p95 = percentile(stats.latencies, 0.95).toFixed(2);
  const avg = stats.latencies.length === 0
    ? "0.00"
    : (stats.latencies.reduce((sum, value) => sum + value, 0) / stats.latencies.length).toFixed(2);

  console.log(JSON.stringify({
    baseUrl,
    concurrency,
    durationMs,
    requests: stats.requests,
    errors: stats.errors,
    averageMs: Number(avg),
    p95Ms: Number(p95),
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});