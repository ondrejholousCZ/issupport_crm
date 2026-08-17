import "server-only";

import {
  FileSASPermissions,
  generateFileSASQueryParameters,
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

  return {
    account,
    accountKey,
    fileEndpoint: trimTrailingSlash(fileEndpoint),
    shareName,
  };
}

function getStorageConfig(): StorageConfig {
  const shareName = process.env.AZURE_STORAGE_FILE_SHARE?.trim() || "faktury";
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING?.trim();
  if (connectionString) {
    return parseConnectionString(connectionString, shareName);
  }

  const account = process.env.AZURE_STORAGE_ACCOUNT?.trim();
  const accountKey = process.env.AZURE_STORAGE_ACCESS_KEY?.trim();
  const fileEndpoint =
    process.env.AZURE_STORAGE_FILE_ENDPOINT?.trim() ||
    (account ? `https://${account}.file.core.windows.net` : "");

  if (!account || !accountKey || !fileEndpoint) {
    throw new Error(
      "Azure Storage není nakonfigurován. Nastavte AZURE_STORAGE_CONNECTION_STRING, nebo AZURE_STORAGE_ACCOUNT + AZURE_STORAGE_ACCESS_KEY (+ volitelně AZURE_STORAGE_FILE_ENDPOINT).",
    );
  }

  return {
    account,
    accountKey,
    fileEndpoint: trimTrailingSlash(fileEndpoint),
    shareName,
  };
}

function getShareServiceClient(config: StorageConfig): ShareServiceClient {
  const credential = new StorageSharedKeyCredential(config.account, config.accountKey);
  return new ShareServiceClient(config.fileEndpoint, credential);
}

function wrapStorageError(err: unknown, config: StorageConfig): Error {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("ENOTFOUND") || message.includes("getaddrinfo")) {
    return new Error(
      `Azure File Storage „${config.account}/${config.shareName}“ není z Vercelu dostupný (DNS: ${config.fileEndpoint}). ` +
        "Ověřte File endpoint v Azure Portal a povolený veřejný přístup (Networking → Public network access).",
    );
  }
  return err instanceof Error ? err : new Error(message);
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

function parseFilePath(filePath: string): { directory: string; fileName: string } {
  const slash = filePath.indexOf("/");
  if (slash <= 0 || slash === filePath.length - 1) {
    throw new Error(`Neplatná cesta k souboru ve file share: ${filePath}`);
  }
  return {
    directory: filePath.slice(0, slash),
    fileName: filePath.slice(slash + 1),
  };
}

export async function uploadFakturaPdf(filePath: string, pdf: Buffer): Promise<void> {
  const config = getStorageConfig();
  const { directory, fileName } = parseFilePath(filePath);

  try {
    const shareClient = getShareServiceClient(config).getShareClient(config.shareName);
    const directoryClient = shareClient.getDirectoryClient(directory);
    await directoryClient.createIfNotExists();

    const fileClient = directoryClient.getFileClient(fileName);
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

  const sas = generateFileSASQueryParameters(
    {
      shareName: config.shareName,
      filePath,
      permissions: FileSASPermissions.parse("r"),
      startsOn: new Date(Date.now() - 60_000),
      expiresOn,
    },
    credential,
  ).toString();

  const encodedPath = filePath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `${config.fileEndpoint}/${config.shareName}/${encodedPath}?${sas}`;
}
