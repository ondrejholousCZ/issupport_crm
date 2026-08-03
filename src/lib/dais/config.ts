const DEFAULT_DAIS_API_BASE_URL = "https://resvm1.issupport.cz:8443/api/v1";

export function getDaisApiBaseUrl(): string {
  return process.env.DAIS_API_BASE_URL?.trim() || DEFAULT_DAIS_API_BASE_URL;
}

export function getDaisApiKey(): string | undefined {
  return process.env.DAIS_API_KEY?.trim() || undefined;
}

export function isDaisApiConfigured(): boolean {
  return Boolean(getDaisApiKey());
}
