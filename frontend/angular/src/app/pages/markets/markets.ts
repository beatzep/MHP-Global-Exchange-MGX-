import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription, timer } from 'rxjs';
import { switchMap, scan } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

@Component({
  standalone: true,
  selector: 'app-markets',
  imports: [CommonModule],
  templateUrl: './markets.html',
  styleUrls: ['./markets.css']
})
export class MarketsComponent implements OnInit, OnDestroy {
  marketData$!: Observable<MarketData[]>;
  private refreshSubscription?: Subscription;
  private apiUrl = 'http://localhost:8080/api/market';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    const REFRESH_INTERVAL = 60000; // 60 seconds
    this.marketData$ = timer(0, REFRESH_INTERVAL).pipe(
      switchMap(() =>
        this.getPricesStream().pipe(
          scan((acc, value) => {
            const existingIndex = acc.findIndex(item => item.symbol === value.symbol);
            if (existingIndex >= 0) {
              acc[existingIndex] = value;
              return [...acc];
            }
            return [...acc, value];
          }, [] as MarketData[])
        )
      )
    );
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  private getPricesStream(): Observable<MarketData> {
    return new Observable((observer) => {
      const eventSource = new EventSource(`${this.apiUrl}/prices`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          observer.next(data);
        } catch (error) {
          console.error('Error parsing market data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        eventSource.close();
        observer.error(error);
      };

      return () => eventSource.close();
    });
  }

  getChangeClass(change: number): string {
    return change >= 0 ? 'positive' : 'negative';
  }

  getChangeIcon(change: number): string {
    return change >= 0 ? '↗' : '↘';
  }

  getCompanyName(symbol: string): string {
    const companies: { [key: string]: string } = {
      'AAPL': 'Apple Inc.',
      'GOOGL': 'Alphabet Inc.',
      'TSLA': 'Tesla Inc.',
      'MSFT': 'Microsoft Corp.',
      'AMZN': 'Amazon.com Inc.',
      'NVDA': 'NVIDIA Corp.'
    };
    return companies[symbol] || symbol;
  }
}
