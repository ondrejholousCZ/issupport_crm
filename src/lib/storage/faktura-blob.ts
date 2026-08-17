import "server-only";

import {
  FileSASPermissions,
  generateFileSASQueryParameters,
  ShareClient,
  ShareDirectoryClient,
  ShareServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-file-share";

const SAS_VALID_YEARS = 5;

type StorageConfig = {
  account: string;
  accountKey: string;
  fileEndpoint: string;
  shareName: string;
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function readEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

function validateFileEndpoint(endpoint: string): void {
  if (endpoint.includes(".blob.")) {
    throw new Error(
      "Azure endpoint směřuje na Blob storage (.blob.core.windows.net), ale FaktuMatch používá File share. " +
        "Ve Vercelu smažte AZURE_STORAGE_FILE_ENDPOINT (nebo nastavte https://<account>.file.core.windows.net) " +
        "a také AZURE_STORAGE_CONTAINER — ten se u file share nepoužívá.",
    );
  }
  if (!endpoint.includes(".file.")) {
    throw new Error(
      `Neplatný File endpoint „${endpoint}". Očekává se https://<account>.file.core.windows.net`,
    );
  }
}

function buildFileEndpoint(account: string): string {
  const custom = readEnv("AZURE_STORAGE_FILE_ENDPOINT");
  if (custom) {
    validateFileEndpoint(custom);
    return trimTrailingSlash(custom);
  }
  return `https://${account}.file.core.windows.net`;
}

function parseConnectionString(connectionString: string, shareName: string): StorageConfig {
  const parts = Object.fromEntries(
    connectionString
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const idx = part.indexOf("=");
        if (idx === -1) return [part, ""] as const;
        return [part.slice(0, idx), part.slice(idx + 1)] as const;
      }),
  ) as Record<string, string>;

  const account = parts.AccountName?.trim();
  const accountKey = parts.AccountKey?.trim();
  const suffix = parts.EndpointSuffix?.trim() || "core.windows.net";
  const protocol = parts.DefaultEndpointsProtocol?.trim() || "https";
  const fileEndpoint =
    parts.FileEndpoint?.trim() ||
    (account ? `${protocol}://${account}.file.${suffix}` : "");

  if (!account || !accountKey || !fileEndpoint) {
    throw new Error(
      "AZURE_STORAGE_CONNECTION_STRING musí obsahovat AccountName, AccountKey a FileEndpoint (nebo EndpointSuffix).",
    );
  }

  validateFileEndpoint(fileEndpoint);

  return {
    account,
    accountKey,
    fileEndpoint: trimTrailingSlash(fileEndpoint),
    shareName,
  };
}

function getStorageConfig(): StorageConfig {
  const shareName = readEnv("AZURE_STORAGE_FILE_SHARE", "AZURE_FILES_SHARE") || "faktury";

  // Stejné proměnné jako ve FaktuMatchu (fakturacni_asistent) — aliasy pro Vercel.
  const account = readEnv("AZURE_STORAGE_ACCOUNT", "AZURE_FILES_ACCOUNT");
  const accountKey = readEnv("AZURE_STORAGE_ACCESS_KEY", "AZURE_FILES_KEY");

  if (account && accountKey) {
    const fileEndpoint = buildFileEndpoint(account);
    return { account, accountKey, fileEndpoint, shareName };
  }

  const connectionString = readEnv("AZURE_STORAGE_CONNECTION_STRING");
  if (connectionString) {
    return parseConnectionString(connectionString, shareName);
  }

  throw new Error(
    "Azure File Storage není nakonfigurován. Nastavte AZURE_STORAGE_ACCOUNT + AZURE_STORAGE_ACCESS_KEY " +
      "(nebo AZURE_FILES_ACCOUNT + AZURE_FILES_KEY jako ve FaktuMatchu), případně AZURE_STORAGE_CONNECTION_STRING.",
  );
}

function getShareServiceClient(config: StorageConfig): ShareServiceClient {
  const credential = new StorageSharedKeyCredential(config.account, config.accountKey);
  return new ShareServiceClient(config.fileEndpoint, credential);
}

function wrapStorageError(err: unknown, config: StorageConfig): Error {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("ENOTFOUND") || message.includes("getaddrinfo")) {
    return new Error(
      `Azure File Storage „${config.account}/${config.shareName}" není dostupný (DNS: ${config.fileEndpoint}). ` +
        "Ověřte ve Vercelu: AccountName=pgrisspfaktumatch, endpoint .file.core.windows.net (ne .blob.), " +
        "Networking → Public network access = Enabled.",
    );
  }
  return err instanceof Error ? err : new Error(message);
}

