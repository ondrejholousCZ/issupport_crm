/** Veřejná URL aplikace pro odkazy v e-mailech (schválení výkazu apod.). */
export function getAppUrl(): string {
  const candidates = [
    process.env.APP_URL,
    process.env.AUTH_URL,
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ];

  for (const raw of candidates) {
    if (!raw?.trim()) continue;
    return normalizeAppUrl(raw);
  }

  return "http://localhost:3000";
}

function normalizeAppUrl(raw: string): string {
  let url = raw.trim().replace(/\/$/, "");
  const authPath = url.indexOf("/api/auth");
  if (authPath > 0) {
    url = url.slice(0, authPath);
  }
  return url;
}
