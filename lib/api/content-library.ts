import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { storageApi } from "@/lib/api/storage";
import type {
  ContentItemCreateBody,
  ContentItemCreateRequest,
  ContentItemDistributionListResponse,
  ContentItemDownloadLinkResponse,
  ContentItemListResponse,
  ContentItemRow,
  ContentItemUpdateBody,
  ContentLibraryCreateBody,
  ContentLibraryDistributionListResponse,
  ContentLibraryDistributionRow,
  ContentLibraryListResponse,
  ContentLibraryRow,
  ContentLibraryUpdateBody,
  PublishContentLibraryBody,
} from "@/types/content-library";

const PAGE_SIZE_FETCH = 100;

/**
 * Storage classes allowed for publishing to a datacenter (tenant grant / datacenter settings).
 * Falls back to all defined storage classes when the datacenter lists none.
 */
export async function fetchStorageClassesForContentPublish(
  scope: "platform" | "tenant",
  datacenterId: string,
  tenantId?: string
): Promise<string[]> {
  let fromDc: string[] = [];
  if (scope === "tenant" && tenantId) {
    const data = await apiGet<string[] | { items?: string[] }>(
      `/api/v1/tenants/${tenantId}/datacenters/${datacenterId}/storage-classes`
    );
    const raw = Array.isArray(data) ? data : (data?.items ?? []);
    fromDc = Array.from(new Set(raw.filter(Boolean)));
  } else {
    const dc = await apiGet<{ settings?: { storageClasses?: string[] } }>(
      `/api/v1/datacenters/${datacenterId}`
    );
    const list = dc.settings?.storageClasses?.filter(Boolean) ?? [];
    fromDc = Array.from(new Set(list));
  }
  if (fromDc.length > 0) {
    return fromDc;
  }
  const all = await storageApi.listStorageClasses();
  return Array.from(new Set(all.map((sc) => sc.name).filter(Boolean)));
}

export async function fetchPlatformContentLibraries(
  page = 1,
  perPage = 100
): Promise<ContentLibraryListResponse> {
  return apiGet<ContentLibraryListResponse>(
    `/api/v1/platform/content-libraries?page=${page}&perPage=${perPage}`
  );
}

export async function createPlatformContentLibrary(
  body: ContentLibraryCreateBody
): Promise<ContentLibraryRow> {
  return apiPost<ContentLibraryRow>("/api/v1/platform/content-libraries", body);
}

export async function createTenantContentLibrary(
  tenantId: string,
  body: ContentLibraryCreateBody
): Promise<ContentLibraryRow> {
  return apiPost<ContentLibraryRow>(`/api/v1/tenants/${tenantId}/content-libraries`, body);
}

export async function updatePlatformContentLibrary(
  libraryId: string,
  body: ContentLibraryUpdateBody
): Promise<ContentLibraryRow> {
  return apiPatch<ContentLibraryRow>(`/api/v1/platform/content-libraries/${libraryId}`, body);
}

export async function updateTenantContentLibrary(
  tenantId: string,
  libraryId: string,
  body: ContentLibraryUpdateBody
): Promise<ContentLibraryRow> {
  return apiPatch<ContentLibraryRow>(
    `/api/v1/tenants/${tenantId}/content-libraries/${libraryId}`,
    body
  );
}

export async function fetchTenantContentLibraries(
  tenantId: string,
  page = 1,
  perPage = 100
): Promise<ContentLibraryListResponse> {
  return apiGet<ContentLibraryListResponse>(
    `/api/v1/tenants/${tenantId}/content-libraries?page=${page}&perPage=${perPage}`
  );
}

export async function fetchPlatformContentLibrary(libraryId: string): Promise<ContentLibraryRow> {
  return apiGet<ContentLibraryRow>(`/api/v1/platform/content-libraries/${libraryId}`);
}

export async function fetchTenantContentLibrary(
  tenantId: string,
  libraryId: string
): Promise<ContentLibraryRow> {
  return apiGet<ContentLibraryRow>(`/api/v1/tenants/${tenantId}/content-libraries/${libraryId}`);
}

