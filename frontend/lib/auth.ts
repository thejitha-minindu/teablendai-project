export type UserRole = "buyer" | "seller";
export type AppRole = UserRole | "analytics";

type AuthClaims = {
  sub?: string;
  id?: string;
  role?: UserRole;
  roles?: string[];
  exp?: number;
};

export const AUTH_CHANGED_EVENT = "teablend-auth-changed";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("teablend_token");
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

export function setStoredAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("teablend_token", token);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function clearStoredAuthToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("teablend_token");
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
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
