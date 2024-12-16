export interface UserResponse {
  uid: string;
  email: string;
  username: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  user: UserResponse;
}

export interface VerifyResponse {
  verified: boolean;
  user: UserResponse;
}
