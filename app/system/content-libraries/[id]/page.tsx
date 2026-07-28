"use client";

import { ContentLibraryDetailView } from "@/components/content-library/ContentLibraryDetailView";

export default function SystemContentLibraryDetailPage() {
  return (
    <ContentLibraryDetailView
      scope="platform"
      tenantId={null}
      listHref="/system/content-libraries"
    />
  );
}
