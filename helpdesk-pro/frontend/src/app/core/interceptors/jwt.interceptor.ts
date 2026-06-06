import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError, BehaviorSubject, Observable } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken();

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('/auth/')) {
        return handle401(req, next, auth);
      }
      return throwError(() => err);
    })
  );
};

function handle401(req: any, next: any, auth: AuthService): Observable<any> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshSubject.next(null);
    return auth.refreshToken().pipe(
      switchMap(res => {
        isRefreshing = false;
        refreshSubject.next(res.data.accessToken);
        return next(req.clone({ setHeaders: { Authorization: `Bearer ${res.data.accessToken}` } }));
      }),
      catchError(err => {
        isRefreshing = false;
        auth.logout();
        return throwError(() => err);
      })
    );
  }
  return refreshSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap(token => next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })))
  );
}