async function ensureDirectoryTree(share: ShareClient, filePath: string): Promise<void> {
  const parts = filePath.replace(/^\/+/, "").split("/");
  parts.pop();
  if (parts.length === 0) return;

  let current: ShareDirectoryClient = share.rootDirectoryClient;
  for (const part of parts) {
    const next = current.getDirectoryClient(part);
    await next.createIfNotExists();
    current = next;
  }
}

/** Složka YYYYMM podle měsíce vystavení faktury (srpen 2026 → 202608). */
export function buildFakturaBlobFolder(datumVystaveni: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(datumVystaveni);
  if (!match) {
    throw new Error(`Neplatné datum vystavení pro složku faktury: ${datumVystaveni}`);
  }
  return `${match[1]}${match[2]}`;
}

function sanitizeFilename(cisloFaktury: string, idokladId: number): string {
  const base = cisloFaktury.trim().replace(/[^\w.-]+/g, "_").replace(/_+/g, "_");
  const name = base || `faktura_${idokladId}`;
  return name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`;
}

export type FakturaBlobTarget = {
  /** Název file share (např. faktury). */
  shareName: string;
  /** Složka uvnitř share (YYYYMM). */
  directory: string;
  /** Název souboru. */
  fileName: string;
  /** Relativní cesta uvnitř share: YYYYMM/soubor.pdf */
  path: string;
};

export function buildFakturaBlobTarget(input: {
  datumVystaveni: string;
  cisloFaktury: string;
  idokladId: number;
}): FakturaBlobTarget {
  const config = getStorageConfig();
  const directory = buildFakturaBlobFolder(input.datumVystaveni);
  const fileName = sanitizeFilename(input.cisloFaktury, input.idokladId);
  return {
    shareName: config.shareName,
    directory,
    fileName,
    path: `${directory}/${fileName}`,
  };
}

/** @deprecated Použijte buildFakturaBlobTarget */
export function buildFakturaBlobPath(input: {
  datumVystaveni: string;
  cisloFaktury: string;
  idokladId: number;
}): string {
  return buildFakturaBlobTarget(input).path;
}

export async function uploadFakturaPdf(filePath: string, pdf: Buffer): Promise<void> {
  const config = getStorageConfig();
  const normalized = filePath.replace(/^\/+/, "");

  try {
    const shareClient = getShareServiceClient(config).getShareClient(config.shareName);
    await ensureDirectoryTree(shareClient, normalized);
    const fileClient = shareClient.rootDirectoryClient.getFileClient(normalized);
    await fileClient.create(pdf.length, {
      fileHttpHeaders: { fileContentType: "application/pdf" },
    });
    await fileClient.uploadRange(pdf, 0, pdf.length);
  } catch (err) {
    throw wrapStorageError(err, config);
  }
}

/** URL se SAS tokenem pro stažení PDF ze file share. */
export function getFakturaBlobReadUrl(filePath: string): string {
  const config = getStorageConfig();
  const credential = new StorageSharedKeyCredential(config.account, config.accountKey);
  const expiresOn = new Date();
  expiresOn.setFullYear(expiresOn.getFullYear() + SAS_VALID_YEARS);

  const normalized = filePath.replace(/^\/+/, "");
  const sas = generateFileSASQueryParameters(
    {
      shareName: config.shareName,
      filePath: normalized,
      permissions: FileSASPermissions.parse("r"),
      startsOn: new Date(Date.now() - 60_000),
      expiresOn,
    },
    credential,
  ).toString();

  const encodedPath = normalized
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${config.fileEndpoint}/${config.shareName}/${encodedPath}?${sas}`;
}

/** Ověření připojení ke share — pro diagnostiku. */
export async function testFakturaStorageConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const config = getStorageConfig();
    const share = getShareServiceClient(config).getShareClient(config.shareName);
    const props = await share.getProperties();
    return {
      ok: true,
      message: `Připojeno ke share „${config.shareName}" na ${config.fileEndpoint} (quota ${props.quota ?? "—"} GB)`,
    };
  } catch (err) {
    const config = getStorageConfig();
    const wrapped = wrapStorageError(err, config);
    return { ok: false, message: wrapped.message };
  }
}
