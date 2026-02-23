import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, of, switchMap } from 'rxjs';
import { ApiService } from './api.service';
import { User, AuthResponse, LoginRequest, RegisterRequest, RegisterSchoolRequest, SchoolInfo, UserRole } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  private currentUser = signal<User | null>(null);
  private schoolInfo = signal<SchoolInfo | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly school = this.schoolInfo.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly userRole = computed(() => {
    const user = this.currentUser();
    return user?.role ?? null;
  });
  readonly userName = computed(() => {
    const u = this.currentUser();
    return u ? `${u.firstName} ${u.lastName}` : '';
  });
  
  // Expose user permissions for dynamic menu
  readonly userPermissions = computed(() => {
    const user = this.currentUser();
    return user?.permissions || [];
  });

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Check if user has a specific permission
   * Supports wildcards: '*' means all permissions
   */
  hasPermission(permission: string): boolean {
    const permissions = this.userPermissions();
    const role = this.userRole();
    
    // Platform admin, Principal and Vice Principal have all permissions for their scope
    if (role === UserRole.PLATFORM_ADMIN || role === UserRole.PRINCIPAL || role === UserRole.VICE_PRINCIPAL || permissions.includes('*')) {
      return true;
    }
    
    // Check exact match
    if (permissions.includes(permission)) {
      return true;
    }
    
    // Check if user has any permission for this module (e.g., 'student:view' for 'student:*')
    const [module] = permission.split(':');
    return permissions.some(p => p.startsWith(`${module}:`));
  }

  /**
   * Check if user can view a menu item based on its permission config
   */
  canViewMenuItem(permission: string): boolean {
    // '*' = visible to all authenticated users
    if (permission === '*') {
      return this.isAuthenticated();
    }
    
    // 'admin' = platform admin only
    if (permission === 'admin') {
      return this.userRole() === UserRole.PLATFORM_ADMIN;
    }
    
    // Check specific permission
    return this.hasPermission(permission);
  }

  private loadFromStorage(): void {
    try {
      const token = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');
      const schoolStr = localStorage.getItem('school');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        console.log('AUTH: Loaded user from storage, role=' + user?.role + ', permissions=' + (user?.permissions?.length || 0));
        this.currentUser.set(user);
      }
      if (schoolStr) {
        this.schoolInfo.set(JSON.parse(schoolStr));
      }
    } catch { /* ignore parse errors */ }
  }

  /**
   * Login and fetch fresh user profile with latest permissions from database
   */
  login(credentials: LoginRequest): Observable<any> {
    return this.api.post<AuthResponse>('auth/login', credentials).pipe(
      tap(res => {
        const data = res.data;
        console.log('AUTH: Login success, role=' + data.user?.role + ', permissions=' + (data.user?.permissions?.length || 0));
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        this.currentUser.set(data.user);
        const school = data.school || data.user?.school;
        if (school && typeof school === 'object') {
          localStorage.setItem('school', JSON.stringify(school));
          this.schoolInfo.set(school as SchoolInfo);
        }
      })
    );
  }

  register(data: RegisterRequest): Observable<any> {
    return this.api.post('auth/register', data);
  }

  /**
   * Self-service school registration.
   * Creates school + admin user and auto-logs in.
   */
  registerSchool(data: RegisterSchoolRequest): Observable<any> {
    return this.api.post<AuthResponse>('auth/register-school', data).pipe(
      tap(res => {
        const d = res.data;
        if (d.accessToken) {
          localStorage.setItem('accessToken', d.accessToken);
          localStorage.setItem('refreshToken', d.refreshToken);
          localStorage.setItem('user', JSON.stringify(d.user));
          this.currentUser.set(d.user);
          if (d.school) {
            localStorage.setItem('school', JSON.stringify(d.school));
            this.schoolInfo.set(d.school);
          }
        }
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.api.post('auth/forgot-password', { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.api.post('auth/reset-password', { token, newPassword });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.api.post('auth/change-password', { oldPassword: currentPassword, newPassword });
  }

  /**
   * Refresh token and update user data with latest permissions
   */
  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.api.post<AuthResponse>('auth/refresh', { refreshToken }).pipe(
      tap(res => {
        localStorage.setItem('accessToken', res.data.accessToken);
        if (res.data.refreshToken) {
          localStorage.setItem('refreshToken', res.data.refreshToken);
        }
        // Update user data with fresh permissions from token refresh
        if (res.data.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
          this.currentUser.set(res.data.user);
          console.log('AUTH: Token refreshed, permissions updated=' + (res.data.user.permissions?.length || 0));
        }
      }),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  /**
   * Fetch fresh user profile with latest permissions from database
   * Call this after role/permission changes to sync frontend state
   */
  getProfile(): Observable<any> {
    return this.api.get<User>('auth/profile').pipe(
      tap(res => {
        console.log('AUTH: Profile fetched, permissions=' + (res.data?.permissions?.length || 0));
        this.currentUser.set(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      })
    );
  }

  /**
   * Refresh user profile to get latest permissions
   * Useful when role has been updated
   */
  refreshProfile(): void {
    this.getProfile().subscribe({
      next: () => console.log('AUTH: Profile refreshed successfully'),
      error: (err) => console.error('AUTH: Failed to refresh profile', err)
    });
  }

  logout(): void {
    this.api.post('auth/logout').subscribe({ error: () => {} });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('school');
    this.currentUser.set(null);
    this.schoolInfo.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  hasRole(...roles: UserRole[]): boolean {
    const current = this.currentUser()?.role;
    return current ? roles.includes(current) : false;
  }

  hasAnyAdminRole(): boolean {
    return this.hasRole(UserRole.PLATFORM_ADMIN, UserRole.PRINCIPAL, UserRole.PRINCIPAL);
  }
}

