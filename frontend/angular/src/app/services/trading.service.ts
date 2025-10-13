import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface BuyRequest {
  symbol: string;
  category: string;
  quantity: number;
  price: number;
}

export interface Position {
  id: number;
  userId: number;
  symbol: string;
  category: string;
  quantity: number;
  purchasePrice: number;
  totalCost: number;
  fees: number;
  purchaseDate: string;
}

export interface PositionsResponse {
  positions: Position[];
  balance: number;
}

export interface BuyResponse {
  success: boolean;
  symbol: string;
  quantity: number;
  price: number;
  fees: number;
  totalCost: number;
  remainingBalance: number;
}

@Injectable({
  providedIn: 'root'
})
export class TradingService {
  private apiUrl = 'http://localhost:8080/api/trading';
  private balanceSubject = new BehaviorSubject<number>(10000);
  public balance$ = this.balanceSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadBalance();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token || ''
    });
  }

  buyAsset(request: BuyRequest): Observable<BuyResponse> {
    return this.http.post<BuyResponse>(`${this.apiUrl}/buy`, request, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (response.success) {
          this.balanceSubject.next(response.remainingBalance);
        }
      })
    );
  }

  getPositions(): Observable<PositionsResponse> {
    return this.http.get<PositionsResponse>(`${this.apiUrl}/positions`, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        this.balanceSubject.next(response.balance);
      })
    );
  }

  loadBalance(): void {
    this.http.get<{ balance: number }>(`${this.apiUrl}/balance`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (response) => {
        this.balanceSubject.next(response.balance);
      },
      error: (err) => {
        console.error('Error loading balance:', err);
      }
    });
  }

  calculateFees(category: string, price: number, quantity: number): number {
    if (category === 'bonds') {
      return 2.0 + (price * quantity * 0.005);
    }
    return 2.0;
  }

  calculateTotalCost(category: string, price: number, quantity: number): number {
    const assetCost = price * quantity;
    const fees = this.calculateFees(category, price, quantity);
    return assetCost + fees;
  }
}
