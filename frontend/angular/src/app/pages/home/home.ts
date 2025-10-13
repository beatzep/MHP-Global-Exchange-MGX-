import { Component, inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Observable, Subscription, timer, scan, combineLatest } from 'rxjs';
import { switchMap, map, filter } from 'rxjs/operators';
import { MarketData } from './market-data.model';
import { MarketService, ChartData } from './market.service';
import { WatchlistService } from '../../services/watchlist.service';
import { Color, ScaleType } from '@swimlane/ngx-charts';
import { StockChartComponent } from './stock-chart.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, StockChartComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  encapsulation: ViewEncapsulation.None
})
export class HomeComponent implements OnInit, OnDestroy {
  stockPrices$!: Observable<MarketData[]>;
  etfPrices$!: Observable<MarketData[]>;
  bondPrices$!: Observable<MarketData[]>;
  selectedStock: MarketData | null = null;
  chartData: any[] = [];
  chartColorScheme: Color = { domain: ['#26a69a'], group: ScaleType.Linear, selectable: true, name: 'Stock' };
  private refreshSubscription!: Subscription;
  stockSymbols: string[] = [];
  etfSymbols: string[] = [];
  bondSymbols: string[] = [];

  private marketService = inject(MarketService);
  private watchlistService = inject(WatchlistService);

  ngOnInit(): void {
    // Load watchlist first
    this.watchlistService.loadWatchlist().subscribe();

    // Subscribe to watchlist changes
    this.watchlistService.watchlist$.subscribe(watchlist => {
      this.stockSymbols = watchlist.stocks;
      this.etfSymbols = watchlist.etfs;
      this.bondSymbols = watchlist.bonds;
    });

    const REFRESH_INTERVAL = 60000; // 60 Sekunden

    // Create separate price streams for each category
    const allStockPrices$ = timer(0, REFRESH_INTERVAL).pipe(
      switchMap(() =>
        this.marketService.getPricesStreamByCategory('stocks').pipe(
          scan((acc, value) => [...acc, value], [] as MarketData[])
        )
      )
    );

    const allEtfPrices$ = timer(0, REFRESH_INTERVAL).pipe(
      switchMap(() =>
        this.marketService.getPricesStreamByCategory('etfs').pipe(
          scan((acc, value) => [...acc, value], [] as MarketData[])
        )
      )
    );

    const allBondPrices$ = timer(0, REFRESH_INTERVAL).pipe(
      switchMap(() =>
        this.marketService.getPricesStreamByCategory('bonds').pipe(
          scan((acc, value) => [...acc, value], [] as MarketData[])
        )
      )
    );

    // Filter for stocks
    this.stockPrices$ = combineLatest([allStockPrices$, this.watchlistService.watchlist$]).pipe(
      map(([prices, watchlist]) => {
        if (watchlist.stocks.length === 0) return [];
        return prices.filter(price => watchlist.stocks.includes(price.symbol));
      })
    );

    // Filter for ETFs
    this.etfPrices$ = combineLatest([allEtfPrices$, this.watchlistService.watchlist$]).pipe(
      map(([prices, watchlist]) => {
        if (watchlist.etfs.length === 0) return [];
        return prices.filter(price => watchlist.etfs.includes(price.symbol));
      })
    );

    // Filter for Bonds
    this.bondPrices$ = combineLatest([allBondPrices$, this.watchlistService.watchlist$]).pipe(
      map(([prices, watchlist]) => {
        if (watchlist.bonds.length === 0) return [];
        return prices.filter(price => watchlist.bonds.includes(price.symbol));
      })
    );
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  showChart(stock: MarketData): void {
    console.log('showChart called for:', stock);
    this.selectedStock = stock;
    this.chartData = []; // Reset chart data
    this.marketService.getChartData(stock).subscribe({
      next: (data: ChartData) => {
        console.log('Chart data received in component:', data);
        this.chartData = data.chartData;
        this.chartColorScheme = data.colorScheme;
      },
      error: (error) => {
        console.error('Error loading chart data:', error);
      }
    });
  }

  closeChart(): void {
    this.selectedStock = null;
  }

  removeFromWatchlist(symbol: string, event: Event): void {
    event.stopPropagation(); // Prevent triggering showChart
    this.watchlistService.removeFromWatchlist(symbol).subscribe({
      next: (response) => {
        console.log('Removed from watchlist:', response);
      },
      error: (error) => {
        console.error('Error removing from watchlist:', error);
      }
    });
  }

  isInWatchlist(symbol: string): boolean {
    return this.watchlistService.isInWatchlist(symbol);
  }
}
