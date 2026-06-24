import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from '../lib/api.config';
import { apiClient } from "@/lib/apiClient";
import {
  clearStoredAuthToken,
  getStoredToken,
  setStoredAuthToken,
  AuthChangeReason,
} from "@/lib/auth";

interface ForgotPasswordResponse {
  status: string;
  message: string;
  email: string;
}

interface VerifyOTPResponse {
  status: string;
  message: string;
  password_reset_id: string;
}

interface ResetPasswordResponse {
  status: string;
  message: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface RegisterResponse {
  message: string;
  user_id: string;
}
 
export interface CurrentUserResponse {
  user_id: string;
  email: string;
  phone_num: string;
  user_name: string;
  first_name: string;
  last_name: string;
  default_role: "buyer" | "seller";
  active_role?: "buyer" | "seller";
  available_roles?: Array<"buyer" | "seller">;
  profile_image_url?: string;
  nic?: string;
  shipping_address?: string;
  payment_method?: string;
  seller_verification_status?: string;
  seller_requested_at?: string;
  seller_approved_at?: string;
  seller_rejection_reason?: string;
  can_become_seller?: boolean;
  seller_profile?: {
    seller_name?: string;
    seller_registration_no?: string;
    seller_started_year?: number;
    seller_website?: string;
    seller_description?: string;
    seller_street_address?: string;
    seller_province?: string;
    seller_city?: string;
    seller_postal_code?: string;
  };
  financial_details?: unknown;
  watch_list?: string[];
  verification_status?: string;
  status?: string;
}

export interface GoogleLoginRequest {
  token: string;
}

export interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

class AuthService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.api.interceptors.request.use((config) => {
      const token = getStoredToken();
      if (token && config.headers) {
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // TOKEN MANAGEMENT
  getToken(): string | null {
    return getStoredToken();
  }

  setToken(token: string, source: AuthChangeReason = 'manual'): void {
    setStoredAuthToken(token, source);
  }

  clearToken(source: AuthChangeReason = 'logout'): void {
    clearStoredAuthToken(source);
  }

  // AUTHENTICATION
  async register(
    email: string,
    password: string,
    userName: string,
    firstName: string,
    lastName: string,
    phoneNum: string,
    defaultRole: "buyer" | "seller" = "buyer",
    shippingAddress?: string,
  ): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>("/auth/register", {
      email,
      password,
      user_name: userName,
      first_name: firstName,
      last_name: lastName,
      phone_num: phoneNum,
      shipping_address: shippingAddress,
      default_role: defaultRole,
    });
    return response.data;
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response = await apiClient.post<LoginResponse>("/auth/login", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (response.data.access_token) {
      setStoredAuthToken(response.data.access_token, "login");
    }

    return response.data;
  }

  async googleLogin(token: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/auth/google", { token });
    if (response.data.access_token) {
      setStoredAuthToken(response.data.access_token, "google");
    }
    return response.data;
  }

  // USER DATA
  async getCurrentUser(): Promise<CurrentUserResponse> {
    const response = await apiClient.get<CurrentUserResponse>("/users/me");
    return response.data;
  }

  async getCurrentAdmin(): Promise<CurrentUserResponse> {
    const response = await apiClient.get<CurrentUserResponse>("/admin/profile/me");
    return response.data;
  }

  async requestPasswordReset(email: string): Promise<ForgotPasswordResponse> {
    const response = await apiClient.post<ForgotPasswordResponse>("/auth/forgot-password", { email });
    return response.data;
  }

  async verifyOTP(email: string, otpCode: string): Promise<VerifyOTPResponse> {
    const response = await apiClient.post<VerifyOTPResponse>("/auth/verify-otp", {
      email,
      otp_code: otpCode,
    });
    return response.data;
  }

  async resetPassword(
    email: string,
    otpCode: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<ResetPasswordResponse> {
    const response = await apiClient.post<ResetPasswordResponse>("/auth/reset-password", {
      email,
      otp_code: otpCode,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return response.data;
  }

  logout(): void {
    clearStoredAuthToken("logout");
  }

  isAuthenticated(): boolean {
    return getStoredToken() !== null;
  }
}

export default new AuthService();