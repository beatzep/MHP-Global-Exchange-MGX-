import { Component, inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription, timer, scan } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MarketData } from './market-data.model';
import { MarketService, ChartData } from './market.service';
import { Color, ScaleType } from '@swimlane/ngx-charts';
import { StockChartComponent } from './stock-chart.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, StockChartComponent],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  encapsulation: ViewEncapsulation.None
})
export class HomeComponent implements OnInit, OnDestroy {
  prices$!: Observable<MarketData[]>;
  selectedStock: MarketData | null = null;
  chartData: any[] = [];
  chartColorScheme: Color = { domain: ['#26a69a'], group: ScaleType.Linear, selectable: true, name: 'Stock' };
  private refreshSubscription!: Subscription;

  private marketService = inject(MarketService);

  ngOnInit(): void {
    const REFRESH_INTERVAL = 60000; // 60 Sekunden
    this.prices$ = timer(0, REFRESH_INTERVAL).pipe(
      switchMap(() =>
        this.marketService.getPricesStream().pipe(
          scan((acc, value) => [...acc, value], [] as MarketData[])
        )
      )
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
}
