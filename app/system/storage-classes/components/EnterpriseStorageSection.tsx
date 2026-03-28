"use client";

import { useProductInfo } from "@/lib/product-info-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/atoms/card";
import { Badge } from "@/components/ui/atoms/badge";
import { Activity, Layers, Truck } from "lucide-react";

export default function EnterpriseStorageSection() {
  const { isEnterprise, loading } = useProductInfo();

  if (loading) {
    return <p className="text-sm text-gray-600">Loading product edition…</p>;
  }

  if (!isEnterprise) {
    return (
      <Card className="border-dashed bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Enterprise storage</CardTitle>
          <CardDescription>
            Tier policies, performance history, and managed migrations are available in Nexus /
            Enterprise editions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">Core edition</Badge>
        </CardContent>
      </Card>
    );
  }

  const tiles = [
    {
      title: "Performance history",
      description: "GET /api/v1/storage/performance-history — telemetry and time series for provider storage.",
      icon: <Activity className="h-5 w-5" />,
    },
    {
      title: "Tier policies",
      description: "CRUD /api/v1/storage-tier-policies — rules and evaluate/simulate actions.",
      icon: <Layers className="h-5 w-5" />,
    },
    {
      title: "Managed migrations",
      description: "POST /api/v1/storage/migrations — request orchestrated volume moves between tiers.",
      icon: <Truck className="h-5 w-5" />,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
      {tiles.map((t) => (
        <Card key={t.title}>
          <CardHeader className="flex flex-row items-start gap-3 space-y-0">
            <div className="mt-0.5 text-gray-500">{t.icon}</div>
            <div>
              <CardTitle className="text-base text-gray-900">{t.title}</CardTitle>
              <CardDescription className="mt-1.5 !text-gray-600">{t.description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">UI coming next</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
