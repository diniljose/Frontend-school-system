import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginatedResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  private buildUrl(path: string): string {
    const base = this.baseUrl.replace(/\/+$/, '');
    const cleanPath = String(path || '').replace(/^\/+/, '');
    return `${base}/${cleanPath}`;
  }

  private normalizeResponse(res: any): any {
    if (!res) return res;
    const payload = res?.data;
    if (payload?.items) return res;

    const items = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : null;

    if (!items) return res;

    // Backend may put pagination in .pagination, .meta, or as direct properties
    const pagination = payload?.pagination || payload?.meta || {};
    const page = Number(pagination.page ?? payload?.page ?? 1);
    const totalPages = Number(pagination.pages ?? pagination.totalPages ?? payload?.totalPages ?? 1);
    const limit = Number(pagination.limit ?? payload?.limit ?? items.length);
    const total = Number(pagination.total ?? payload?.total ?? items.length);

    return {
      ...res,
      data: {
        items,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  get<T>(path: string, params?: Record<string, any>): Observable<ApiResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http.get<ApiResponse<T>>(this.buildUrl(path), { params: httpParams })
      .pipe(map((res) => this.normalizeResponse(res)));
  }

  getPaginated<T>(path: string, params?: Record<string, any>): Observable<PaginatedResponse<T>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http.get<PaginatedResponse<T>>(this.buildUrl(path), { params: httpParams })
      .pipe(map((res) => this.normalizeResponse(res)));
  }

  post<T>(path: string, body: any = {}): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(this.buildUrl(path), body)
      .pipe(map((res) => this.normalizeResponse(res)));
  }

  put<T>(path: string, body: any = {}): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(this.buildUrl(path), body)
      .pipe(map((res) => this.normalizeResponse(res)));
  }

  patch<T>(path: string, body: any = {}): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(this.buildUrl(path), body)
      .pipe(map((res) => this.normalizeResponse(res)));
  }

  delete<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(this.buildUrl(path))
      .pipe(map((res) => this.normalizeResponse(res)));
  }
}
