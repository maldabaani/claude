import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthResponse, CurrentUser } from '../models/user.model';

interface LoginPayload {
  email: string;
  password: string;
  tenantId?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY  = 'clinic_token';
  private readonly USER_KEY   = 'clinic_user';
  private readonly BASE        = '/api/v1/auth';

  currentUser = signal<CurrentUser | null>(this.loadUser());

  constructor(private http: HttpClient, private router: Router) {}

  loginTenant(payload: LoginPayload) {
    return this.http.post<AuthResponse>(`${this.BASE}/login`, payload).pipe(
      tap(res => this.storeSession(res))
    );
  }

  loginPlatform(payload: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${this.BASE}/platform/login`, payload).pipe(
      tap(res => this.storeSession(res))
    );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): CurrentUser | null {
    return this.currentUser();
  }

  private storeSession(res: AuthResponse) {
    localStorage.setItem(this.TOKEN_KEY, res.accessToken);
    const payload = this.decodeJwt(res.accessToken);
    const user: CurrentUser = {
      id: payload.sub,
      email: payload.email,
      role: res.role,
      tenantId: res.tenantId,
      userType: payload.type
    };
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  private loadUser(): CurrentUser | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  private decodeJwt(token: string): any {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  }
}
