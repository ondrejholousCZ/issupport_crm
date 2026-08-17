const TOKEN_URL = "https://identity.idoklad.cz/server/connect/token";
const API_BASE = "https://api.idoklad.cz/v3";

type TokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

function getCredentials() {
  const clientId = process.env.IDOKLAD_CLIENT_ID;
  const clientSecret = process.env.IDOKLAD_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("iDoklad není nakonfigurován (IDOKLAD_CLIENT_ID, IDOKLAD_CLIENT_SECRET).");
  }
  return { clientId, clientSecret };
}

async function fetchAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const { clientId, clientSecret } = getCredentials();
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "idoklad_api",
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`iDoklad autentizace selhala (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as TokenResponse;
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

export async function idokladRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await fetchAccessToken();
  const url = path.startsWith("http") ? path : `${API_BASE}/${path.replace(/^\//, "")}`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    const msg =
      typeof parsed === "object" && parsed && "Message" in parsed
        ? String((parsed as { Message: string }).Message)
        : text.slice(0, 300);
    throw new Error(`iDoklad API ${method} ${path} (${res.status}): ${msg}`);
  }

  return parsed as T;
}

export type IdokladListResponse<T> = {
  Data?: {
    Items?: T[];
    TotalItems?: number;
  };
};

export type IdokladItemResponse<T> = {
  Data?: T;
};

export const IDOKLAD_APP_URL = "https://app.idoklad.cz";
