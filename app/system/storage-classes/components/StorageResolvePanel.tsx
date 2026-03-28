"use client";

import { useState } from "react";
import { Label } from "@/components/ui/atoms/label";
import { Select } from "@/components/ui/atoms/select";
import { Textarea } from "@/components/ui/atoms/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useStorageClasses } from "../hooks/useStorageClasses";
import { storageApi } from "@/lib/api/storage";
import { useToast } from "@/lib/toast";

export default function StorageResolvePanel() {
  const { data: classes = [], isLoading } = useStorageClasses();
  const [name, setName] = useState<string>("");
  const [bodyJson, setBodyJson] = useState<string>("{}");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { toast } = useToast();

  const classOptions = classes.map((c) => ({ value: c.name, label: c.name }));

  const handleRun = async () => {
    setError(null);
    setResult(null);
    if (!name) {
      setError("Select a storage class");
      return;
    }
    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(bodyJson || "{}") as Record<string, unknown>;
    } catch {
      setError("Request body must be valid JSON");
      return;
    }
    setPending(true);
    try {
      const out = await storageApi.resolveStorageClass(name, body);
      setResult(JSON.stringify(out, null, 2));
      toast.success("Resolve completed");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Resolve failed";
      setError(msg);
      toast.error("Resolve failed", msg);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <p className="text-sm text-gray-600">
        Dry-run scheduler resolution (optional <code className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded">POST …/resolve</code> — may
        404 until enabled).
      </p>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="resolve-class">Storage class</Label>
        <Select
          id="resolve-class"
          placeholder={isLoading ? "Loading…" : "Choose a class"}
          options={classOptions}
          value={name}
          onChange={setName}
          disabled={isLoading || classOptions.length === 0}
          fullWidth
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="resolve-body">Request JSON (optional)</Label>
        <Textarea
          id="resolve-body"
          value={bodyJson}
          onChange={(e) => setBodyJson(e.target.value)}
          rows={6}
          fullWidth
          className="font-mono text-sm"
          placeholder='{ "tenantId": "...", "datacenterId": "..." }'
        />
      </div>

      <button
        type="button"
        onClick={handleRun}
        disabled={pending || !name}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Running…" : "Run resolve"}
      </button>

      {result && (
        <div className="space-y-2">
          <span className="block text-sm font-medium text-gray-700">Response</span>
          <pre className="text-xs bg-gray-100 text-gray-800 p-4 rounded-lg border border-gray-200 overflow-auto max-h-[320px]">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}
