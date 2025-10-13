import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, Observer } from 'rxjs';
import { MarketData } from './market-data.model';
import { Color, ScaleType } from '@swimlane/ngx-charts';

export interface ChartData {
  chartData: any[];
  colorScheme: Color;
}

const DEFAULT_CHART_COLOR_SCHEME: Color = { domain: ['#26a69a'], group: ScaleType.Linear, selectable: true, name: 'Stock' };

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
    return this.getPricesStreamByCategory('stocks');
  }

  getPricesStreamByCategory(category: string): Observable<MarketData> {
    return new Observable((observer: Observer<MarketData>) => {
      const eventSource = new EventSource(`${this.apiUrl}/prices/${category}`);

      eventSource.onmessage = (event) => {
        const newPrice = JSON.parse(event.data);
        observer.next(newPrice);
      };

      eventSource.onerror = (error) => observer.error(error);

      return () => eventSource.close();
    });
  }

  getHistory(symbol: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/candles/${symbol}`);
  }

  getChartData(stock: MarketData): Observable<ChartData> {
    return this.getHistory(stock.symbol).pipe(
      map(apiResponse => {
        console.log('API Response for', stock.symbol, apiResponse);

        if (!apiResponse || !apiResponse.c || !apiResponse.t || apiResponse.s !== 'ok') {
          console.warn('Invalid chart data received:', apiResponse);
          return { chartData: [], colorScheme: DEFAULT_CHART_COLOR_SCHEME };
        }

        const series = apiResponse.t.map((time: number, index: number) => ({
          name: new Date(time * 1000),
          value: apiResponse.c[index]
        }));

        const firstPrice = series.length > 0 ? series[0].value : 0;
        const lastPrice = series.length > 0 ? series[series.length - 1].value : 0;
        const colorScheme = {
          ...DEFAULT_CHART_COLOR_SCHEME,
          domain: [lastPrice >= firstPrice ? '#26a69a' : '#ef5350']
        };
        const chartData = [{ name: stock.symbol, series }];

        console.log('Chart data prepared:', { chartData, colorScheme });
        return { chartData, colorScheme };
      })
    );
  }
}
