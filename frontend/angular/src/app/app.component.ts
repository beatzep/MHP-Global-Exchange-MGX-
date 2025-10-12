import { Component, OnInit, inject, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MarketService } from './market.service';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable, Subscription, timer, scan } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { MarketData } from './market-data.model';
import { StockChartComponent } from './stock-chart.component';
import { Color, ScaleType } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, StockChartComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'MHP Exchange';
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
    this.selectedStock = stock;
    this.marketService.getHistory(stock.symbol).pipe(
      map(apiResponse => {
        if (!apiResponse || !apiResponse.c || apiResponse.s !== 'ok') {
          return []; // Leere Daten bei Fehler
        }
        // Daten in das von ngx-charts erwartete Format umwandeln
        const series = apiResponse.t.map((time: number, index: number) => ({
          name: new Date(time * 1000),
          value: apiResponse.c[index]
        }));

        // Chart-Farbe basierend auf dem Trend setzen
        const firstPrice = series.length > 0 ? series[0].value : 0;
        const lastPrice = series.length > 0 ? series[series.length - 1].value : 0;
        this.chartColorScheme = { ...this.chartColorScheme, domain: [lastPrice >= firstPrice ? '#26a69a' : '#ef5350'] };

        return [{ name: stock.symbol, series }];
      })
    ).subscribe(formattedData => {
      this.chartData = formattedData;
    });
  }

  closeChart(): void {
    this.selectedStock = null;
  }
}
