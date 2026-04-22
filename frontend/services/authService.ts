import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

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
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
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
    defaultRole: 'buyer' | 'seller' = 'buyer'
  ): Promise<RegisterResponse> {
    const response = await this.api.post<RegisterResponse>('/auth/register', {
      email,
      password,
      user_name: userName,
      first_name: firstName,
      last_name: lastName,
      phone_num: phoneNum,
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
