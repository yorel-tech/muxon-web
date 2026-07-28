import { fetchOidcConfigIfNeeded, getUserManager } from "@/lib/oidc";
import { apiGet, apiPost } from "@/lib/api";

export const DEFAULT_CHUNK_SIZE = 64 * 1024 * 1024; // 64 MiB

export interface UploadSessionDto {
  id: string;
  itemId?: string;
  status?: string;
  totalSize?: number;
  chunkSize?: number;
  uploadedBytes?: number;
  checksumAlgorithm?: string;
  expectedChecksum?: string;
  expiresAt?: string;
}

async function getBearerToken(): Promise<string | null> {
  if (typeof window !== "undefined") {
    await fetchOidcConfigIfNeeded();
  }
  const um = getUserManager();
  if (!um) return null;
  try {
    const user = await um.getUser();
    return user?.access_token ?? null;
  } catch {
    return null;
  }
}

function uploadBasePath(
  scope: "platform" | "tenant",
  libraryId: string,
  itemId: string,
  tenantId?: string
): string {
  if (scope === "platform") {
    return `/api/v1/platform/content-libraries/${libraryId}/items/${itemId}/uploads`;
  }
  if (!tenantId) throw new Error("tenantId required for tenant-scoped upload");
  return `/api/v1/tenants/${tenantId}/content-libraries/${libraryId}/items/${itemId}/uploads`;
}

/**
 * Initiate upload session (JSON). Backend may return 404 if upload API is not deployed.
 */
export async function initiateUploadSession(
  scope: "platform" | "tenant",
  libraryId: string,
  itemId: string,
  body: {
    totalSize: number;
    checksumAlgorithm: string;
    expectedChecksum: string;
    chunkSizeHint?: number;
  },
  tenantId?: string
): Promise<UploadSessionDto> {
  const base = uploadBasePath(scope, libraryId, itemId, tenantId);
  return apiPost<UploadSessionDto>(base, body);
}

export async function getUploadSession(
  scope: "platform" | "tenant",
  libraryId: string,
  itemId: string,
  uploadId: string,
  tenantId?: string
): Promise<UploadSessionDto> {
  const base = uploadBasePath(scope, libraryId, itemId, tenantId);
  return apiGet<UploadSessionDto>(`${base}/${uploadId}`);
}

export async function completeUploadSession(
  scope: "platform" | "tenant",
  libraryId: string,
  itemId: string,
  uploadId: string,
  tenantId?: string
): Promise<unknown> {
  const base = uploadBasePath(scope, libraryId, itemId, tenantId);
  return apiPost(`${base}/${uploadId}/complete`, {});
}

export interface UploadProgress {
  uploadedBytes: number;
  totalSize: number;
  phase: "hashing" | "uploading" | "completing" | "done" | "error";
  message?: string;
}

export interface UploadFileInChunksOptions {
  scope: "platform" | "tenant";
  libraryId: string;
  itemId: string;
  uploadId: string;
  file: File;
  totalSize: number;
  chunkSize?: number;
  tenantId?: string;
  onProgress?: (p: UploadProgress) => void;
  signal?: AbortSignal;
}

/**
 * Stream file chunks via PUT with Content-Range (per content upload API plan).
 */
export async function uploadFileInChunks(options: UploadFileInChunksOptions): Promise<void> {
  const {
    scope,
    libraryId,
    itemId,
    uploadId,
    file,
    totalSize,
    chunkSize = DEFAULT_CHUNK_SIZE,
    tenantId,
    onProgress,
    signal,
  } = options;

  const token = await getBearerToken();
  if (!token) throw new Error("Authentication required for upload");

  const base = uploadBasePath(scope, libraryId, itemId, tenantId);
  let uploaded = 0;

  while (uploaded < totalSize) {
    if (signal?.aborted) throw new Error("Upload cancelled");
    const end = Math.min(uploaded + chunkSize, totalSize) - 1;
    const blob = file.slice(uploaded, end + 1);
    const range = `bytes ${uploaded}-${end}/${totalSize}`;

    onProgress?.({
      uploadedBytes: uploaded,
      totalSize,
      phase: "uploading",
      message: `Uploading ${uploaded}–${end + 1} of ${totalSize}`,
    });

    const res = await fetch(`${base}/${uploadId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream",
        "Content-Range": range,
      },
      body: blob,
      signal,
    });

    if (res.status === 308) {
      // Resume incomplete — read session and continue
      const session = await getUploadSession(scope, libraryId, itemId, uploadId, tenantId);
      uploaded = Number(session.uploadedBytes ?? uploaded);
      continue;
    }

    if (!res.ok) {
      let detail = "";
      try {
        detail = await res.text();
      } catch {
        /* ignore */
      }
      throw new Error(`Chunk upload failed: ${res.status} ${detail}`);
    }

    uploaded = end + 1;
    onProgress?.({ uploadedBytes: uploaded, totalSize, phase: "uploading" });
  }

  onProgress?.({ uploadedBytes: totalSize, totalSize, phase: "completing" });
  await completeUploadSession(scope, libraryId, itemId, uploadId, tenantId);
  onProgress?.({ uploadedBytes: totalSize, totalSize, phase: "done" });
}
