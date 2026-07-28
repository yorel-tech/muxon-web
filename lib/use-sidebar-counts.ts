"use client";

import { useEffect, useState } from "react";
import { apiGet } from "./api";

export interface SidebarCounts {
  users: number;
  tenants: number;
  vms: number;
}

export interface PaginatedResponse {
  total: number;
  page: number;
  perPage?: number;
  per_page?: number;
  items: any[];
}

interface SystemOverviewCounts {
  tenantCount?: number;
  vmCount?: number;
}

/**
 * @param tenantId - Required when userRole is tenant; VM count uses `/api/v1/tenants/{tenantId}/vms` or overview when aligned.
 */
export function useSidebarCounts(
  userRole: "system" | "tenant",
  enabled = true,
  tenantId: string | null = null
) {
  const [counts, setCounts] = useState<SidebarCounts>({
    users: 0,
    tenants: 0,
    vms: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchCounts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const fetchPromises: Promise<any>[] = [];

        if (userRole === "system") {
          fetchPromises.push(
            apiGet<PaginatedResponse>("/api/v1/system-users", {
              baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
              requireAuth: true,
            }).catch((err) => {
              console.error("Error fetching users count:", err);
              return { total: 0 };
            })
          );

          fetchPromises.push(
            apiGet<SystemOverviewCounts>("/api/v1/system-overview", {
              baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
              requireAuth: true,
            }).catch((err) => {
              console.error("Error fetching system overview:", err);
              return {};
            })
          );
        } else if (tenantId) {
          fetchPromises.push(
            apiGet<PaginatedResponse>(`/api/v1/tenants/${tenantId}/vms`, {
              baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
              requireAuth: true,
            }).catch((err) => {
              console.error("Error fetching VMs count:", err);
              return { total: 0 };
            })
          );
        }

        const results = await Promise.all(fetchPromises);

        const newCounts: SidebarCounts = {
          users: 0,
          tenants: 0,
          vms: 0,
        };

        if (userRole === "system") {
          newCounts.users = results[0]?.total ?? 0;
          const overview = results[1] as SystemOverviewCounts;
          newCounts.tenants = typeof overview?.tenantCount === "number" ? overview.tenantCount : 0;
          newCounts.vms = typeof overview?.vmCount === "number" ? overview.vmCount : 0;
        } else if (tenantId) {
          newCounts.vms = results[0]?.total ?? 0;
        }

        setCounts(newCounts);
      } catch (err) {
        console.error("Error fetching sidebar counts:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch counts"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounts();
  }, [userRole, enabled, tenantId]);

  return { counts, isLoading, error, refetch: () => {} };
}
