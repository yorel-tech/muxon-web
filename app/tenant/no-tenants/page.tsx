"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/atoms/button";
import { Card, CardContent, CardHeader } from "@/components/ui/atoms/card";

export default function NoTenantsPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl w-full py-8">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            No Tenants Available
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Your account is authenticated, but no tenant access is currently assigned.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Contact your platform administrator to grant tenant membership.
          </p>
          <Button variant="secondary" onClick={() => router.replace("/")}>
            Back to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
