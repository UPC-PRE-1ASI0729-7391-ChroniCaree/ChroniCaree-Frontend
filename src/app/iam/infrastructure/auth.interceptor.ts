import { inject } from '@angular/core';
import {
  HttpRequest,
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpEvent
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../application/auth.service';

// Helper state for token refreshing
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  
  // Skip auth for auth endpoints to avoid circular dependencies
  if (req.url.includes('/authentication/sign-in') || 
      req.url.includes('/authentication/sign-up') ||
      req.url.includes('/authentication/refresh')) {
    return next(req);
  }

  const accessToken = authService.getAccessToken();
  let authReq = req;

  if (accessToken) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Handle 401 Unauthorized
        return handle401Error(authReq, next, authService);
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(request: HttpRequest<any>, next: HttpHandlerFn, authService: AuthService): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((token: any) => {
        isRefreshing = false;
        refreshTokenSubject.next(token.accessToken);
        return next(request.clone({
          setHeaders: {
            Authorization: `Bearer ${token.accessToken}`
          }
        }));
      }),
      catchError((err) => {
        isRefreshing = false;
        authService.logout();
        return throwError(() => err);
      })
    );
  } else {
    return refreshTokenSubject.pipe(
      filter(token => token != null),
      take(1),
      switchMap(jwt => {
        return next(request.clone({
          setHeaders: {
            Authorization: `Bearer ${jwt}`
          }
        }));
      })
    );
  }
}
