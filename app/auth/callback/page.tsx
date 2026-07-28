"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchOidcConfigIfNeeded, getUserManager } from "@lib/oidc";
import { apiGet } from "@lib/api";
import { persistTenantContext, TenantInfo } from "@lib/tenant-context";
import { useAuth } from "@lib/auth-context";

interface BootstrapStatusDto {
  systemStatus: "NOTREADY" | "BOOTSTRAPPED" | "READY";
}

interface TenantListResponse {
  items?: Array<{ id?: string; name?: string; displayName?: string }>;
}

export default function Callback() {
  const router = useRouter();
  const { checkAuth } = useAuth();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchOidcConfigIfNeeded();
      if (cancelled) return;
      const um = getUserManager();
      if (!um) return;
      um.signinRedirectCallback()
        .then(async () => {
          if (cancelled) return;
          await checkAuth();
          if (cancelled) return;
          const loginType = sessionStorage.getItem("loginType") || "system";
          sessionStorage.removeItem("loginType");

          if (loginType === "tenant") {
            try {
              const tenantList = await apiGet<TenantListResponse>("/api/v1/tenants/mine");
              const tenants: TenantInfo[] = (tenantList.items ?? [])
                .filter(
                  (t): t is { id: string; name: string; displayName?: string } => !!t.id && !!t.name
                )
                .map((t) => ({ id: t.id, name: t.name, displayName: t.displayName }));

              if (tenants.length === 0) {
                persistTenantContext([], null);
                router.replace("/tenant/no-tenants");
              } else if (tenants.length === 1) {
                persistTenantContext(tenants, tenants[0].id);
                router.replace("/tenant/dashboard");
              } else {
                persistTenantContext(tenants, null);
                router.replace("/tenant/select");
              }
            } catch (error) {
              console.error("Error resolving tenant memberships:", error);
              router.replace("/tenant/no-tenants");
            }
          } else {
            try {
              const status: BootstrapStatusDto = await apiGet("/api/v1/status");
              if (status.systemStatus === "READY") {
                router.replace("/system/dashboard");
              } else {
                router.replace("/system");
              }
            } catch (error) {
              console.error("Error fetching bootstrap status:", error);
              router.replace("/system");
            }
          }
        })
        .catch((e) => {
          console.error("OIDC callback failed", e);
          router.replace("/");
        });
    })();
    return () => {
      cancelled = true;
    };
  }, [router, checkAuth]);

  return <main className="p-8">Signing you in…</main>;
}
