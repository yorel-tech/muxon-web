"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/atoms/card";
import { Table, Column } from "@/components/ui/organisms/table";
import { Badge } from "@/components/ui/atoms/badge";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { Modal } from "@/components/ui/molecules/modal";
import { Dropdown, DropdownOption } from "@/components/ui/molecules/dropdown";
import { RowActionsTrigger } from "@/components/DynamicContextMenu";
import { motion } from "framer-motion";
import { Plus, Loader2, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { VmConsoleModal } from "@/components/ui/organisms/vm-console-modal";
import { apiGet, apiPost } from "@/lib/api";
import { useTenantId } from "@/lib/use-tenant-id";
import {
  fetchTenantContentLibraries,
  fetchAllContentItems,
  getTenantContentItem,
} from "@/lib/api/content-library";
import type { ContentLibraryRow, ContentItemRow } from "@/types/content-library";
import type { VmTemplateSpec } from "@/types/vm-template-spec";
import { AttachIsoModal } from "@/components/vm/AttachIsoModal";
import { PublishTemplateModal } from "@/components/vm/PublishTemplateModal";

interface VmRow {
  id: string;
  name: string;
  status?: string;
  flavor?: string;
  image?: string;
  datacenter?: string;
  createdAt?: string;
}

/** Tenant datacenter grant (from GET /api/v1/tenants/{id}/datacenters) */
interface DatacenterSettings {
  storageClasses?: string[];
}

interface TenantDatacenterGrant {
  id: string;
  tenantId?: string;
  datacenterId: string;
  datacenter?: { id: string; name?: string; description?: string };
  access?: boolean;
  overrideSettings?: DatacenterSettings | null;
}

/** Form types aligned with OpenAPI vms.yaml (ComputeSpec, StorageSpec, NetworkSpec, OsSpec) */
interface DiskSpec {
  sizeMb: number;
  storageClass?: string;
}
interface NicSpec {
  isPrimary: boolean;
  network?: string;
  ip_allocation: "dhcp" | "static" | "pool";
  ip_address?: string | null;
}
interface ComputeSpec {
  cpus: number;
  memorySizeMb: number;
}
interface StorageSpec {
  disks: DiskSpec[];
  vmStorageClass?: string;
}
interface NetworkSpec {
  nics: NicSpec[];
}
interface OsSpec {
  type: "linux" | "windows" | "bsd";
  distribution?: string;
  version?: string;
}
interface VmSpec {
  compute: ComputeSpec;
  storage: StorageSpec;
  network?: NetworkSpec;
  os?: OsSpec;
}
interface VmCreateForm {
  name: string;
  description?: string;
  tenant_datacenter_grant_id: string;
  spec: VmSpec;
  content_item_id?: string;
  iso_content_item_ids?: string[];
}

const WIZARD_STEPS = [
  "Basics",
  "Template & ISOs",
  "Compute",
  "Storage",
  "Network",
  "OS",
  "Review",
] as const;
const NAME_PATTERN = /^[a-zA-Z0-9]([-a-zA-Z0-9]*[a-zA-Z0-9])?$/;

function defaultVmSpec(): VmSpec {
  return {
    compute: { cpus: 2, memorySizeMb: 2048 },
    storage: {
      disks: [{ sizeMb: 20 * 1024, storageClass: undefined }],
      vmStorageClass: undefined,
    },
    network: {
      nics: [{ isPrimary: true, network: "default", ip_allocation: "dhcp" }],
    },
    os: { type: "linux", distribution: "ubuntu", version: "22.04" },
  };
}

function defaultCreateForm(initialGrantId: string): VmCreateForm {
  return {
    name: "",
    description: "",
    tenant_datacenter_grant_id: initialGrantId,
    spec: defaultVmSpec(),
    content_item_id: undefined,
    iso_content_item_ids: [],
  };
}

/** Disk sizes aligned with VmsService.mergeTemplateIntoVmSpec (ceil bytes → MB). */
function diskSpecsFromVmTemplate(templateSpec: VmTemplateSpec): DiskSpec[] {
  return templateSpec.spec.disks.map((d) => ({
    sizeMb: Math.max(1, Math.ceil(d.sizeBytes / (1024 * 1024))),
    storageClass: undefined,
  }));
}

function computeFromVmTemplate(templateSpec: VmTemplateSpec): ComputeSpec {
  return {
    cpus: templateSpec.spec.compute.cpuCores,
    memorySizeMb: templateSpec.spec.compute.memoryMB,
  };
}

function TenantVmsPageInner() {
  const { tenantId } = useTenantId();
  const searchParams = useSearchParams();
  const [vms, setVms] = useState<VmRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [grants, setGrants] = useState<TenantDatacenterGrant[]>([]);
  const [grantsLoading, setGrantsLoading] = useState(false);
  const [storageClasses, setStorageClasses] = useState<string[]>([]);
  const [storageClassesLoading, setStorageClassesLoading] = useState(false);
  const [storageClassesError, setStorageClassesError] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState(0);
  const [createForm, setCreateForm] = useState<VmCreateForm>(() => defaultCreateForm(""));
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [useFromTemplate, setUseFromTemplate] = useState(false);
  const [templateLibraryId, setTemplateLibraryId] = useState("");
  const [templateItems, setTemplateItems] = useState<ContentItemRow[]>([]);
  const [templateItemsLoading, setTemplateItemsLoading] = useState(false);
  const [isoLibraryId, setIsoLibraryId] = useState("");
  const [isoCandidates, setIsoCandidates] = useState<ContentItemRow[]>([]);
  const [isoCandidatesLoading, setIsoCandidatesLoading] = useState(false);
  const [contentLibraries, setContentLibraries] = useState<ContentLibraryRow[]>([]);
  const [clLoading, setClLoading] = useState(false);
  const [attachIsoVm, setAttachIsoVm] = useState<VmRow | null>(null);
  const [publishVm, setPublishVm] = useState<VmRow | null>(null);
  const [consoleVm, setConsoleVm] = useState<VmRow | null>(null);

  const loadVms = useCallback(async () => {
    if (!tenantId) {
      setVms([]);
      setLoading(false);
      return;
    }
    try {
      const data = await apiGet<{ items?: unknown[]; total?: number }>(
        `/api/v1/tenants/${tenantId}/vms`
      );
      const list = Array.isArray(data) ? data : (data?.items ?? []);
      setVms(
        (list as Record<string, unknown>[]).map((vm) => ({
          id: String(vm.id ?? ""),
          name: String(vm.name ?? vm.id ?? ""),
          status: (vm.status as string) ?? "unknown",
          flavor: (vm.flavor as string) ?? (vm.vmClass as string),
          image: (vm.image as string) ?? (vm.imageId as string),
          datacenter: (vm.datacenterId as string) ?? (vm.datacenter as string),
          createdAt: vm.createdAt as string,
        }))
      );
    } catch {
      setVms([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    setLoading(true);
    loadVms();
  }, [loadVms]);

  const loadGrants = useCallback(async () => {
    if (!tenantId) {
      setGrants([]);
      return;
    }
    setGrantsLoading(true);
    try {
      const data = await apiGet<{ items?: TenantDatacenterGrant[] }>(
        `/api/v1/tenants/${tenantId}/datacenters?perPage=100`
      );
      const list = Array.isArray(data) ? data : (data?.items ?? []);
      const withId = list.filter((g) => g.access !== false && g.id);
      setGrants(withId);
      if (withId.length > 0) {
        setCreateForm((f) =>
          f.tenant_datacenter_grant_id ? f : { ...f, tenant_datacenter_grant_id: withId[0].id }
        );
      }
    } catch {
      setGrants([]);
    } finally {
      setGrantsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (createModalOpen && tenantId) {
      loadGrants();
    }
  }, [createModalOpen, tenantId, loadGrants]);

  const loadStorageClasses = useCallback(
    async (selectedGrantId: string) => {
      if (!tenantId || !selectedGrantId) {
        setStorageClasses([]);
        setStorageClassesError(null);
        return;
      }
      const selectedGrant = grants.find((g) => g.id === selectedGrantId);
      if (!selectedGrant) {
        setStorageClasses([]);
        setStorageClassesError(null);
        return;
      }
      const overrideStorageClasses = Array.from(
        new Set((selectedGrant.overrideSettings?.storageClasses ?? []).filter(Boolean))
      );
      if (overrideStorageClasses.length > 0) {
        setStorageClasses(overrideStorageClasses);
        setStorageClassesLoading(false);
        setStorageClassesError(null);
        const allowed = new Set(overrideStorageClasses);
        setCreateForm((f) => {
          const vmStorageClass = f.spec.storage.vmStorageClass;
          const nextVmStorageClass =
            vmStorageClass && allowed.has(vmStorageClass) ? vmStorageClass : undefined;
          const nextDisks = f.spec.storage.disks.map((disk) => ({
            ...disk,
            storageClass:
              disk.storageClass && allowed.has(disk.storageClass) ? disk.storageClass : undefined,
          }));
          const diskChanged = nextDisks.some(
            (d, i) => d.storageClass !== f.spec.storage.disks[i]?.storageClass
          );
          if (!diskChanged && nextVmStorageClass === vmStorageClass) return f;
          return {
            ...f,
            spec: {
              ...f.spec,
              storage: {
                ...f.spec.storage,
                vmStorageClass: nextVmStorageClass,
                disks: nextDisks,
              },
            },
          };
        });
        return;
      }
      const datacenterId = selectedGrant?.datacenterId || selectedGrant?.datacenter?.id;
      if (!datacenterId) {
        setStorageClasses([]);
        setStorageClassesError("Selected datacenter grant is missing a datacenter ID.");
        return;
      }
      setStorageClassesLoading(true);
      setStorageClassesError(null);
      try {
        const data = await apiGet<string[] | { items?: string[] }>(
          `/api/v1/tenants/${tenantId}/datacenters/${datacenterId}/storage-classes`
        );
        const raw = Array.isArray(data) ? data : (data?.items ?? []);
        const options = Array.from(new Set(raw.filter(Boolean)));
        setStorageClasses(options);
        const allowed = new Set(options);
        setCreateForm((f) => {
          const vmStorageClass = f.spec.storage.vmStorageClass;
          const nextVmStorageClass =
            vmStorageClass && allowed.has(vmStorageClass) ? vmStorageClass : undefined;
          const nextDisks = f.spec.storage.disks.map((disk) => ({
            ...disk,
            storageClass:
              disk.storageClass && allowed.has(disk.storageClass) ? disk.storageClass : undefined,
          }));
          const diskChanged = nextDisks.some(
            (d, i) => d.storageClass !== f.spec.storage.disks[i]?.storageClass
          );
          if (!diskChanged && nextVmStorageClass === vmStorageClass) return f;
          return {
            ...f,
            spec: {
              ...f.spec,
              storage: {
                ...f.spec.storage,
                vmStorageClass: nextVmStorageClass,
                disks: nextDisks,
              },
            },
          };
        });
      } catch (e) {
        setStorageClasses([]);
        setStorageClassesError(e instanceof Error ? e.message : "Failed to load storage classes.");
      } finally {
        setStorageClassesLoading(false);
      }
    },
    [tenantId, grants]
  );

  useEffect(() => {
    if (!createModalOpen) return;
    void loadStorageClasses(createForm.tenant_datacenter_grant_id);
  }, [createModalOpen, createForm.tenant_datacenter_grant_id, loadStorageClasses]);

  useEffect(() => {
    if (!createModalOpen || !tenantId) return;
    setClLoading(true);
    (async () => {
      try {
        const data = await fetchTenantContentLibraries(tenantId, 1, 200);
        setContentLibraries(data.items ?? []);
      } catch {
        setContentLibraries([]);
      } finally {
        setClLoading(false);
      }
    })();
  }, [createModalOpen, tenantId]);

  useEffect(() => {
    if (!createModalOpen || !useFromTemplate || !templateLibraryId || !tenantId) {
      setTemplateItems([]);
      return;
    }
    setTemplateItemsLoading(true);
    (async () => {
      try {
        const all = await fetchAllContentItems("tenant", templateLibraryId, tenantId);
        setTemplateItems(all.filter((i) => (i.contentType ?? "").toLowerCase() === "vm_template"));
      } catch {
        setTemplateItems([]);
      } finally {
        setTemplateItemsLoading(false);
      }
    })();
  }, [createModalOpen, useFromTemplate, templateLibraryId, tenantId]);

  useEffect(() => {
    if (!createModalOpen || !isoLibraryId || !tenantId) {
      setIsoCandidates([]);
      return;
    }
    setIsoCandidatesLoading(true);
    (async () => {
      try {
        const all = await fetchAllContentItems("tenant", isoLibraryId, tenantId);
        setIsoCandidates(all.filter((i) => (i.contentType ?? "").toLowerCase() === "iso"));
      } catch {
        setIsoCandidates([]);
      } finally {
        setIsoCandidatesLoading(false);
      }
    })();
  }, [createModalOpen, isoLibraryId, tenantId]);

  // When creating from a library template, preload compute + disks from templateSpec (GET item).
  useEffect(() => {
    if (
      !createModalOpen ||
      !useFromTemplate ||
      !tenantId ||
      !templateLibraryId ||
      !createForm.content_item_id
    ) {
      return;
    }
    const itemId = createForm.content_item_id;
    const libId = templateLibraryId;
    let cancelled = false;
    void (async () => {
      try {
        const item = await getTenantContentItem(tenantId, libId, itemId);
        if (cancelled) return;
        const templateSpec = item.templateSpec;
        if (!templateSpec?.spec?.compute || !templateSpec.spec.disks?.length) {
          return;
        }
        setCreateForm((f) => {
          if (f.content_item_id !== itemId) return f;
          return {
            ...f,
            spec: {
              ...f.spec,
              compute: computeFromVmTemplate(templateSpec),
              storage: {
                vmStorageClass: f.spec.storage.vmStorageClass,
                disks: diskSpecsFromVmTemplate(templateSpec),
              },
            },
          };
        });
      } catch {
        /* validation step may still surface missing template */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [createModalOpen, useFromTemplate, tenantId, templateLibraryId, createForm.content_item_id]);

  const handleOpenWizard = () => {
    setCreateModalOpen(true);
    setWizardStep(0);
    setCreateError(null);
    const base = defaultCreateForm(grants[0]?.id ?? "");
    setUseFromTemplate(false);
    setTemplateLibraryId("");
    setIsoLibraryId("");
    setTemplateItems([]);
    setIsoCandidates([]);
    const ci = searchParams.get("contentItemId");
    const lib = searchParams.get("libraryId");
    if (tenantId && ci && lib) {
      setUseFromTemplate(true);
      setTemplateLibraryId(lib);
      setCreateForm({ ...base, content_item_id: ci });
      void (async () => {
        try {
          const item = await getTenantContentItem(tenantId, lib, ci);
          if ((item.contentType ?? "").toLowerCase() !== "vm_template") {
            setCreateError("Linked content item is not a VM template.");
          }
        } catch {
          setCreateError("Could not load template from content library link.");
        }
      })();
    } else {
      setCreateForm(base);
    }
  };

  const handleCloseWizard = () => {
    if (!createSubmitting) {
      setCreateModalOpen(false);
      setWizardStep(0);
      setCreateError(null);
      setUseFromTemplate(false);
      setTemplateLibraryId("");
      setIsoLibraryId("");
      setTemplateItems([]);
      setIsoCandidates([]);
    }
  };

  function validateBasics(): string | null {
    const name = createForm.name.trim();
    if (!name) return "Name is required.";
    if (name.length > 63) return "Name must be at most 63 characters.";
    if (!NAME_PATTERN.test(name))
      return "Name must use only letters, numbers, and hyphens (e.g. my-vm).";
    if (!createForm.tenant_datacenter_grant_id) return "Please select a datacenter.";
    return null;
  }

  function validateCompute(): string | null {
    const { cpus, memorySizeMb } = createForm.spec.compute;
    if (cpus < 1 || cpus > 128) return "CPUs must be between 1 and 128.";
    if (memorySizeMb < 512 || memorySizeMb > 1048576)
      return "Memory must be between 512 MB and 1048576 MB.";
    return null;
  }

  function validateStorage(): string | null {
    const { disks } = createForm.spec.storage;
    if (!disks.length) return "Add at least one disk.";
    for (let i = 0; i < disks.length; i++) {
      if (disks[i].sizeMb < 1) return `Disk ${i + 1}: size must be at least 1 MB.`;
    }
    return null;
  }

  function validateTemplateStep(): string | null {
    if (!useFromTemplate) return null;
    if (!templateLibraryId) return "Select a content library for the template.";
    if (!createForm.content_item_id) return "Select a VM template.";
    return null;
  }

  const handleNext = () => {
    setCreateError(null);
    if (wizardStep === 0) {
      const err = validateBasics();
      if (err) {
        setCreateError(err);
        return;
      }
    } else if (wizardStep === 1) {
      const err = validateTemplateStep();
      if (err) {
        setCreateError(err);
        return;
      }
    } else if (wizardStep === 2) {
      const err = validateCompute();
      if (err) {
        setCreateError(err);
        return;
      }
    } else if (wizardStep === 3) {
      const err = validateStorage();
      if (err) {
        setCreateError(err);
        return;
      }
    }
    setWizardStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  };

  const handleCreateVm = async () => {
    const err =
      validateBasics() ?? validateTemplateStep() ?? validateCompute() ?? validateStorage();
    if (err) {
      setCreateError(err);
      return;
    }
    setCreateError(null);
    if (!tenantId) {
      setCreateError("Tenant is not resolved yet.");
      return;
    }
    setCreateSubmitting(true);
    try {
      const payload = {
        name: createForm.name.trim(),
        description: createForm.description?.trim() || undefined,
        tenant_datacenter_grant_id: createForm.tenant_datacenter_grant_id,
        ...(createForm.content_item_id ? { content_item_id: createForm.content_item_id } : {}),
        ...(createForm.iso_content_item_ids && createForm.iso_content_item_ids.length > 0
          ? { iso_content_item_ids: createForm.iso_content_item_ids }
          : {}),
        spec: {
          compute: createForm.spec.compute,
          storage: createForm.spec.storage,
          network: createForm.spec.network?.nics?.length
            ? { nics: createForm.spec.network.nics }
            : undefined,
          os: createForm.spec.os,
        },
      };
      await apiPost(`/api/v1/tenants/${tenantId}/vms`, payload);
      handleCloseWizard();
      setCreateForm(defaultCreateForm(grants[0]?.id ?? ""));
      await loadVms();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to create VM.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const getStatusVariant = (status: string): "success" | "warning" | "error" | "default" => {
    if (status === "running" || status === "active") return "success";
    if (status === "stopped" || status === "paused") return "default";
    if (status === "error" || status === "failed") return "error";
    return "warning";
  };

  const vmActionOptions = (row: VmRow): DropdownOption[] => {
    const opts: DropdownOption[] = [];
    if ((row.status ?? "").toUpperCase() === "ACTIVE") {
      opts.push(
        {
          label: "View console",
          onClick: () => setConsoleVm(row),
        },
        {
          label: "Open console in new tab",
          onClick: () => {
            const q = row.name ? `?name=${encodeURIComponent(row.name)}` : "";
            const hadModalForThisVm = consoleVm?.id === row.id;
            if (hadModalForThisVm) {
              setConsoleVm(null);
            }
            const open = () =>
              window.open(`/tenant/vms/${row.id}/console${q}`, "_blank", "noopener,noreferrer");
            if (hadModalForThisVm) {
              window.setTimeout(open, 300);
            } else {
              open();
            }
          },
        }
      );
    }
    opts.push(
      {
        label: "Attach ISO",
        onClick: () => setAttachIsoVm(row),
      },
      {
        label: "Publish as template",
        onClick: () => setPublishVm(row),
      }
    );
    return opts;
  };

  const columns: Column<VmRow>[] = [
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <div className="flex justify-start" onClick={(e) => e.stopPropagation()}>
          <Dropdown
            trigger={<RowActionsTrigger title="VM actions" />}
            options={vmActionOptions(row)}
            position="right"
            usePortal
          />
        </div>
      ),
      sortable: false,
    },
    {
      key: "name",
      header: "Name",
      cell: (row) => <div className="font-medium text-gray-900 dark:text-gray-100">{row.name}</div>,
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge variant={getStatusVariant(row.status ?? "")}>{row.status ?? "—"}</Badge>
      ),
      sortable: true,
    },
    {
      key: "flavor",
      header: "Flavor",
      cell: (row) => (
        <span className="text-gray-600 dark:text-gray-400 text-sm">{row.flavor ?? "—"}</span>
      ),
      sortable: true,
    },
    {
      key: "image",
      header: "Image",
      cell: (row) => (
        <span className="text-gray-600 dark:text-gray-400 text-sm truncate max-w-[120px] block">
          {row.image ?? "—"}
        </span>
      ),
      sortable: true,
    },
    {
      key: "datacenter",
      header: "Datacenter",
      cell: (row) => (
        <span className="text-gray-600 dark:text-gray-400 text-sm">{row.datacenter ?? "—"}</span>
      ),
      sortable: true,
    },
    {
      key: "createdAt",
      header: "Created",
      cell: (row) => (
        <span className="text-gray-500 dark:text-gray-400 text-sm">
          {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
        </span>
      ),
      sortable: true,
    },
  ];

  return (
    <div className="min-h-screen bg-app">
      <div className="max-w-full px-3 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Virtual Machines
            </h1>
          </div>
          <Button onClick={handleOpenWizard} className="flex items-center gap-2">
            <Plus size={18} />
            Create VM
          </Button>
        </motion.div>

        <Modal isOpen={createModalOpen} onClose={handleCloseWizard} title="Create VM" size="xl">
          <div className="flex flex-col max-h-[80vh]">
            {/* Step indicator */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
              {WIZARD_STEPS.map((label, i) => (
                <span
                  key={label}
                  className={`text-sm ${i === wizardStep ? "font-medium text-primary-600 dark:text-primary-400" : "text-gray-500 dark:text-gray-400"}`}
                >
                  {i + 1}. {label}
                </span>
              ))}
            </div>

            {createError && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-2 text-sm text-red-800 dark:text-red-200 mb-4">
                {createError}
              </div>
            )}

            <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
              {/* Step 0: Basics */}
              {wizardStep === 0 && (
                <div className="space-y-4">
                  <Input
                    label="VM name"
                    placeholder="my-vm"
                    value={createForm.name}
                    onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                    fullWidth
                    disabled={createSubmitting}
                  />
                  <Input
                    label="Description (optional)"
                    placeholder="Short description"
                    value={createForm.description ?? ""}
                    onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                    fullWidth
                    disabled={createSubmitting}
                  />
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Datacenter
                    </label>
                    <select
                      className="w-full rounded-md border border-panel bg-surface px-4 py-2 text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-panel dark:bg-surface dark:text-gray-100"
                      value={createForm.tenant_datacenter_grant_id}
                      onChange={(e) =>
                        setCreateForm((f) => ({
                          ...f,
                          tenant_datacenter_grant_id: e.target.value,
                        }))
                      }
                      disabled={createSubmitting || grantsLoading}
                    >
                      <option value="">Select datacenter</option>
                      {grants.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.datacenter?.name ?? g.datacenterId}
                        </option>
                      ))}
                    </select>
                    {grantsLoading && (
                      <p className="mt-1 text-sm text-gray-500">Loading datacenters…</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Name: letters, numbers, hyphens only; 1–63 characters.
                  </p>
                </div>
              )}

              {/* Step 1: Template & ISOs */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={useFromTemplate}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setUseFromTemplate(on);
                        if (!on) {
                          setTemplateLibraryId("");
                          setCreateForm((f) => ({
                            ...f,
                            content_item_id: undefined,
                            spec: defaultVmSpec(),
                          }));
                        }
                      }}
                      disabled={createSubmitting}
                    />
                    Deploy from content library template
                  </label>
                  {useFromTemplate && (
                    <div className="space-y-3 pl-1 border-l-2 border-primary-200 dark:border-primary-800 ml-1 py-1">
                      {clLoading ? (
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading libraries…
                        </p>
                      ) : (
                        <>
                          <div>
                            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
                              Content library
                            </label>
                            <select
                              className="w-full rounded-md border border-panel bg-surface px-3 py-2 text-sm dark:text-gray-100"
                              value={templateLibraryId}
                              onChange={(e) => {
                                const v = e.target.value;
                                setTemplateLibraryId(v);
                                setCreateForm((f) => ({ ...f, content_item_id: undefined }));
                              }}
                              disabled={createSubmitting}
                            >
                              <option value="">Select library</option>
                              {contentLibraries.map((lib) => (
                                <option key={lib.id} value={lib.id}>
                                  {lib.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
                              VM template
                            </label>
                            {templateItemsLoading ? (
                              <p className="text-sm text-gray-500">Loading templates…</p>
                            ) : (
                              <select
                                className="w-full rounded-md border border-panel bg-surface px-3 py-2 text-sm dark:text-gray-100"
                                value={createForm.content_item_id ?? ""}
                                onChange={(e) =>
                                  setCreateForm((f) => ({
                                    ...f,
                                    content_item_id: e.target.value || undefined,
                                  }))
                                }
                                disabled={createSubmitting || !templateLibraryId}
                              >
                                <option value="">Select template</option>
                                {templateItems.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name} {t.version ? `(${t.version})` : ""}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Attach ISOs at creation (optional)
                    </p>
                    <div>
                      <label className="mb-1 block text-sm text-gray-600 dark:text-gray-400">
                        ISO library
                      </label>
                      <select
                        className="w-full rounded-md border border-panel bg-surface px-3 py-2 text-sm dark:text-gray-100"
                        value={isoLibraryId}
                        onChange={(e) => {
                          setIsoLibraryId(e.target.value);
                          setCreateForm((f) => ({ ...f, iso_content_item_ids: [] }));
                        }}
                        disabled={createSubmitting}
                      >
                        <option value="">None</option>
                        {contentLibraries.map((lib) => (
                          <option key={lib.id} value={lib.id}>
                            {lib.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {isoLibraryId && (
                      <div className="mt-2">
                        {isoCandidatesLoading ? (
                          <p className="text-sm text-gray-500">Loading ISOs…</p>
                        ) : (
                          <ul className="max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md divide-y dark:divide-gray-800">
                            {isoCandidates.map((iso) => {
                              const selected =
                                createForm.iso_content_item_ids?.includes(iso.id) ?? false;
                              return (
                                <li key={iso.id}>
                                  <label className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      onChange={(e) => {
                                        setCreateForm((f) => {
                                          const cur = new Set(f.iso_content_item_ids ?? []);
                                          if (e.target.checked) cur.add(iso.id);
                                          else cur.delete(iso.id);
                                          return { ...f, iso_content_item_ids: Array.from(cur) };
                                        });
                                      }}
                                    />
                                    <span>{iso.name}</span>
                                  </label>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        {(createForm.iso_content_item_ids?.length ?? 0) > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {createForm.iso_content_item_ids!.length} ISO(s) selected
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Compute */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <Input
                    label="CPUs"
                    type="number"
                    value={String(createForm.spec.compute.cpus)}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        spec: {
                          ...f.spec,
                          compute: {
                            ...f.spec.compute,
                            cpus: Math.max(1, Math.min(128, parseInt(e.target.value, 10) || 1)),
                          },
                        },
                      }))
                    }
                    fullWidth
                    disabled={createSubmitting}
                  />
                  <Input
                    label="Memory (MB)"
                    type="number"
                    value={String(createForm.spec.compute.memorySizeMb)}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        spec: {
                          ...f.spec,
                          compute: {
                            ...f.spec.compute,
                            memorySizeMb: Math.max(
                              512,
                              Math.min(1048576, parseInt(e.target.value, 10) || 512)
                            ),
                          },
                        },
                      }))
                    }
                    fullWidth
                    disabled={createSubmitting}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    CPUs: 1–128. Memory: 512 MB–1 TB.
                  </p>
                </div>
              )}

              {/* Step 3: Storage */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      VM storage class (optional)
                    </label>
                    <select
                      className="w-full rounded-md border border-panel bg-surface px-4 py-2 text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-panel dark:bg-surface dark:text-gray-100"
                      value={createForm.spec.storage.vmStorageClass ?? ""}
                      onChange={(e) =>
                        setCreateForm((f) => ({
                          ...f,
                          spec: {
                            ...f.spec,
                            storage: {
                              ...f.spec.storage,
                              vmStorageClass: e.target.value || undefined,
                            },
                          },
                        }))
                      }
                      disabled={
                        createSubmitting || storageClassesLoading || storageClasses.length === 0
                      }
                    >
                      <option value="">
                        {storageClassesLoading
                          ? "Loading storage classes…"
                          : "Select storage class"}
                      </option>
                      {storageClasses.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                    {storageClassesError && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                        {storageClassesError}
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Disks
                      </label>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setCreateForm((f) => ({
                            ...f,
                            spec: {
                              ...f.spec,
                              storage: {
                                ...f.spec.storage,
                                disks: [...f.spec.storage.disks, { sizeMb: 20 * 1024 }],
                              },
                            },
                          }))
                        }
                        disabled={createSubmitting}
                      >
                        Add disk
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {createForm.spec.storage.disks.map((disk, idx) => (
                        <div
                          key={idx}
                          className="flex gap-2 items-center rounded border border-gray-200 dark:border-gray-700 p-2"
                        >
                          <Input
                            type="number"
                            placeholder="Size (MB)"
                            value={String(disk.sizeMb)}
                            onChange={(e) =>
                              setCreateForm((f) => {
                                const disks = [...f.spec.storage.disks];
                                disks[idx] = {
                                  ...disks[idx],
                                  sizeMb: Math.max(1, parseInt(e.target.value, 10) || 1),
                                };
                                return {
                                  ...f,
                                  spec: { ...f.spec, storage: { ...f.spec.storage, disks } },
                                };
                              })
                            }
                            className="w-32"
                            disabled={createSubmitting}
                          />
                          <select
                            className="flex-1 rounded-md border border-panel bg-surface px-3 py-2 text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-panel dark:bg-surface dark:text-gray-100"
                            value={disk.storageClass ?? ""}
                            onChange={(e) =>
                              setCreateForm((f) => {
                                const disks = [...f.spec.storage.disks];
                                disks[idx] = {
                                  ...disks[idx],
                                  storageClass: e.target.value || undefined,
                                };
                                return {
                                  ...f,
                                  spec: { ...f.spec, storage: { ...f.spec.storage, disks } },
                                };
                              })
                            }
                            disabled={
                              createSubmitting ||
                              storageClassesLoading ||
                              storageClasses.length === 0
                            }
                          >
                            <option value="">
                              {storageClassesLoading
                                ? "Loading storage classes…"
                                : "Select storage class"}
                            </option>
                            {storageClasses.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() =>
                              setCreateForm((f) => ({
                                ...f,
                                spec: {
                                  ...f.spec,
                                  storage: {
                                    ...f.spec.storage,
                                    disks: f.spec.storage.disks.filter((_, i) => i !== idx),
                                  },
                                },
                              }))
                            }
                            disabled={createSubmitting || createForm.spec.storage.disks.length <= 1}
                            className="p-2 text-gray-500 hover:text-red-600 rounded"
                            aria-label="Remove disk"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      At least one disk required. Size in MB.
                    </p>
                    {!storageClassesLoading && storageClasses.length === 0 && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        No storage classes available for the selected datacenter grant.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Network */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Network interfaces
                    </label>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setCreateForm((f) => ({
                          ...f,
                          spec: {
                            ...f.spec,
                            network: {
                              nics: [
                                ...(f.spec.network?.nics ?? []),
                                { isPrimary: false, network: "", ip_allocation: "dhcp" },
                              ],
                            },
                          },
                        }))
                      }
                      disabled={createSubmitting}
                    >
                      Add NIC
                    </Button>
                  </div>
                  {(createForm.spec.network?.nics?.length ?? 0) === 0 ? (
                    <p className="text-sm text-gray-500">
                      No NICs. Add one or leave empty to use defaults.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {(createForm.spec.network?.nics ?? []).map((nic, idx) => (
                        <div
                          key={idx}
                          className="rounded border border-gray-200 dark:border-gray-700 p-3 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 text-sm">
                              <input
                                type="checkbox"
                                checked={nic.isPrimary}
                                onChange={(e) =>
                                  setCreateForm((f) => {
                                    const nics = [...(f.spec.network?.nics ?? [])];
                                    nics[idx] = { ...nics[idx], isPrimary: e.target.checked };
                                    return { ...f, spec: { ...f.spec, network: { nics } } };
                                  })
                                }
                                disabled={createSubmitting}
                              />
                              Primary
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                setCreateForm((f) => ({
                                  ...f,
                                  spec: {
                                    ...f.spec,
                                    network: {
                                      nics: (f.spec.network?.nics ?? []).filter(
                                        (_, i) => i !== idx
                                      ),
                                    },
                                  },
                                }))
                              }
                              disabled={
                                createSubmitting ||
                                (createForm.spec.network?.nics?.length ?? 0) <= 1
                              }
                              className="p-1 text-gray-500 hover:text-red-600 rounded"
                              aria-label="Remove NIC"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <Input
                            label="Network name or ID"
                            placeholder="default"
                            value={nic.network ?? ""}
                            onChange={(e) =>
                              setCreateForm((f) => {
                                const nics = [...(f.spec.network?.nics ?? [])];
                                nics[idx] = { ...nics[idx], network: e.target.value || undefined };
                                return { ...f, spec: { ...f.spec, network: { nics } } };
                              })
                            }
                            fullWidth
                            disabled={createSubmitting}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="mb-1 block text-xs text-gray-500">
                                IP allocation
                              </label>
                              <select
                                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                value={nic.ip_allocation}
                                onChange={(e) =>
                                  setCreateForm((f) => {
                                    const nics = [...(f.spec.network?.nics ?? [])];
                                    nics[idx] = {
                                      ...nics[idx],
                                      ip_allocation: e.target.value as "dhcp" | "static" | "pool",
                                    };
                                    return { ...f, spec: { ...f.spec, network: { nics } } };
                                  })
                                }
                                disabled={createSubmitting}
                              >
                                <option value="dhcp">DHCP</option>
                                <option value="static">Static</option>
                                <option value="pool">Pool</option>
                              </select>
                            </div>
                            {nic.ip_allocation === "static" && (
                              <Input
                                label="IP address"
                                placeholder="192.168.1.10"
                                value={nic.ip_address ?? ""}
                                onChange={(e) =>
                                  setCreateForm((f) => {
                                    const nics = [...(f.spec.network?.nics ?? [])];
                                    nics[idx] = {
                                      ...nics[idx],
                                      ip_address: e.target.value || null,
                                    };
                                    return { ...f, spec: { ...f.spec, network: { nics } } };
                                  })
                                }
                                fullWidth
                                disabled={createSubmitting}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: OS */}
              {wizardStep === 5 && (
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      OS type
                    </label>
                    <select
                      className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                      value={createForm.spec.os?.type ?? "linux"}
                      onChange={(e) =>
                        setCreateForm((f) => ({
                          ...f,
                          spec: {
                            ...f.spec,
                            os: {
                              ...f.spec.os!,
                              type: e.target.value as "linux" | "windows" | "bsd",
                            },
                          },
                        }))
                      }
                      disabled={createSubmitting}
                    >
                      <option value="linux">Linux</option>
                      <option value="windows">Windows</option>
                      <option value="bsd">BSD</option>
                    </select>
                  </div>
                  <Input
                    label="Distribution (optional)"
                    placeholder="e.g. ubuntu, centos, windows-server"
                    value={createForm.spec.os?.distribution ?? ""}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        spec: {
                          ...f.spec,
                          os: { ...f.spec.os!, distribution: e.target.value || undefined },
                        },
                      }))
                    }
                    fullWidth
                    disabled={createSubmitting}
                  />
                  <Input
                    label="Version (optional)"
                    placeholder="e.g. 22.04"
                    value={createForm.spec.os?.version ?? ""}
                    onChange={(e) =>
                      setCreateForm((f) => ({
                        ...f,
                        spec: {
                          ...f.spec,
                          os: { ...f.spec.os!, version: e.target.value || undefined },
                        },
                      }))
                    }
                    fullWidth
                    disabled={createSubmitting}
                  />
                </div>
              )}

              {/* Step 6: Review */}
              {wizardStep === 6 && (
                <div className="space-y-3 text-sm">
                  <p>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>{" "}
                    {createForm.name || "—"}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Datacenter:
                    </span>{" "}
                    {grants.find((g) => g.id === createForm.tenant_datacenter_grant_id)?.datacenter
                      ?.name ??
                      createForm.tenant_datacenter_grant_id ??
                      "—"}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Template:</span>{" "}
                    {createForm.content_item_id ? createForm.content_item_id : "—"}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      ISOs at create:
                    </span>{" "}
                    {(createForm.iso_content_item_ids?.length ?? 0) > 0
                      ? createForm.iso_content_item_ids!.join(", ")
                      : "—"}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Compute:</span>{" "}
                    {createForm.spec.compute.cpus} CPUs, {createForm.spec.compute.memorySizeMb} MB
                    RAM
                  </p>
                  <p>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Storage:</span>{" "}
                    {createForm.spec.storage.disks.length} disk(s) —{" "}
                    {createForm.spec.storage.disks.map((d) => `${d.sizeMb} MB`).join(", ")}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Network:</span>{" "}
                    {(createForm.spec.network?.nics?.length ?? 0) > 0
                      ? createForm.spec.network!.nics.length + " NIC(s)"
                      : "default"}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700 dark:text-gray-300">OS:</span>{" "}
                    {createForm.spec.os?.type ?? "linux"}{" "}
                    {[createForm.spec.os?.distribution, createForm.spec.os?.version]
                      .filter(Boolean)
                      .join(" ")}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between gap-2 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="secondary"
                onClick={() => (wizardStep > 0 ? setWizardStep((s) => s - 1) : handleCloseWizard())}
                disabled={createSubmitting}
              >
                {wizardStep > 0 ? (
                  <>
                    <ChevronLeft size={18} className="mr-1" />
                    Back
                  </>
                ) : (
                  "Cancel"
                )}
              </Button>
              {wizardStep < WIZARD_STEPS.length - 1 ? (
                <Button onClick={handleNext} disabled={createSubmitting || grantsLoading}>
                  Next
                  <ChevronRight size={18} className="ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleCreateVm}
                  disabled={createSubmitting || grants.length === 0}
                  isLoading={createSubmitting}
                >
                  {createSubmitting ? "Creating…" : "Create VM"}
                </Button>
              )}
            </div>
          </div>
        </Modal>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : (
                <Table
                  columns={columns}
                  data={vms}
                  emptyMessage="No VMs yet. Create one to get started."
                  overflowVisibleColumnKeys={["actions"]}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {tenantId && attachIsoVm && (
        <AttachIsoModal
          isOpen
          onClose={() => setAttachIsoVm(null)}
          tenantId={tenantId}
          vmId={attachIsoVm.id}
          vmName={attachIsoVm.name}
          onSuccess={() => void loadVms()}
        />
      )}
      {tenantId && publishVm && (
        <PublishTemplateModal
          isOpen
          onClose={() => setPublishVm(null)}
          tenantId={tenantId}
          vmId={publishVm.id}
          vmName={publishVm.name}
          onSuccess={() => void loadVms()}
        />
      )}
      {tenantId && consoleVm && (
        <VmConsoleModal
          isOpen
          onClose={() => setConsoleVm(null)}
          tenantId={tenantId}
          vmId={consoleVm.id}
          vmName={consoleVm.name}
        />
      )}
    </div>
  );
}

export default function TenantVmsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-app flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <TenantVmsPageInner />
    </Suspense>
  );
}
