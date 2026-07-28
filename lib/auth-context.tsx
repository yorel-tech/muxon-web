"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { fetchOidcConfigIfNeeded, getUserManager } from "./oidc";

/** Best-effort display label from OIDC claims (IdPs vary: name, preferred_username, given+family, email, sub). */
function displayNameFromProfile(profile: Record<string, unknown>): string {
  const name = profile.name;
  if (typeof name === "string" && name.trim()) return name.trim();

  const preferred = profile.preferred_username ?? profile.preferredUsername;
  if (typeof preferred === "string" && preferred.trim()) return preferred.trim();

  const gn = profile.given_name;
  const fn = profile.family_name;
  const given = typeof gn === "string" ? gn.trim() : "";
  const family = typeof fn === "string" ? fn.trim() : "";
  const combined = [given, family].filter(Boolean).join(" ");
  if (combined) return combined;

  const email = profile.email;
  if (typeof email === "string" && email.includes("@")) {
    const local = email.split("@")[0]?.trim();
    if (local) return local;
  }

  const sub = profile.sub;
  if (typeof sub === "string" && sub.trim()) return sub.trim();

  return "User";
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  userRole?: "system" | "tenant";
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string }>();
  const [userRole, setUserRole] = useState<"system" | "tenant">("tenant");

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchOidcConfigIfNeeded();
      const um = getUserManager();
      if (!um) {
        setIsAuthenticated(false);
        setUser(undefined);
        return;
      }
      const userData = await um.getUser();
      if (userData) {
        setIsAuthenticated(true);
        const rawProfile = userData.profile as Record<string, unknown>;
        setUser({
          name: displayNameFromProfile(rawProfile),
          email: (typeof rawProfile.email === "string" ? rawProfile.email : "") || "",
          avatar: typeof rawProfile.picture === "string" ? rawProfile.picture : undefined,
        });

        // Extract roles from OIDC token
        // Roles can be in different locations depending on IDP configuration
        const profile = userData.profile as Record<string, unknown> & {
          roles?: string[];
          realm_access?: { roles?: string[] };
        };
        const roles = profile.roles || profile.realm_access?.roles || [];

        // Determine user role based on roles
        // 'system:admin' maps to 'system', other roles map to 'tenant'
        const hasSystemRole = roles.some(
          (role: string) => role === "system:admin" || role.startsWith("system:")
        );
        setUserRole(hasSystemRole ? "system" : "tenant");
      } else {
        setIsAuthenticated(false);
        setUser(undefined);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      setIsAuthenticated(false);
      setUser(undefined);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  // Keep React auth state in sync when OIDC completes after the initial mount (e.g. sign-in callback).
  useEffect(() => {
    let cancelled = false;
    let um: ReturnType<typeof getUserManager> = null;

    const onUserLoaded = () => {
      void checkAuth();
    };

    void (async () => {
      await fetchOidcConfigIfNeeded();
      if (cancelled) return;
      um = getUserManager();
      if (cancelled) return;
      um?.events.addUserLoaded(onUserLoaded);
    })();

    return () => {
      cancelled = true;
      um?.events.removeUserLoaded(onUserLoaded);
    };
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, checkAuth, user, userRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
