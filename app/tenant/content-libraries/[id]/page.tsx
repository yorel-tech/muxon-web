"use client";

import { ContentLibraryDetailView } from "@/components/content-library/ContentLibraryDetailView";
import { useTenantId } from "@/lib/use-tenant-id";

export default function TenantContentLibraryDetailPage() {
  const { tenantId } = useTenantId();
  return (
    <ContentLibraryDetailView
      scope="tenant"
      tenantId={tenantId}
      listHref="/tenant/content-libraries"
    />
  );
}
