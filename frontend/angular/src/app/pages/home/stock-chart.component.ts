import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule, Color, ScaleType } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-stock-chart-home',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  template: `
    <div *ngIf="chartData" class="chart-wrapper">
      <ngx-charts-line-chart
        [results]="chartData"
        [scheme]="colorScheme"
        [legend]="false"
        [xAxis]="true"
        [yAxis]="true"
        [showXAxisLabel]="false"
        [showYAxisLabel]="true"
        yAxisLabel="Price (EUR)"
        [autoScale]="true">
      </ngx-charts-line-chart>
    </div>
  `,
  styles: [`
    .chart-wrapper {
      height: 350px;
      width: 100%;
    }
  `]
})
export class StockChartComponent {
  @Input() chartData: any[] = [];
  @Input() colorScheme: Color = { domain: ['#26a69a'], group: ScaleType.Linear, selectable: true, name: 'Stock' };
}