export async function fetchPlatformContentItemsPage(
  libraryId: string,
  page: number,
  perPage: number
): Promise<ContentItemListResponse> {
  return apiGet<ContentItemListResponse>(
    `/api/v1/platform/content-libraries/${libraryId}/items?page=${page}&perPage=${perPage}`
  );
}

export async function fetchTenantContentItemsPage(
  tenantId: string,
  libraryId: string,
  page: number,
  perPage: number
): Promise<ContentItemListResponse> {
  return apiGet<ContentItemListResponse>(
    `/api/v1/tenants/${tenantId}/content-libraries/${libraryId}/items?page=${page}&perPage=${perPage}`
  );
}

/**
 * Load all items for a library (paginates until exhausted) for client-side tab filter + paging.
 */
export async function fetchAllContentItems(
  scope: "platform" | "tenant",
  libraryId: string,
  tenantId?: string
): Promise<ContentItemRow[]> {
  const all: ContentItemRow[] = [];
  let page = 1;
  let total: number | undefined;

  while (true) {
    const res =
      scope === "platform"
        ? await fetchPlatformContentItemsPage(libraryId, page, PAGE_SIZE_FETCH)
        : await fetchTenantContentItemsPage(tenantId!, libraryId, page, PAGE_SIZE_FETCH);

    const batch = res.items ?? [];
    all.push(...batch);
    total = res.total;
    if (batch.length < PAGE_SIZE_FETCH) break;
    if (total != null && all.length >= total) break;
    page += 1;
    if (page > 500) break; // safety cap
  }

  return all;
}

export async function createPlatformContentItem(
  libraryId: string,
  body: ContentItemCreateBody | ContentItemCreateRequest
): Promise<ContentItemRow> {
  return apiPost<ContentItemRow>(`/api/v1/platform/content-libraries/${libraryId}/items`, body);
}

export async function createTenantContentItem(
  tenantId: string,
  libraryId: string,
  body: ContentItemCreateBody | ContentItemCreateRequest
): Promise<ContentItemRow> {
  return apiPost<ContentItemRow>(
    `/api/v1/tenants/${tenantId}/content-libraries/${libraryId}/items`,
    body
  );
}

export async function updatePlatformContentItem(
  libraryId: string,
  itemId: string,
  body: ContentItemUpdateBody
): Promise<ContentItemRow> {
  return apiPatch<ContentItemRow>(
    `/api/v1/platform/content-libraries/${libraryId}/items/${itemId}`,
    body
  );
}

export async function updateTenantContentItem(
  tenantId: string,
  libraryId: string,
  itemId: string,
  body: ContentItemUpdateBody
): Promise<ContentItemRow> {
  return apiPatch<ContentItemRow>(
    `/api/v1/tenants/${tenantId}/content-libraries/${libraryId}/items/${itemId}`,
    body
  );
}

export async function deletePlatformContentItem(libraryId: string, itemId: string): Promise<void> {
  await apiDelete(`/api/v1/platform/content-libraries/${libraryId}/items/${itemId}`);
}

export async function deleteTenantContentItem(
  tenantId: string,
  libraryId: string,
  itemId: string
): Promise<void> {
  await apiDelete(`/api/v1/tenants/${tenantId}/content-libraries/${libraryId}/items/${itemId}`);
}

export async function getTenantContentItem(
  tenantId: string,
  libraryId: string,
  itemId: string
): Promise<ContentItemRow> {
  return apiGet<ContentItemRow>(
    `/api/v1/tenants/${tenantId}/content-libraries/${libraryId}/items/${itemId}`
  );
}

export async function syncPlatformContentLibrary(libraryId: string): Promise<unknown> {
  return apiPost(`/api/v1/platform/content-libraries/${libraryId}/sync`, {});
}

export async function replicatePlatformContentLibrary(libraryId: string): Promise<unknown> {
  return apiPost(`/api/v1/platform/content-libraries/${libraryId}/replicate`, {});
}

