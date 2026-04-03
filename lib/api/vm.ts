import { apiPost } from '@/lib/api';
import type { VmPublishTemplateBody, VmPublishTemplateResponse } from '@/types/content-library';

export async function attachIsoToVm(
  tenantId: string,
  vmId: string,
  contentItemId: string,
): Promise<unknown> {
  return apiPost(`/api/v1/tenants/${tenantId}/vms/${vmId}/attach-iso`, {
    content_item_id: contentItemId,
  });
}

export async function publishVmAsTemplate(
  tenantId: string,
  vmId: string,
  body: VmPublishTemplateBody,
): Promise<VmPublishTemplateResponse> {
  return apiPost<VmPublishTemplateResponse>(
    `/api/v1/tenants/${tenantId}/vms/${vmId}/publish-as-template`,
    body,
  );
}
