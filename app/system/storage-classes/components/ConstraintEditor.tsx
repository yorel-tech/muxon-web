"use client";

import { Input } from "@/components/ui/atoms/input";
import { Label } from "@/components/ui/atoms/label";

interface ConstraintEditorProps {
  constraints: any;
  onChange: (constraints: any) => void;
}

export default function ConstraintEditor({ constraints, onChange }: ConstraintEditorProps) {
  const updateConstraint = (key: string, value: any) => {
    onChange({ ...constraints, [key]: value });
  };

  return (
    <div className="space-y-4 border rounded-lg p-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minIops">Minimum IOPS</Label>
          <Input
            id="minIops"
            type="number"
            min={0}
            value={constraints.minIops ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") {
                const next = { ...constraints };
                delete next.minIops;
                onChange(next);
                return;
              }
              updateConstraint("minIops", Math.max(0, parseInt(v, 10) || 0));
            }}
            placeholder="10000"
          />
        </div>

        <div>
          <Label htmlFor="maxLatencyMs">Max Latency (ms)</Label>
          <Input
            id="maxLatencyMs"
            type="number"
            min={0}
            value={constraints.maxLatencyMs ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") {
                const next = { ...constraints };
                delete next.maxLatencyMs;
                onChange(next);
                return;
              }
              updateConstraint("maxLatencyMs", Math.max(0, parseInt(v, 10) || 0));
            }}
            placeholder="10"
          />
        </div>
      </div>
    </div>
  );
}
