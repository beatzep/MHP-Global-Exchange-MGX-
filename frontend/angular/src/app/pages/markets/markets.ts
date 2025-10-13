import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription, timer } from 'rxjs';
import { switchMap, scan } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { MarketService, ChartData } from '../home/market.service';
import { WatchlistService } from '../../services/watchlist.service';
import { TradingService } from '../../services/trading.service';
import { StockChartComponent } from '../home/stock-chart.component';
import { Color, ScaleType } from '@swimlane/ngx-charts';

interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

@Component({
  standalone: true,
  selector: 'app-markets',
  imports: [CommonModule, FormsModule, StockChartComponent],
  templateUrl: './markets.html',
  styleUrls: ['./markets.css']
})
export class MarketsComponent implements OnInit, OnDestroy {
  marketData$!: Observable<MarketData[]>;
  selectedStock: MarketData | null = null;
  chartData: any[] = [];
  chartColorScheme: Color = { domain: ['#26a69a'], group: ScaleType.Linear, selectable: true, name: 'Stock' };
  selectedCategory: 'stocks' | 'etfs' | 'bonds' = 'stocks';
  private refreshSubscription?: Subscription;
  private apiUrl = 'http://localhost:8080/api/market';
  private marketService = inject(MarketService);
  private watchlistService = inject(WatchlistService);
  private tradingService = inject(TradingService);

  // Buy modal state
  showBuyModal: boolean = false;
  selectedAssetForBuy: MarketData | null = null;
  buyQuantity: number = 1;
  balance$ = this.tradingService.balance$;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Load watchlist
    this.watchlistService.loadWatchlist().subscribe();
    this.loadMarketData();
  }

  loadMarketData(): void {
    const REFRESH_INTERVAL = 60000; // 60 seconds
    this.marketData$ = timer(0, REFRESH_INTERVAL).pipe(
      switchMap(() =>
        this.getPricesStream(this.selectedCategory).pipe(
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

  selectCategory(category: 'stocks' | 'etfs' | 'bonds'): void {
    this.selectedCategory = category;
    this.loadMarketData();
  }

  ngOnDestroy(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  private getPricesStream(category: string): Observable<MarketData> {
    return new Observable((observer) => {
      const eventSource = new EventSource(`${this.apiUrl}/prices/${category}`);

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
    const names: { [key: string]: string } = {
      // Stocks
      'AAPL': 'Apple Inc.',
      'GOOGL': 'Alphabet Inc.',
      'TSLA': 'Tesla Inc.',
      'MSFT': 'Microsoft Corp.',
      'AMZN': 'Amazon.com Inc.',
      'NVDA': 'NVIDIA Corp.',
      'META': 'Meta Platforms Inc.',
      'NFLX': 'Netflix Inc.',
      'AMD': 'Advanced Micro Devices',
      'INTC': 'Intel Corporation',
      'BABA': 'Alibaba Group',
      'ORCL': 'Oracle Corporation',
      'IBM': 'IBM Corporation',
      'CSCO': 'Cisco Systems Inc.',
      'CRM': 'Salesforce Inc.',
      'PYPL': 'PayPal Holdings Inc.',
      'UBER': 'Uber Technologies Inc.',
      'SNAP': 'Snap Inc.',
      'COIN': 'Coinbase Global Inc.',
      'SQ': 'Block Inc.',
      // ETFs
      'SPY': 'SPDR S&P 500 ETF',
      'QQQ': 'Invesco QQQ Trust',
      'VTI': 'Vanguard Total Stock Market ETF',
      'IWM': 'iShares Russell 2000 ETF',
      'EFA': 'iShares MSCI EAFE ETF',
      'VWO': 'Vanguard FTSE Emerging Markets ETF',
      'AGG': 'iShares Core U.S. Aggregate Bond ETF',
      'GLD': 'SPDR Gold Shares',
      // Bonds
      'TLT': 'iShares 20+ Year Treasury Bond ETF',
      'IEF': 'iShares 7-10 Year Treasury Bond ETF',
      'SHY': 'iShares 1-3 Year Treasury Bond ETF',
      'LQD': 'iShares iBoxx Investment Grade Corporate Bond ETF',
      'HYG': 'iShares iBoxx High Yield Corporate Bond ETF',
      'MUB': 'iShares National Muni Bond ETF',
      'TIP': 'iShares TIPS Bond ETF',
      'BND': 'Vanguard Total Bond Market ETF'
    };
    return names[symbol] || symbol;
  }

  showChart(stock: MarketData): void {
    console.log('showChart called for:', stock);
    this.selectedStock = stock;
    this.chartData = [];
    this.marketService.getChartData(stock).subscribe({
      next: (data: ChartData) => {
        console.log('Chart data received:', data);
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

  toggleWatchlist(symbol: string, event: Event): void {
    event.stopPropagation(); // Prevent triggering showChart

    if (this.watchlistService.isInWatchlist(symbol)) {
      this.watchlistService.removeFromWatchlist(symbol).subscribe({
        next: (response) => {
          console.log('Removed from watchlist:', response);
        },
        error: (error) => {
          console.error('Error removing from watchlist:', error);
        }
      });
    } else {
      // Add with current category
      this.watchlistService.addToWatchlist(symbol, this.selectedCategory).subscribe({
        next: (response) => {
          console.log('Added to watchlist:', response);
        },
        error: (error) => {
          console.error('Error adding to watchlist:', error);
        }
      });
    }
  }

  isInWatchlist(symbol: string): boolean {
    return this.watchlistService.isInWatchlist(symbol);
  }

  openBuyModal(asset: MarketData, event: Event): void {
    event.stopPropagation();
    this.selectedAssetForBuy = asset;
    this.buyQuantity = 1;
    this.showBuyModal = true;
  }

  closeBuyModal(): void {
    this.showBuyModal = false;
    this.selectedAssetForBuy = null;
    this.buyQuantity = 1;
  }

  calculateFees(): number {
    if (!this.selectedAssetForBuy) return 0;
    return this.tradingService.calculateFees(
      this.selectedCategory,
      this.selectedAssetForBuy.price,
      this.buyQuantity
    );
  }

  calculateTotalCost(): number {
    if (!this.selectedAssetForBuy) return 0;
    return this.tradingService.calculateTotalCost(
      this.selectedCategory,
      this.selectedAssetForBuy.price,
      this.buyQuantity
    );
  }

  confirmPurchase(): void {
    if (!this.selectedAssetForBuy) return;

    const buyRequest = {
      symbol: this.selectedAssetForBuy.symbol,
      category: this.selectedCategory,
      quantity: this.buyQuantity,
      price: this.selectedAssetForBuy.price
    };

    this.tradingService.buyAsset(buyRequest).subscribe({
      next: (response) => {
        console.log('Purchase successful:', response);
        alert(`Erfolgreich gekauft: ${response.quantity}x ${response.symbol}\nGesamtkosten: ${response.totalCost.toFixed(2)}€\nVerbleibend: ${response.remainingBalance.toFixed(2)}€`);
        this.closeBuyModal();
      },
      error: (error) => {
        console.error('Purchase failed:', error);
        const errorMsg = error.error?.error || 'Kauf fehlgeschlagen';
        alert(`Fehler: ${errorMsg}`);
      }
    });
  }
}
