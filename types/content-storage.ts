export type ContentStorageTypeApi = "local" | "nfs" | "s3";

export interface ContentStorageConfigRow {
  path?: string;
  mountPath?: string;
  server?: string;
  export?: string;
  bucket?: string;
  region?: string;
  prefix?: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  [key: string]: unknown;
}

export interface ContentStorageRow {
  id: string;
  name: string;
  type: ContentStorageTypeApi;
  config?: ContentStorageConfigRow;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContentStorageListResponse {
  items?: ContentStorageRow[];
  total?: number;
  page?: number;
  perPage?: number;
}
