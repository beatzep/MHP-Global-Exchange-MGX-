import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';
import { TradingService, Position } from '../../services/trading.service';
import { MarketService } from '../home/market.service';
import { forkJoin, map, switchMap, of } from 'rxjs';

interface PortfolioItem {
  name: string;
  quantity: number;
  currentPrice: number;
  purchasePrice: number;
  currentValue: number;
  totalCost: number;
  profitLoss: number;
  profitLossPercent: number;
  percentage: number;
}

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, RouterModule, NgxChartsModule],
  templateUrl: './portfolio.html',
  styleUrl: './portfolio.css'
})
export class Portfolio implements OnInit {
  portfolioData: PortfolioItem[] = [];
  pieChartData: any[] = [];
  totalValue: number = 0;
  totalCost: number = 0;
  totalProfitLoss: number = 0;
  totalProfitLossPercent: number = 0;
  balance: number = 0;
  loading: boolean = true;

  colorScheme: Color = {
    name: 'portfolio',
    selectable: true,
    group: ScaleType.Ordinal,
    domain: ['#007AFF', '#34C759', '#FF3B30', '#FF9500', '#AF52DE', '#FFD60A', '#00C7BE', '#FF2D55']
  };

  private tradingService = inject(TradingService);
  private marketService = inject(MarketService);

  ngOnInit(): void {
    this.loadPortfolio();
  }

  loadPortfolio(): void {
    this.loading = true;

    // Load user positions from backend
    this.tradingService.getPositions().pipe(
      switchMap(response => {
        this.balance = response.balance;
        const positions = response.positions;

        if (positions.length === 0) {
          this.loading = false;
          return of([]);
        }

        // Group positions by symbol and sum quantities
        const groupedPositions = this.groupPositions(positions);

        // Fetch current prices for all symbols
        return forkJoin(
          groupedPositions.map(position =>
            this.marketService.getHistory(position.symbol).pipe(
              map(data => ({
                ...position,
                currentPrice: data?.c?.[data.c.length - 1] || position.purchasePrice
              }))
            )
          )
        );
      })
    ).subscribe({
      next: (positionsWithPrices: any[]) => {
        this.calculatePortfolio(positionsWithPrices);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading portfolio:', err);
        this.loading = false;
      }
    });
  }

  groupPositions(positions: Position[]): any[] {
    const grouped = new Map<string, any>();

    positions.forEach(pos => {
      if (grouped.has(pos.symbol)) {
        const existing = grouped.get(pos.symbol);
        existing.quantity += pos.quantity;
        existing.totalCost += pos.totalCost;
      } else {
        grouped.set(pos.symbol, {
          symbol: pos.symbol,
          quantity: pos.quantity,
          purchasePrice: pos.purchasePrice,
          totalCost: pos.totalCost
        });
      }
    });

    return Array.from(grouped.values());
  }

  calculatePortfolio(positions: any[]): void {
    // Calculate portfolio metrics
    this.totalCost = positions.reduce((sum, pos) => sum + pos.totalCost, 0);
    this.totalValue = positions.reduce((sum, pos) => sum + (pos.currentPrice * pos.quantity), 0);
    this.totalProfitLoss = this.totalValue - this.totalCost;
    this.totalProfitLossPercent = this.totalCost > 0 ? (this.totalProfitLoss / this.totalCost) * 100 : 0;

    // Create portfolio items with detailed information
    this.portfolioData = positions.map(pos => {
      const currentValue = pos.currentPrice * pos.quantity;
      const profitLoss = currentValue - pos.totalCost;
      const profitLossPercent = pos.totalCost > 0 ? (profitLoss / pos.totalCost) * 100 : 0;

      return {
        name: pos.symbol,
        quantity: pos.quantity,
        currentPrice: pos.currentPrice,
        purchasePrice: pos.purchasePrice,
        currentValue: currentValue,
        totalCost: pos.totalCost,
        profitLoss: profitLoss,
        profitLossPercent: profitLossPercent,
        percentage: this.totalValue > 0 ? (currentValue / this.totalValue) * 100 : 0
      };
    });

    // Prepare data for pie chart (use current value)
    this.pieChartData = this.portfolioData.map(item => ({
      name: item.name,
      value: item.currentValue
    }));
  }

  onSelect(event: any): void {
    console.log('Item clicked', event);
  }
}
