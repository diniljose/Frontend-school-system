import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-fee-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, BaseChartDirective],
  template: `
    <div class="page-header">
      <div><h1>💰 Fee Analytics</h1><p>Financial overview and collection trends</p></div>
      <a routerLink="/fees" class="btn btn-secondary">← Back</a>
    </div>

    <div class="grid grid-4">
      <div class="stat-card"><div class="stat-icon" style="background:rgba(34,197,94,0.12);color:#22c55e">📈</div><div class="stat-label">Total Revenue</div><div class="stat-value">$285,000</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(99,102,241,0.12);color:#6366f1">🎯</div><div class="stat-label">Target</div><div class="stat-value">$325,000</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(245,158,11,0.12);color:#f59e0b">📊</div><div class="stat-label">Achievement</div><div class="stat-value">87.7%</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(239,68,68,0.12);color:#ef4444">⚠️</div><div class="stat-label">Outstanding</div><div class="stat-value">$40,000</div></div>
    </div>

    <div class="grid grid-2" style="margin-top:var(--space-6)">
      <div class="card">
        <h3 style="margin-bottom:var(--space-4)">📈 Monthly Collection Trend</h3>
        <div style="height:300px">
          <canvas baseChart [datasets]="trendData.datasets" [labels]="trendData.labels" [options]="lineOptions" type="line"></canvas>
        </div>
      </div>
      <div class="card">
        <h3 style="margin-bottom:var(--space-4)">📊 Fee Type Distribution</h3>
        <div style="height:300px">
          <canvas baseChart [datasets]="pieData.datasets" [labels]="pieData.labels" [options]="pieOptions" type="doughnut"></canvas>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:var(--space-6)">
      <h3 style="margin-bottom:var(--space-4)">📋 Class-wise Collection</h3>
      <div style="height:300px">
        <canvas baseChart [datasets]="classData.datasets" [labels]="classData.labels" [options]="barOptions" type="bar"></canvas>
      </div>
    </div>
  `
})
export class FeeAnalyticsComponent implements OnInit {
  private api = inject(ApiService);

  trendData: ChartConfiguration<'line'>['data'] = {
    labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
    datasets: [
      { data: [32000, 45000, 52000, 48000, 61000, 55000, 67000, 58000], label: 'Collected', borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4 },
      { data: [38000, 42000, 50000, 55000, 60000, 58000, 65000, 62000], label: 'Target', borderColor: '#6366f1', borderDash: [5, 5], fill: false, tension: 0.4 },
    ]
  };

  pieData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Tuition', 'Transport', 'Lab', 'Library', 'Sports', 'Other'],
    datasets: [{ data: [65, 15, 8, 4, 5, 3], backgroundColor: ['#6366f1', '#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'] }]
  };

  classData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
    datasets: [
      { data: [28000, 31000, 29000, 35000, 33000, 27000, 30000, 34000, 36000, 32000], label: 'Collected', backgroundColor: '#6366f1' },
      { data: [3000, 4000, 6000, 2000, 5000, 8000, 4000, 3000, 2000, 5000], label: 'Pending', backgroundColor: 'rgba(99,102,241,0.2)' },
    ]
  };

  lineOptions: ChartConfiguration<'line'>['options'] = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { y: { beginAtZero: true, ticks: { callback: v => '$' + (Number(v)/1000) + 'k' } } } };
  pieOptions: ChartConfiguration<'doughnut'>['options'] = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } };
  barOptions: ChartConfiguration<'bar'>['options'] = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { callback: v => '$' + (Number(v)/1000) + 'k' } } } };

  ngOnInit(): void {}
}
