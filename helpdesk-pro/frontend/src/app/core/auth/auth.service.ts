import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, AuthResponse, Role } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'hd_access_token';
  private readonly REFRESH_KEY = 'hd_refresh_token';

  private _currentUser = signal<AuthResponse | null>(this.loadFromStorage());
  currentUser = this._currentUser.asReadonly();
  isLoggedIn = computed(() => !!this._currentUser());
  userRole = computed(() => this._currentUser()?.role);

  constructor(private http: HttpClient, private router: Router) {}

  register(fullName: string, email: string, password: string) {
    return this.http.post<ApiResponse<AuthResponse>>(
      `${environment.apiUrl}/auth/register`, { fullName, email, password }
    ).pipe(tap(res => this.setSession(res.data)));
  }

  login(email: string, password: string) {
    return this.http.post<ApiResponse<AuthResponse>>(
      `${environment.apiUrl}/auth/login`, { email, password }
    ).pipe(tap(res => this.setSession(res.data)));
  }

  logout() {
    this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe();
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  refreshToken() {
    const refreshToken = localStorage.getItem(this.REFRESH_KEY);
    return this.http.post<ApiResponse<AuthResponse>>(
      `${environment.apiUrl}/auth/refresh`, { refreshToken }
    ).pipe(tap(res => this.setSession(res.data)));
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  hasRole(...roles: Role[]): boolean {
    const role = this.userRole();
    return !!role && roles.includes(role);
  }

  private setSession(auth: AuthResponse) {
    localStorage.setItem(this.TOKEN_KEY, auth.accessToken);
    localStorage.setItem(this.REFRESH_KEY, auth.refreshToken);
    this._currentUser.set(auth);
  }

  private loadFromStorage(): AuthResponse | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp * 1000 < Date.now()) return null;
      return {
        accessToken: token,
        refreshToken: localStorage.getItem(this.REFRESH_KEY) ?? '',
        userId: payload.sub,
        fullName: '',
        email: payload.sub,
        role: 'CUSTOMER',
      };
    } catch {
      return null;
    }
  }

  redirectAfterLogin() {
    const role = this.userRole();
    if (role === 'ADMIN') this.router.navigate(['/admin']);
    else if (role === 'AGENT' || role === 'TEAM_LEAD') this.router.navigate(['/agent']);
    else this.router.navigate(['/customer']);
  }
}
