import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, AuthUser, UserRole } from '../models/auth.model';
import { API_BASE_URL } from '../core/tokens';

/**
 * Authentication service managing user login, logout, and JWT token storage
 * 
 * Uses modern Angular signals for reactive state management
 * SSR-compatible with platform checks for localStorage access
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly baseUrl = inject(API_BASE_URL);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private readonly TOKEN_KEY = 'mtg_auth_token';
  private readonly USER_KEY = 'mtg_auth_user';

  // Observable for authentication state (for RxJS compatibility)
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  // Signals for reactive state management (modern Angular)
  public currentUser = signal<AuthUser | null>(this.getUserFromStorage());
  public isAuthenticated = computed(() => this.currentUser() !== null && this.hasValidToken());

  constructor() {
    // Check token expiration periodically
    this.initializeExpirationCheck();
  }

  /**
   * Authenticate user with username and password
   */
  login(username: string, password: string): Observable<LoginResponse> {
    const request: LoginRequest = { username, password };
    return this.http.post<LoginResponse>(`${this.baseUrl}/auth/login`, request).pipe(
      tap(response => this.handleLoginSuccess(response))
    );
  }

  /**
   * Register a new user (Admin only)
   */
  register(request: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.baseUrl}/auth/register`, request);
  }

  /**
   * Log out the current user and clear stored credentials
   */
  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
    this.currentUserSubject.next(null);
    this.currentUser.set(null);
  }

  /**
   * Get the current JWT token
   */
  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Check if the user has a valid, non-expired token
   */
  hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    const user = this.getUserFromStorage();
    if (!user) return false;

    // Check if token is expired
    const expiration = new Date(user.expiration);
    return expiration > new Date();
  }

  /**
   * Check if the current user has a specific role
   */
  hasRole(role: string): boolean {
    const user = this.currentUser();
    return user?.roles.includes(role) ?? false;
  }

  /**
   * Check if the current user is an admin
   */
  isAdmin(): boolean {
    return this.hasRole(UserRole.Admin);
  }

  /**
   * Check if the current user is a contributor or admin
   */
  isContributor(): boolean {
    return this.hasRole(UserRole.Contributor) || this.isAdmin();
  }

  /**
   * Get the current user information
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUser();
  }

  /**
   * Handle successful login response
   */
  private handleLoginSuccess(response: LoginResponse): void {
    const user: AuthUser = {
      userId: response.userId,
      username: response.username,
      roles: response.roles,
      token: response.token,
      expiration: new Date(response.expiration)
    };

    // Store token and user info (browser only)
    if (this.isBrowser) {
      localStorage.setItem(this.TOKEN_KEY, response.token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    // Update state
    this.currentUserSubject.next(user);
    this.currentUser.set(user);
  }

  /**
   * Retrieve user from localStorage
   */
  private getUserFromStorage(): AuthUser | null {
    if (!this.isBrowser) return null;
    
    const userJson = localStorage.getItem(this.USER_KEY);
    if (!userJson) return null;

    try {
      const user = JSON.parse(userJson);
      user.expiration = new Date(user.expiration);
      return user;
    } catch {
      return null;
    }
  }

  /**
   * Initialize periodic token expiration checks
   */
  private initializeExpirationCheck(): void {
    // Only run in browser environment
    if (!this.isBrowser) return;
    
    // Check token expiration every minute
    setInterval(() => {
      if (!this.hasValidToken() && this.currentUser() !== null) {
        this.logout();
        this.router.navigate(['/login'], {
          queryParams: { reason: 'session-expired' }
        });
      }
    }, 60000); // 60 seconds
  }
}
