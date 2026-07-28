import { NextRequest, NextResponse } from "next/server";

/**
 * VM console open (GET) blocks on core-services while it polls queue_entry for orchestrator
 * VM_CONSOLE_RESOLVE_COMMAND completion — often 1–90+ seconds with no response bytes until the end.
 * Next.js fallback rewrites use a short-lived proxy that can ECONNRESET ("socket hang up") on this path.
 * This route handler proxies explicitly with a long upstream timeout.
 */
const BACKEND_API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

/** Must exceed core-services muxon.console.resolve-timeout-seconds (default 90) plus slack. */
const UPSTREAM_TIMEOUT_MS = 120_000;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string; vmId: string }> }
) {
  const { tenantId, vmId } = await params;
  const backendUrl = `${BACKEND_API_BASE}/api/v1/tenants/${tenantId}/vms/${vmId}/console`;

  const authHeader = request.headers.get("authorization");
  const cookieHeader = request.headers.get("cookie");
  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }
  if (cookieHeader) {
    headers["Cookie"] = cookieHeader;
  }

  try {
    const response = await fetch(backendUrl, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    const contentType = response.headers.get("content-type") || "application/json";
    const body = await response.arrayBuffer();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        "Content-Type": contentType,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `[console proxy] Failed to reach core-services console endpoint (timeout ${UPSTREAM_TIMEOUT_MS}ms): ${backendUrl}`,
      error
    );
    return NextResponse.json(
      {
        code: "CONSOLE_PROXY_ERROR",
        message: `Failed to reach API for VM console: ${message}`,
      },
      { status: 502 }
    );
  }
}
