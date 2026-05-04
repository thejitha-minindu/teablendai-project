export type UserRole = "buyer" | "seller" | "admin";
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
  first_name?: string;
  last_name?: string;
};

export const AUTH_CHANGED_EVENT = "teablend-auth-changed";

const TOKEN_KEY = "teablend_token"; // SINGLE SOURCE OF TRUTH

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
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

  localStorage.setItem(TOKEN_KEY, token);   // FIXED
  localStorage.setItem("access_token", token); // optional backward compatibility

  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function clearStoredAuthToken(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("access_token");

  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function getAuthToken(): string | null {
  return getStoredToken(); // FIXED
}

export function getHomePathByRole(role?: string | null): string {
  if (role === "admin") return "/admin/dashboard";
  return role === "seller" ? "/seller/dashboard" : "/buyer/dashboard";
}

export function getDisplayNameFromEmail(email?: string): string {
  if (!email) return "User";
  const namePart = email.split("@")[0] || "User";
  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
}