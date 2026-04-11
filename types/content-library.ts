import type { Link } from '@/types/provider';
import type { VmTemplateSpec } from './vm-template-spec';

/** Matches {@link com.onetattva.infron.core.common.Constants#SYSTEM_ID} */
export const SYSTEM_TENANT_ID = '215012d9-8b1e-5dc5-b54f-89022875fe1e';

export function isPlatformContentLibrary(lib: Pick<ContentLibraryRow, 'tenantId'>): boolean {
  return lib.tenantId === SYSTEM_TENANT_ID;
}

export function isRemoteContentLibrary(lib: Pick<ContentLibraryRow, 'type'>): boolean {
  return lib.type === 'remote';
}

export type ContentLibraryTypeApi = 'local' | 'remote';
export type ContentLibraryAccessMode = 'read_only' | 'read_write';
export type ContentSyncStatus = 'never_synced' | 'in_progress' | 'synced' | 'failed';

export interface ContentLibraryRow {
  id: string;
  name: string;
  description?: string;
  type?: ContentLibraryTypeApi;
  accessMode?: ContentLibraryAccessMode;
  tenantId?: string;
  contentStorageId?: string;
  syncStatus?: ContentSyncStatus;
  lastSyncedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, string>;
  _links?: Link[];
}

export type ContentItemContentStatus = 'pending' | 'replicating' | 'available' | 'failed' | 'uploading';
export type ContentTypeApi =
  | 'vm_template'
  | 'iso'
  | 'script'
  | 'container_image'
  | 'helm_chart';

export interface ContentItemRow {
  id: string;
  libraryId?: string;
  name: string;
  description?: string;
  contentType?: ContentTypeApi | string;
  version?: string;
  sizeBytes?: number;
  checksum?: string;
  checksumAlgorithm?: string;
  sourceUrl?: string;
  contentStatus?: ContentItemContentStatus | string;
  lastReplicatedAt?: string | null;
  metadata?: Record<string, string>;
  /** Present on GET for `vm_template` items (see VmTemplateContentItem in API). */
  templateSpec?: VmTemplateSpec;
  providerRelativePath?: string | null;
  infronInstanceSegment?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _links?: Link[];
}

export interface ContentLibraryListResponse {
  items?: ContentLibraryRow[];
  total?: number;
  page?: number;
  perPage?: number;
}

export interface ContentItemListResponse {
  items?: ContentItemRow[];
  total?: number;
  page?: number;
  perPage?: number;
}

export interface ContentItemCreateBody {
  name: string;
  description?: string;
  contentType: ContentTypeApi;
  version?: string;
  checksum?: string;
  checksumAlgorithm?: string;
  sourceUrl?: string;
  metadata?: Record<string, string>;
}

// Discriminated union types for content item creation
export interface VmTemplateContentItemCreate {
  name: string;
  description?: string;
  contentType: 'vm_template';
  version?: string;
  metadata?: Record<string, string>;
  templateSpec: VmTemplateSpec;
}

export interface IsoContentItemCreate {
  name: string;
  description?: string;
  contentType: 'iso';
  version?: string;
  metadata?: Record<string, string>;
}

export interface ScriptContentItemCreate {
  name: string;
  description?: string;
  contentType: 'script';
  version?: string;
  metadata?: Record<string, string>;
}

export interface ContainerImageContentItemCreate {
  name: string;
  description?: string;
  contentType: 'container_image';
  version?: string;
  metadata?: Record<string, string>;
}

export interface HelmChartContentItemCreate {
  name: string;
  description?: string;
  contentType: 'helm_chart';
  version?: string;
  metadata?: Record<string, string>;
}

export type ContentItemCreateRequest = 
  | VmTemplateContentItemCreate 
  | IsoContentItemCreate 
  | ScriptContentItemCreate
  | ContainerImageContentItemCreate
  | HelmChartContentItemCreate;

export interface ContentItemUpdateBody {
  name?: string;
  description?: string;
  version?: string;
  checksum?: string;
  checksumAlgorithm?: string;
  sourceUrl?: string;
  metadata?: Record<string, string>;
}

export interface ContentSourceConfig {
  type?: 'http' | 'https' | 's3' | 'nfs';
  url?: string;
  bucket?: string;
  prefix?: string;
  credentialsRef?: string;
  [key: string]: unknown;
}

export interface ContentLibraryCreateBody {
  name: string;
  type: ContentLibraryTypeApi;
  description?: string;
  accessMode?: ContentLibraryAccessMode;
  sourceConfig?: ContentSourceConfig;
  /** Required for platform libraries; ignored for tenant (server uses default ContentStorage). */
  contentStorageId?: string;
  metadata?: Record<string, string>;
}

export interface ContentLibraryUpdateBody {
  name?: string;
  description?: string;
  accessMode?: ContentLibraryAccessMode;
  sourceConfig?: ContentSourceConfig;
  /** Platform libraries only; ignored for tenant updates. */
  contentStorageId?: string;
  metadata?: Record<string, string>;
}

export interface PublishContentLibraryBody {
  datacenterId: string;
  storageClassName: string;
}

/** Matches OpenAPI EntityReference on publish mappings */
export interface ContentLibraryDistributionRef {
  id?: string;
  name?: string;
  description?: string;
}

export interface ContentLibraryDistributionRow {
  id: string;
  libraryId: string;
  datacenterId: string;
  storageClassName?: string | null;
  /** Populated by API with id + name for display */
  datacenter?: ContentLibraryDistributionRef;
  replicateStatus: 'pending' | 'replicating' | 'available' | 'failed';
  progressPercent?: number;
  errorMessage?: string | null;
  lastReplicatedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContentLibraryDistributionListResponse {
  items?: ContentLibraryDistributionRow[];
}

export type ContentItemDistributionStatus = 'PENDING' | 'COPYING' | 'READY' | 'FAILED';

export interface ContentItemDistributionRow {
  id: string;
  contentItemId: string;
  distributionId: string;
  name?: string;
  contentType?: string;
  status: ContentItemDistributionStatus;
  checksumVerified: boolean;
  sizeBytes?: number | null;
  errorMessage?: string | null;
  retryCount: number;
  lastUpdatedAt?: string;
}

export interface ContentItemDistributionListResponse {
  items?: ContentItemDistributionRow[];
  total?: number;
  page?: number;
  perPage?: number;
}

export interface ContentItemDownloadLinkResponse {
  url: string;
}

export interface VmPublishTemplateBody {
  library_id: string;
  template_name: string;
  description?: string;
  version_label?: string;
  metadata?: Record<string, string>;
}

export interface VmPublishTemplateResponse {
  content_item_id?: string;
  contentItemId?: string;
  message?: string;
}
