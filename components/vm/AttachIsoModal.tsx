"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/molecules/modal";
import { Button } from "@/components/ui/atoms/button";
import { Input } from "@/components/ui/atoms/input";
import { fetchTenantContentLibraries, fetchAllContentItems } from "@/lib/api/content-library";
import { attachIsoToVm } from "@/lib/api/vm";
import type { ContentLibraryRow, ContentItemRow } from "@/types/content-library";
import { formatBytes } from "@/lib/format-bytes";

const PAGE_SIZE = 8;

export interface AttachIsoModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  vmId: string;
  vmName: string;
  onSuccess: () => void;
}

type Step = "library" | "iso";

export function AttachIsoModal({
  isOpen,
  onClose,
  tenantId,
  vmId,
  vmName,
  onSuccess,
}: AttachIsoModalProps) {
  const [step, setStep] = useState<Step>("library");
  const [libraries, setLibraries] = useState<ContentLibraryRow[]>([]);
  const [libsLoading, setLibsLoading] = useState(false);
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(null);
  const [isos, setIsos] = useState<ContentItemRow[]>([]);
  const [isosLoading, setIsosLoading] = useState(false);
  const [isoQuery, setIsoQuery] = useState("");
  const [isoPage, setIsoPage] = useState(0);
  const [selectedIsoId, setSelectedIsoId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep("library");
    setSelectedLibraryId(null);
    setIsos([]);
    setIsoQuery("");
    setIsoPage(0);
    setSelectedIsoId(null);
    setError(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const loadLibraries = useCallback(async () => {
    setLibsLoading(true);
    try {
      const data = await fetchTenantContentLibraries(tenantId, 1, 200);
      setLibraries(data.items ?? []);
    } catch {
      setLibraries([]);
    } finally {
      setLibsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (!isOpen) return;
    void loadLibraries();
    reset();
  }, [isOpen, loadLibraries]);

  const loadIsos = useCallback(async () => {
    if (!selectedLibraryId) return;
    setIsosLoading(true);
    setError(null);
    try {
      const all = await fetchAllContentItems("tenant", selectedLibraryId, tenantId);
      const onlyIso = all.filter((i) => (i.contentType ?? "").toLowerCase() === "iso");
      setIsos(onlyIso);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load ISOs");
      setIsos([]);
    } finally {
      setIsosLoading(false);
    }
  }, [selectedLibraryId, tenantId]);

  useEffect(() => {
    if (step === "iso" && selectedLibraryId) {
      void loadIsos();
    }
  }, [step, selectedLibraryId, loadIsos]);

  const filteredIsos = useMemo(() => {
    const q = isoQuery.trim().toLowerCase();
    if (!q) return isos;
    return isos.filter((i) => (i.name ?? "").toLowerCase().includes(q));
  }, [isos, isoQuery]);

  const totalIsoPages = Math.max(1, Math.ceil(filteredIsos.length / PAGE_SIZE));
  const currentIsoPage = Math.min(isoPage, totalIsoPages - 1);
  const isoSlice = filteredIsos.slice(
    currentIsoPage * PAGE_SIZE,
    currentIsoPage * PAGE_SIZE + PAGE_SIZE
  );

  useEffect(() => {
    setIsoPage(0);
  }, [isoQuery, selectedLibraryId]);

  const goNext = () => {
    if (!selectedLibraryId) return;
    setStep("iso");
    setSelectedIsoId(null);
    setIsoQuery("");
    setIsoPage(0);
  };

  const handleSave = async () => {
    if (!selectedIsoId) return;
    setSubmitting(true);
    setError(null);
    try {
      await attachIsoToVm(tenantId, vmId, selectedIsoId);
      onSuccess();
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Attach failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === "library" ? `Attach ISO — ${vmName}` : `Select ISO — ${vmName}`}
      size="lg"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {step === "library" && (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400">Choose a content library.</p>
            {libsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : libraries.length === 0 ? (
              <p className="text-sm text-gray-500">No libraries available.</p>
            ) : (
              <ul className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800 max-h-64 overflow-y-auto">
                {libraries.map((lib) => (
                  <li key={lib.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedLibraryId(lib.id)}
                      className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        selectedLibraryId === lib.id ? "bg-primary-50 dark:bg-primary-900/30" : ""
                      }`}
                    >
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {lib.name}
                      </span>
                      <span className="block text-xs text-gray-500">{lib.type ?? ""}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={goNext} disabled={!selectedLibraryId}>
                Next
              </Button>
            </div>
          </>
        )}

        {step === "iso" && (
          <>
            <Button variant="secondary" size="sm" onClick={() => setStep("library")}>
              ← Back to libraries
            </Button>
            <Input
              label="Search ISOs"
              value={isoQuery}
              onChange={(e) => setIsoQuery(e.target.value)}
              placeholder="Filter by name…"
              fullWidth
            />
            {isosLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <ul className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y max-h-56 overflow-y-auto">
                  {isoSlice.map((iso) => (
                    <li key={iso.id}>
                      <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                        <input
                          type="radio"
                          name="iso-pick"
                          checked={selectedIsoId === iso.id}
                          onChange={() => setSelectedIsoId(iso.id)}
                        />
                        <span className="flex-1 text-sm">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {iso.name}
                          </span>
                          <span className="block text-xs text-gray-500">
                            {iso.version ?? "—"} · {formatBytes(iso.sizeBytes)} ·{" "}
                            {iso.contentStatus ?? "—"}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                {filteredIsos.length === 0 && !isosLoading && (
                  <p className="text-sm text-gray-500">No ISO items in this library.</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Page {currentIsoPage + 1} / {totalIsoPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={currentIsoPage <= 0}
                      onClick={() => setIsoPage((p) => Math.max(0, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={currentIsoPage >= totalIsoPages - 1}
                      onClick={() => setIsoPage((p) => Math.min(totalIsoPages - 1, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => void handleSave()} disabled={!selectedIsoId || submitting}>
                {submitting ? "Saving…" : "Attach ISO"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
