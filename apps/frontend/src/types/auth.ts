export interface User {
  id: string;
  loginId: string;
  email: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface PasswordResetVerifyResponse {
  resetToken: string;
}
