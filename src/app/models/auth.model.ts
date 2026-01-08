/**
 * Authentication-related models for JWT token-based authentication
 */

/**
 * Request payload for user login
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Response from successful login
 */
export interface LoginResponse {
  token: string;
  expiration: string;
  username: string;
  roles: string[];
}

/**
 * Request payload for user registration (Admin only)
 */
export interface RegisterRequest {
  username: string;
  password: string;
  confirmPassword: string;
  isAdmin: boolean;
}

/**
 * Response from successful registration
 */
export interface RegisterResponse {
  message: string;
  username: string;
  role: string;
}

/**
 * Authenticated user information
 */
export interface AuthUser {
  username: string;
  roles: string[];
  token: string;
  expiration: Date;
}

/**
 * User roles in the system
 */
export enum UserRole {
  Admin = 'Admin',
  Contributor = 'Contributor'
}
