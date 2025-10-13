import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

interface LoginResponse {
  success: boolean;
  token?: string;
  email?: string;
  name?: string;
  message?: string;
}

interface User {
  email: string;
  name: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Clear any existing session on app initialization
    this.clearSession();
  }

  private clearSession(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        if (response.success && response.token) {
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('userEmail', response.email || '');
          localStorage.setItem('userName', response.name || '');
          this.currentUserSubject.next({
            token: response.token,
            email: response.email || '',
            name: response.name || ''
          });
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  register(name: string, email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/register`, {
      name,
      email,
      password
    }).pipe(
      tap(response => {
        if (response.success && response.token) {
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('userEmail', response.email || '');
          localStorage.setItem('userName', response.name || '');
          this.currentUserSubject.next({
            token: response.token,
            email: response.email || '',
            name: response.name || ''
          });
        }
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    const token = this.getAuthToken();
    return this.http.post(`${this.apiUrl}/change-password`, {
      currentPassword,
      newPassword
    }, {
      headers: { 'Authorization': token || '' }
    });
  }

  updateProfile(name: string, email: string): Observable<any> {
    const token = this.getAuthToken();
    return this.http.post(`${this.apiUrl}/update-profile`, {
      name,
      email
    }, {
      headers: { 'Authorization': token || '' }
    }).pipe(
      tap((response: any) => {
        if (response.success && response.user) {
          localStorage.setItem('userEmail', response.user.email);
          localStorage.setItem('userName', response.user.name);
          const currentToken = this.getAuthToken();
          if (currentToken) {
            this.currentUserSubject.next({
              token: currentToken,
              email: response.user.email,
              name: response.user.name
            });
          }
        }
      })
    );
  }
}
