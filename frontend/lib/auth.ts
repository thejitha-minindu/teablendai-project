export type UserRole = "buyer" | "seller";
export type AppRole = UserRole | "analytics";
export type UserStatus = "PENDING" | "APPROVED" | "REJECTED";

type AuthClaims = {
  sub?: string;
  id?: string;
  role?: UserRole;
  roles?: UserRole[];
  status?: UserStatus;
  seller_status?: UserStatus;
  exp?: number;
};

export type AuthChangeReason =
  | "login"
  | "logout"
  | "expired"
  | "refresh"
  | "switch-role";

export type AuthChangeDetail = {
  at: number;
  eventId: string;
  reason: AuthChangeReason;
};

export const AUTH_CHANGED_EVENT = "teablend-auth-changed";

const AUTH_TOKEN_KEY = "teablend_token";
const AUTH_SYNC_KEY = "teablend_auth_sync";
const AUTH_CHANNEL_NAME = "teablend-auth";
const LEGACY_AUTH_KEYS = ["access_token", "auth_token", "role"] as const;
const PROTECTED_PATH_PREFIXES = [
  "/buyer",
  "/seller",
  "/chatbot",
  "/messages",
  "/profile",
  "/orders",
  "/payment",
  "/analytics-dashboard",
  "/auth/profile",
  "/auth/pending",
  "/auth/rejected",
] as const;

const logoutListeners = new Set<() => void>();
let lastProcessedAuthEventId: string | null = null;

function createAuthChangeDetail(reason: AuthChangeReason): AuthChangeDetail {
  return {
    at: Date.now(),
    eventId: `${reason}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    reason,
  };
}

function isLogoutReason(reason: AuthChangeReason): boolean {
  return reason === "logout" || reason === "expired";
}

function runLogoutSideEffects(): void {
  if (typeof window === "undefined") return;

  for (const listener of logoutListeners) {
    try {
      listener();
    } catch (error) {
      console.error("Logout side effect failed", error);
    }
  }

  try {
    window.sessionStorage.clear();
  } catch (error) {
    console.error("Failed to clear session storage", error);
  }
}

function relayAuthChange(detail: AuthChangeDetail): void {
  if (typeof window === "undefined") return;
  if (lastProcessedAuthEventId === detail.eventId) return;

  lastProcessedAuthEventId = detail.eventId;

  if (isLogoutReason(detail.reason)) {
    runLogoutSideEffects();
  }

  window.dispatchEvent(new CustomEvent<AuthChangeDetail>(AUTH_CHANGED_EVENT, { detail }));
}

function readAuthSyncPayload(value: string | null): AuthChangeDetail | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<AuthChangeDetail>;
    if (
      typeof parsed.at !== "number" ||
      typeof parsed.eventId !== "string" ||
      typeof parsed.reason !== "string"
    ) {
      return null;
    }

    return parsed as AuthChangeDetail;
  } catch {
    return null;
  }
}

function postAuthChange(detail: AuthChangeDetail): void {
  if (typeof window === "undefined") return;

  relayAuthChange(detail);

  try {
    window.localStorage.setItem(AUTH_SYNC_KEY, JSON.stringify(detail));
  } catch (error) {
    console.error("Failed to write auth sync state", error);
  }

  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
    channel.postMessage(detail);
    channel.close();
  }
}

function normalizeLegacyToken(): string | null {
  if (typeof window === "undefined") return null;

  const primaryToken = window.localStorage.getItem(AUTH_TOKEN_KEY);
  if (primaryToken) {
    return primaryToken;
  }

  const legacyToken = window.localStorage.getItem("access_token") || window.localStorage.getItem("auth_token");
  if (!legacyToken) {
    return null;
  }

  window.localStorage.setItem(AUTH_TOKEN_KEY, legacyToken);
  for (const key of LEGACY_AUTH_KEYS) {
    if (key !== "role") {
      window.localStorage.removeItem(key);
    }
  }

  return legacyToken;
}

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function registerLogoutListener(listener: () => void): () => void {
  logoutListeners.add(listener);
  return () => {
    logoutListeners.delete(listener);
  };
}

export function subscribeToAuthChanges(
  callback: (detail: AuthChangeDetail) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  const handleAuthChange = (event: Event) => {
    const detail = (event as CustomEvent<AuthChangeDetail>).detail;
    if (!detail) return;
    callback(detail);
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== AUTH_SYNC_KEY) return;

    const detail = readAuthSyncPayload(event.newValue);
    if (!detail) return;

    relayAuthChange(detail);
  };

  let channel: BroadcastChannel | null = null;
  const handleMessage = (event: MessageEvent<AuthChangeDetail>) => {
    if (!event.data) return;
    relayAuthChange(event.data);
  };

  window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange as EventListener);
  window.addEventListener("storage", handleStorage);

  if ("BroadcastChannel" in window) {
    channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
    channel.addEventListener("message", handleMessage);
  }

  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange as EventListener);
    window.removeEventListener("storage", handleStorage);

    if (channel) {
      channel.removeEventListener("message", handleMessage);
      channel.close();
    }
  };
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return normalizeLegacyToken();
}

function decodeTokenPayload(token: string): AuthClaims | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(atob(payload)) as AuthClaims;
  } catch {
    return null;
  }
}

export function getAuthClaimsFromToken(token: string): AuthClaims | null {
  const claims = decodeTokenPayload(token);
  if (!claims) return null;

  if (claims.exp && Date.now() >= claims.exp * 1000) {
    return null;
  }

  return claims;
}

export function getAuthClaims(): AuthClaims | null {
  const token = getStoredToken();
  if (!token) return null;
  return getAuthClaimsFromToken(token);
}

export function setStoredAuthToken(
  token: string,
  reason: AuthChangeReason = "login",
): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  for (const key of LEGACY_AUTH_KEYS) {
    window.localStorage.removeItem(key);
  }

  postAuthChange(createAuthChangeDetail(reason));
}

export function clearStoredAuthToken(
  reason: AuthChangeReason = "logout",
): void {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  for (const key of LEGACY_AUTH_KEYS) {
    window.localStorage.removeItem(key);
  }

  postAuthChange(createAuthChangeDetail(reason));
}

export function getHomePathByRole(role?: string | null): string {
  return role === "seller" ? "/seller/dashboard" : "/buyer/dashboard";
}

export function getDisplayNameFromEmail(email?: string): string {
  if (!email) return "User";
  const namePart = email.split("@")[0] || "User";
  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
}

export function getAuthToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("teablend_token") : null;
}
