import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  let authReq = req;
  if (token && !req.url.includes('/auth/login') && !req.url.includes('/auth/register')) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq);
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/')) {
        auth.logout();
        toast.error('Session Expired', 'Please login again');
      } else if (error.status === 403) {
        toast.error('Access Denied', 'You do not have permission to perform this action');
      } else if (error.status === 0) {
        toast.error('Connection Error', 'Unable to connect to the server');
      } else if (error.status >= 500) {
        toast.error('Server Error', error.error?.message || 'Something went wrong');
      } else if (error.status === 400 || error.status === 422) {
        const msg = error.error?.message;
        if (typeof msg === 'string') {
          toast.error('Validation Error', msg);
        } else if (Array.isArray(msg)) {
          toast.error('Validation Error', msg.join(', '));
        }
      }
      return throwError(() => error);
    })
  );
};
