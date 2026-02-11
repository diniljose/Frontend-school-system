import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
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
  readonly userRole = computed(() => this.currentUser()?.role ?? null);
  readonly userName = computed(() => {
    const u = this.currentUser();
    return u ? `${u.firstName} ${u.lastName}` : '';
  });

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const token = localStorage.getItem('accessToken');
      const userStr = localStorage.getItem('user');
      const schoolStr = localStorage.getItem('school');
      if (token && userStr) {
        this.currentUser.set(JSON.parse(userStr));
      }
      if (schoolStr) {
        this.schoolInfo.set(JSON.parse(schoolStr));
      }
    } catch { /* ignore parse errors */ }
  }

  login(credentials: LoginRequest): Observable<any> {
    return this.api.post<AuthResponse>('auth/login', credentials).pipe(
      tap(res => {
        const data = res.data;
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
    return this.api.post('auth/change-password', { currentPassword, newPassword });
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.api.post<AuthResponse>('auth/refresh', { refreshToken }).pipe(
      tap(res => {
        localStorage.setItem('accessToken', res.data.accessToken);
        if (res.data.refreshToken) {
          localStorage.setItem('refreshToken', res.data.refreshToken);
        }
      }),
      catchError(err => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  getProfile(): Observable<any> {
    return this.api.get<User>('auth/profile').pipe(
      tap(res => {
        this.currentUser.set(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      })
    );
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

