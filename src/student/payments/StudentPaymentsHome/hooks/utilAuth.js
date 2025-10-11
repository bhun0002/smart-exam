// src/student/payments/StudentPaymentsHome/hooks/utilAuth.js

import { useAuth } from "../../../../AuthContext";

// The same key your AuthProvider uses
const STORAGE_KEY = "authenticatedUser";

// Normalize the user object to a consistent shape for the payments module
function normalizeUser(u) {
  if (!u) {
    return {
      uid: null,
      email: null,
      displayName: "",
      role: null,
      intakeId: null,
      courseId: null,
    };
  }
  return {
    uid: u.id ?? u.uid ?? null,
    email: u.email ?? null,
    displayName: u.name ?? u.displayName ?? "",
    role: u.role ?? null,
    intakeId: u.intake ?? u.intakeId ?? null,
    courseId: u.courseId ?? null,
  };
}

/**
 * Non-hook helper for places where we cannot call React hooks
 * (e.g., plain utility modules). Reads from sessionStorage using the
 * same key as AuthProvider to stay in sync.
 */
export function getAuthUser() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return normalizeUser(parsed);
  } catch {
    // Corrupted or missing storage — return empty normalized user
    return normalizeUser(null);
  }
}

/**
 * React hook version that prefers context (live) and falls back to storage.
 * Safe to use inside components or other custom hooks.
 */
export function useAuthUser() {
  const ctx = useAuth?.();
  const fromCtx = normalizeUser(ctx?.user);
  if (fromCtx.uid) return fromCtx;
  // Fallback to storage if context not ready (e.g., page reload timing)
  return getAuthUser();
}
