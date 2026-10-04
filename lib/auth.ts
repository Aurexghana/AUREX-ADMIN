"use client";

import { useSyncExternalStore } from "react";
import { apiFetch, ApiError } from "@/lib/api/client";

export type SessionUser = {
  id: string;
  nickname: string | null;
  email: string | null;
  role: string | null;
  isSuperAdmin: boolean;
};

export type Session = {
  sessionId?: string;
  user: SessionUser;
};

// Own namespaced key, same reasoning as lib/theme.ts's STORAGE_KEY - this
// app's storage is already isolated on its own origin, but a distinct
// name keeps it clearly labeled next to "aurex-admin-theme" if anyone
// inspects storage directly.
const STORAGE_KEY = "aurex-admin-session";

let cached: Session | null | undefined; // undefined = not yet read from storage
const listeners = new Set<() => void>();

function readStorage(): Session | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function getSnapshot(): Session | null {
  if (cached === undefined) cached = readStorage();
  return cached;
}

function getServerSnapshot(): Session | null {
  return null;
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  const handleStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    cached = readStorage();
    onStoreChange();
  };
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
}

function setSession(next: Session | null) {
  cached = next;
  try {
    if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Session still applies for this page load even if it can't persist.
  }
  listeners.forEach((listener) => listener());
}

type LoginResponse = { accessToken: string; refreshToken: string; sessionId?: string; user: SessionUser };

export type RegisterAdminParams = { name: string; email: string; password: string; pincode: string };

type RegisterAdminResponse = {
  accessToken?: string;
  refreshToken?: string;
  sessionId?: string;
  user: SessionUser;
};

/**
 * Real admin session, backed by Aurex-backend's /auth/login and /auth/logout.
 * Only role: "admin" accounts are accepted here - anyone else authenticates
 * fine against the backend but has no business in this app, so that's
 * rejected client-side rather than left to silently 403 on every
 * subsequent request.
 */
export function useSession() {
  const session = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  async function login(email: string, password: string): Promise<void> {
    const { data } = await apiFetch<LoginResponse>("/auth/login", { method: "POST", body: { email, password, role: "admin" } });
    if (data.user.role !== "admin") {
      throw new ApiError("This account doesn't have admin access.", 403);
    }
    setSession({ sessionId: data.sessionId, user: data.user });
  }

  async function logout(): Promise<void> {
    const current = getSnapshot();
    if (current?.sessionId) {
      try {
        await apiFetch("/auth/logout", {
          method: "POST",
          body: { sessionId: current.sessionId },
        });
      } catch {
        // best-effort - still clear local state even if the server call fails
      }
    }
    setSession(null);
  }

  async function registerAdmin(params: RegisterAdminParams): Promise<{ activated: boolean }> {
    const { data } = await apiFetch<RegisterAdminResponse>("/auth/register-admin", {
      method: "POST",
      body: params,
    });
    if (data.accessToken) {
      setSession({ sessionId: data.sessionId, user: data.user });
      return { activated: true };
    }
    return { activated: false };
  }

  return {
    session,
    isAuthenticated: session !== null,
    login,
    logout,
    registerAdmin,
  };
}

export async function restoreSession(): Promise<void> {
  try {
    const { data } = await apiFetch<SessionUser>("/users/me");
    if (data.role !== "admin") {
      setSession(null);
      return;
    }
    setSession({ sessionId: getSnapshot()?.sessionId, user: data });
  } catch {
    setSession(null);
  }
}
