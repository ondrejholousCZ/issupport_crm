import "server-only";

import {
  BlobSASPermissions,
  BlobServiceClient,
  generateBlobSASQueryParameters,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

const SAS_VALID_YEARS = 5;

function getStorageConfig() {
  const account = process.env.AZURE_STORAGE_ACCOUNT?.trim();
  const accountKey = process.env.AZURE_STORAGE_ACCESS_KEY?.trim();
  const container = process.env.AZURE_STORAGE_CONTAINER?.trim() || "faktury";

  if (!account || !accountKey) {
    throw new Error(
      "Azure Storage není nakonfigurován (AZURE_STORAGE_ACCOUNT, AZURE_STORAGE_ACCESS_KEY).",
    );
  }

  return { account, accountKey, container };
}

function getBlobServiceClient() {
  const { account, accountKey } = getStorageConfig();
  const credential = new StorageSharedKeyCredential(account, accountKey);
  return new BlobServiceClient(`https://${account}.blob.core.windows.net`, credential);
}

/** Složka YYYYMM podle měsíce vystavení faktury (srpen 2026 → 202608). */
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

export function buildFakturaBlobPath(input: {
  datumVystaveni: string;
  cisloFaktury: string;
  idokladId: number;
}): string {
  const folder = buildFakturaBlobFolder(input.datumVystaveni);
  const filename = sanitizeFilename(input.cisloFaktury, input.idokladId);
  return `${folder}/${filename}`;
}

export async function uploadFakturaPdf(blobPath: string, pdf: Buffer): Promise<void> {
  const { container } = getStorageConfig();
  const client = getBlobServiceClient();
  const containerClient = client.getContainerClient(container);
  await containerClient.createIfNotExists();

  const blobClient = containerClient.getBlockBlobClient(blobPath);
  await blobClient.uploadData(pdf, {
    blobHTTPHeaders: { blobContentType: "application/pdf" },
  });
}

/** Veřejně čitelná URL s SAS tokenem pro stažení PDF. */
export function getFakturaBlobReadUrl(blobPath: string): string {
  const { account, accountKey, container } = getStorageConfig();
  const credential = new StorageSharedKeyCredential(account, accountKey);
  const expiresOn = new Date();
  expiresOn.setFullYear(expiresOn.getFullYear() + SAS_VALID_YEARS);

  const sas = generateBlobSASQueryParameters(
    {
      containerName: container,
      blobName: blobPath,
      permissions: BlobSASPermissions.parse("r"),
      startsOn: new Date(Date.now() - 60_000),
      expiresOn,
    },
    credential,
  ).toString();

  const encodedPath = blobPath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

  return `https://${account}.blob.core.windows.net/${container}/${encodedPath}?${sas}`;
}
