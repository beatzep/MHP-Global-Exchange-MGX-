import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Observer } from 'rxjs';
import { MarketData } from './market-data.model';

@Injectable({
  providedIn: 'root'
})
export class MarketService {

  private apiUrl = 'http://localhost:8080/api/market';

  constructor(private http: HttpClient) { }

  getMarketMessage(): Observable<string> {
    return this.http.get(`${this.apiUrl}`, { responseType: 'text' });
  }

  getPricesStream(): Observable<MarketData> {
    return new Observable((observer: Observer<MarketData>) => {
      const eventSource = new EventSource(`${this.apiUrl}/prices`);

      eventSource.onmessage = (event) => {
        const newPrice = JSON.parse(event.data);
        observer.next(newPrice);
      };

      eventSource.onerror = (error) => observer.error(error);

      return () => eventSource.close();
    });
  }

  getHistory(symbol: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/candles/${symbol}`);
  }
}
