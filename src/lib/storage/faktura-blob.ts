import "server-only";

import {
  BlobSASPermissions,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

const SAS_VALID_YEARS = 5;

type StorageConfig = {
  account: string;
  accountKey: string;
  blobEndpoint: string;
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function parseConnectionString(connectionString: string): StorageConfig {
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
  const blobEndpoint =
    parts.BlobEndpoint?.trim() ||
    (account ? `${protocol}://${account}.blob.${suffix}` : "");

  if (!account || !accountKey || !blobEndpoint) {
    throw new Error(
      "AZURE_STORAGE_CONNECTION_STRING musí obsahovat AccountName, AccountKey a BlobEndpoint (nebo EndpointSuffix).",
    );
  }

  return { account, accountKey, blobEndpoint: trimTrailingSlash(blobEndpoint) };
}

function getStorageConfig(): StorageConfig {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING?.trim();
  if (connectionString) {
    return parseConnectionString(connectionString);
  }

  const account = process.env.AZURE_STORAGE_ACCOUNT?.trim();
  const accountKey = process.env.AZURE_STORAGE_ACCESS_KEY?.trim();
  const blobEndpoint =
    process.env.AZURE_STORAGE_BLOB_ENDPOINT?.trim() ||
    (account ? `https://${account}.blob.core.windows.net` : "");

  if (!account || !accountKey || !blobEndpoint) {
    throw new Error(
      "Azure Storage není nakonfigurován. Nastavte AZURE_STORAGE_CONNECTION_STRING, nebo AZURE_STORAGE_ACCOUNT + AZURE_STORAGE_ACCESS_KEY (+ volitelně AZURE_STORAGE_BLOB_ENDPOINT).",
    );
  }

  return { account, accountKey, blobEndpoint: trimTrailingSlash(blobEndpoint) };
}

function getBlobServiceClient(config: StorageConfig): BlobServiceClient {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING?.trim();
  if (connectionString) {
    return BlobServiceClient.fromConnectionString(connectionString);
  }

  const credential = new StorageSharedKeyCredential(config.account, config.accountKey);
  return new BlobServiceClient(config.blobEndpoint, credential);
}

function wrapStorageError(err: unknown, config: StorageConfig): Error {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("ENOTFOUND") || message.includes("getaddrinfo")) {
    return new Error(
      `Azure Storage účet „${config.account}“ není z Vercelu dostupný (DNS: ${config.blobEndpoint}). ` +
        "Ověřte přesný název storage accountu a Blob endpoint v Azure Portal → Storage account → Endpoints. " +
        "Pro upload z Vercelu musí být povolený veřejný přístup (Networking → Public network access).",
    );
  }
  return err instanceof Error ? err : new Error(message);
}

/** Kontejner YYYYMM podle měsíce vystavení faktury (srpen 2026 → 202608). */
export function buildFakturaBlobFolder(datumVystaveni: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(datumVystaveni);
  if (!match) {
    throw new Error(`Neplatné datum vystavení pro blob složku: ${datumVystaveni}`);
  }
  return `${match[1]}${match[2]}`;
}

function sanitizeFilename(cisloFaktury: string, idokladId: number): string {
  const base = cisloFaktury.trim().replace(/[^\w.-]+/g, "_").replace(/_+/g, "_");
  const name = base || `faktura_${idokladId}`;
  return name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`;
}

export type FakturaBlobTarget = {
  container: string;
  blobName: string;
  path: string;
};

export function buildFakturaBlobTarget(input: {
  datumVystaveni: string;
  cisloFaktury: string;
  idokladId: number;
}): FakturaBlobTarget {
  const container = buildFakturaBlobFolder(input.datumVystaveni);
  const blobName = sanitizeFilename(input.cisloFaktury, input.idokladId);
  return { container, blobName, path: `${container}/${blobName}` };
}

/** @deprecated Použijte buildFakturaBlobTarget — path ve tvaru container/blob.pdf */
export function buildFakturaBlobPath(input: {
  datumVystaveni: string;
  cisloFaktury: string;
  idokladId: number;
}): string {
  return buildFakturaBlobTarget(input).path;
}

function parseBlobPath(blobPath: string): { container: string; blobName: string } {
  const slash = blobPath.indexOf("/");
  if (slash <= 0 || slash === blobPath.length - 1) {
    throw new Error(`Neplatná blob cesta: ${blobPath}`);
  }
  return {
    container: blobPath.slice(0, slash),
    blobName: blobPath.slice(slash + 1),
  };
}

export async function uploadFakturaPdf(blobPath: string, pdf: Buffer): Promise<void> {
  const config = getStorageConfig();
  const { container, blobName } = parseBlobPath(blobPath);

  try {
    const client = getBlobServiceClient(config);
    const containerClient = client.getContainerClient(container);
    await containerClient.createIfNotExists();

    const blobClient = containerClient.getBlockBlobClient(blobName);
    await blobClient.uploadData(pdf, {
      blobHTTPHeaders: { blobContentType: "application/pdf" },
    });
  } catch (err) {
    throw wrapStorageError(err, config);
  }
}

/** Veřejně čitelná URL s SAS tokenem pro stažení PDF. */
export function getFakturaBlobReadUrl(blobPath: string): string {
  const config = getStorageConfig();
  const { container, blobName } = parseBlobPath(blobPath);
  const credential = new StorageSharedKeyCredential(config.account, config.accountKey);
  const expiresOn = new Date();
  expiresOn.setFullYear(expiresOn.getFullYear() + SAS_VALID_YEARS);

  const sas = generateBlobSASQueryParameters(
    {
      containerName: container,
      blobName,
      permissions: BlobSASPermissions.parse("r"),
      startsOn: new Date(Date.now() - 60_000),
      expiresOn,
    },
    credential,
  ).toString();

  const encodedBlob = encodeURIComponent(blobName);
  return `${config.blobEndpoint}/${container}/${encodedBlob}?${sas}`;
}
