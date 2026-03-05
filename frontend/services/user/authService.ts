import { apiClient } from "@/lib/apiClient";

export type LoginRequest = {
  email: string;
  password: string;
};

export type SignupRequest = {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  user_name: string;
  role: "seller" | "buyer";
};

export async function login({ email, password }: LoginRequest) {
  const { data } = await apiClient.post("/auth/login", {
    username: email,
    password,
  });
  return data;
}

export async function registerUser(payload: SignupRequest) {
  const { data } = await apiClient.post("/auth/register", payload);
  return data;
}
