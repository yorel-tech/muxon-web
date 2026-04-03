import type { Link } from '@/types/provider';

export type ContentLibraryTypeApi = 'local' | 'remote' | 'subscribed';
export type ContentLibraryAccessMode = 'read_only' | 'read_write';
export type ContentSyncStatus = 'never_synced' | 'in_progress' | 'synced' | 'failed';

export interface ContentLibraryRow {
  id: string;
  name: string;
  description?: string;
  type?: ContentLibraryTypeApi;
  accessMode?: ContentLibraryAccessMode;
  tenantId?: string | null;
  storageClassName?: string;
  syncStatus?: ContentSyncStatus;
  lastSyncedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, string>;
  _links?: Link[];
}

export type ContentItemFetchStatus = 'pending' | 'fetching' | 'available' | 'failed' | 'uploading';
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
  fetchStatus?: ContentItemFetchStatus | string;
  lastFetchedAt?: string | null;
  metadata?: Record<string, string>;
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
  type?: 'http' | 'https' | 's3';
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
  storageClassName?: string;
  metadata?: Record<string, string>;
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
