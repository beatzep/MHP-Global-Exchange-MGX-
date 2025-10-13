import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface CategorizedWatchlist {
  stocks: string[];
  etfs: string[];
  bonds: string[];
}

@Injectable({
  providedIn: 'root'
})
export class WatchlistService {
  private apiUrl = 'http://localhost:8080/api/watchlist';
  private watchlistSubject = new BehaviorSubject<CategorizedWatchlist>({
    stocks: [],
    etfs: [],
    bonds: []
  });
  public watchlist$ = this.watchlistSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': token || ''
    });
  }

  loadWatchlist(): Observable<any> {
    return this.http.get<any>(this.apiUrl, { headers: this.getHeaders() })
      .pipe(
        tap(response => {
          if (response.success) {
            this.watchlistSubject.next(response.watchlist);
          }
        })
      );
  }

  addToWatchlist(symbol: string, category: string = 'stocks'): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/add`, { symbol, category }, { headers: this.getHeaders() })
      .pipe(
        tap(response => {
          if (response.success) {
            this.watchlistSubject.next(response.watchlist);
          }
        })
      );
  }

  removeFromWatchlist(symbol: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/remove`, { symbol }, { headers: this.getHeaders() })
      .pipe(
        tap(response => {
          if (response.success) {
            this.watchlistSubject.next(response.watchlist);
          }
        })
      );
  }

  isInWatchlist(symbol: string): boolean {
    const watchlist = this.watchlistSubject.value;
    return watchlist.stocks.includes(symbol) ||
           watchlist.etfs.includes(symbol) ||
           watchlist.bonds.includes(symbol);
  }

  getWatchlistSymbols(): string[] {
    const watchlist = this.watchlistSubject.value;
    return [...watchlist.stocks, ...watchlist.etfs, ...watchlist.bonds];
  }

  getCategorizedWatchlist(): CategorizedWatchlist {
    return this.watchlistSubject.value;
  }
}
