import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

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
  default_role: 'buyer' | 'seller';
  active_role?: 'buyer' | 'seller';
  available_roles?: Array<'buyer' | 'seller'>;
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
  financial_details?: any;
  watch_list?: string[];
  verification_status?: string;
  // For API that might return status field
  status?: string;
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

    // Add token to requests if available
    this.api.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // ==================== TOKEN MANAGEMENT ====================

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('teablend_token');
    }
    return null;
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('teablend_token', token);
    }
  }

  clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('teablend_token');
    }
  }

  // ==================== AUTHENTICATION ====================

  async register(
    email: string,
    password: string,
    userName: string,
    firstName: string,
    lastName: string,
    phoneNum: string,
    defaultRole: 'buyer' | 'seller' = 'buyer',
    shippingAddress?: string
  ): Promise<RegisterResponse> {
    const response = await this.api.post<RegisterResponse>('/auth/register', {
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
    formData.append('username', email);
    formData.append('password', password);

    const response = await this.api.post<LoginResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (response.data.access_token) {
      this.setToken(response.data.access_token);
    }

    return response.data;
  }

  // ==================== USER DATA ====================

  async getCurrentUser(): Promise<CurrentUserResponse> {
    const response = await this.api.get<CurrentUserResponse>('/users/me');
    return response.data;
  }

  // ==================== PASSWORD RESET ====================

  async requestPasswordReset(email: string): Promise<ForgotPasswordResponse> {
    const response = await this.api.post<ForgotPasswordResponse>('/auth/forgot-password', {
      email,
    });
    return response.data;
  }

  async verifyOTP(email: string, otpCode: string): Promise<VerifyOTPResponse> {
    const response = await this.api.post<VerifyOTPResponse>('/auth/verify-otp', {
      email,
      otp_code: otpCode,
    });
    return response.data;
  }

  async resetPassword(
    email: string,
    otpCode: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<ResetPasswordResponse> {
    const response = await this.api.post<ResetPasswordResponse>('/auth/reset-password', {
      email,
      otp_code: otpCode,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return response.data;
  }

  // ==================== LOGOUT ====================

  logout(): void {
    this.clearToken();
  }

  // ==================== UTILITY ====================

  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }
}

export default new AuthService();