export async function publishPlatformContentLibrary(
  libraryId: string,
  body: PublishContentLibraryBody
): Promise<ContentLibraryDistributionRow> {
  return apiPost<ContentLibraryDistributionRow>(
    `/api/v1/platform/content-libraries/${libraryId}/publish`,
    body
  );
}

export async function listPlatformContentLibraryDistributions(
  libraryId: string
): Promise<ContentLibraryDistributionListResponse> {
  return apiGet<ContentLibraryDistributionListResponse>(
    `/api/v1/platform/content-libraries/${libraryId}/distributions`
  );
}

export async function unpublishPlatformContentLibraryDistribution(
  libraryId: string,
  distributionId: string
): Promise<void> {
  await apiDelete(
    `/api/v1/platform/content-libraries/${libraryId}/distributions/${distributionId}`
  );
}

export async function replicatePlatformContentLibraryDistribution(
  libraryId: string,
  distributionId: string
): Promise<unknown> {
  return apiPost(
    `/api/v1/platform/content-libraries/${libraryId}/distributions/${distributionId}/replicate`,
    {}
  );
}

export async function listPlatformContentLibraryDistributionItems(
  libraryId: string,
  distributionId: string,
  params?: { status?: string; page?: number; perPage?: number }
): Promise<ContentItemDistributionListResponse> {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.page != null) q.set("page", String(params.page));
  if (params?.perPage != null) q.set("perPage", String(params.perPage));
  const qs = q.toString();
  return apiGet<ContentItemDistributionListResponse>(
    `/api/v1/platform/content-libraries/${libraryId}/distributions/${distributionId}/items${qs ? `?${qs}` : ""}`
  );
}

export async function publishTenantContentLibrary(
  tenantId: string,
  libraryId: string,
  body: PublishContentLibraryBody
): Promise<ContentLibraryDistributionRow> {
  return apiPost<ContentLibraryDistributionRow>(
    `/api/v1/tenants/${tenantId}/content-libraries/${libraryId}/publish`,
    body
  );
}

export async function listTenantContentLibraryDistributions(
  tenantId: string,
  libraryId: string
): Promise<ContentLibraryDistributionListResponse> {
  return apiGet<ContentLibraryDistributionListResponse>(
    `/api/v1/tenants/${tenantId}/content-libraries/${libraryId}/distributions`
  );
}

export async function unpublishTenantContentLibraryDistribution(
  tenantId: string,
  libraryId: string,
  distributionId: string
): Promise<void> {
  await apiDelete(
    `/api/v1/tenants/${tenantId}/content-libraries/${libraryId}/distributions/${distributionId}`
  );
}

export async function replicateTenantContentLibraryDistribution(
  tenantId: string,
  libraryId: string,
  distributionId: string
): Promise<unknown> {
  return apiPost(
    `/api/v1/tenants/${tenantId}/content-libraries/${libraryId}/distributions/${distributionId}/replicate`,
    {}
  );
}

export async function listTenantContentLibraryDistributionItems(
  tenantId: string,
  libraryId: string,
  distributionId: string,
  params?: { status?: string; page?: number; perPage?: number }
): Promise<ContentItemDistributionListResponse> {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.page != null) q.set("page", String(params.page));
  if (params?.perPage != null) q.set("perPage", String(params.perPage));
  const qs = q.toString();
  return apiGet<ContentItemDistributionListResponse>(
    `/api/v1/tenants/${tenantId}/content-libraries/${libraryId}/distributions/${distributionId}/items${qs ? `?${qs}` : ""}`
  );
}

export async function downloadPlatformContentItem(
  libraryId: string,
  itemId: string
): Promise<ContentItemDownloadLinkResponse> {
  return apiGet<ContentItemDownloadLinkResponse>(
    `/api/v1/platform/content-libraries/${libraryId}/items/${itemId}/download`
  );
}

export async function downloadTenantContentItem(
  tenantId: string,
  libraryId: string,
  itemId: string
): Promise<ContentItemDownloadLinkResponse> {
  return apiGet<ContentItemDownloadLinkResponse>(
    `/api/v1/tenants/${tenantId}/content-libraries/${libraryId}/items/${itemId}/download`
  );
}
